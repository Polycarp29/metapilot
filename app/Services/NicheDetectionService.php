<?php

namespace App\Services;

use App\Models\NicheIntelligence;
use App\Models\Organization;
use App\Models\AnalyticsProperty;
use App\Models\MetricSnapshot;
use Illuminate\Support\Facades\Log;

class NicheDetectionService
{
    protected TrendsAnalysisService $trendsService;

    public function __construct(TrendsAnalysisService $trendsService)
    {
        $this->trendsService = $trendsService;
    }

    /**
     * Detect organization's niche from user settings or analytics data.
     */
    public function detectNiche(Organization $organization): ?NicheIntelligence
    {
        // 1. Check for explicit User Definition in Brand & AI Context
        $userDefinedNiche = $organization->settings['industry'] ?? null;
        $businessProfile = $organization->settings['business_profile'] ?? [];
        
        if ($userDefinedNiche) {
            $niche = strtolower(trim($userDefinedNiche));
            $confidence = 100.0;
            $evidence = [
                'source' => 'user_defined',
                'context' => $businessProfile,
                'last_verified' => now()->toDateTimeString()
            ];

            Log::info('User defined niche is:', [
                'niche' => $evidence,
                'source' => 'Database extraction'
            ]);
        } else {
            // 2. Fallback to Auto-Detection via Analytics
            $properties = $organization->analyticsProperties;
            
            if ($properties->isEmpty()) {
                Log::info("No analytics properties or user-defined industry found for organization", [
                    'organization_id' => $organization->id
                ]);
                return null;
            }

            // Collect data from all properties
            $allTopics = [];
            $allAudience = [];

            foreach ($properties as $property) {
                $topics = $this->extractKeyTopics($property);
                $audience = $this->extractAudienceData($property);
                
                $allTopics = array_merge($allTopics, $topics);
                $allAudience = array_merge($allAudience, $audience);
            }

            if (empty($allTopics)) {
                return null;
            }

            $niche = $this->matchIndustry($allTopics);
            $confidence = $this->calculateNicheConfidence($allTopics, $niche);
            $evidence = [
                'source' => 'auto_detected',
                'topics' => array_slice($allTopics, 0, 10),
                'audience' => $allAudience,
            ];
        }

        // 3. Common enrichment
        $benchmarks = $this->updateBenchmarks($niche);
        $trendKeywords = $this->getTrendingKeywords($niche);

        // Create or update niche intelligence
        return NicheIntelligence::updateOrCreate(
            ['organization_id' => $organization->id],
            [
                'detected_niche' => $niche,
                'confidence' => $confidence,
                'evidence' => $evidence,
                'industry_benchmarks' => $benchmarks,
                'trend_keywords' => $trendKeywords,
                'seasonal_patterns' => null,
                'last_updated_at' => now(),
            ]
        );
    }

    /**
     * Extract key topics from page data.
     */
    public function extractKeyTopics(AnalyticsProperty $property): array
    {
        $snapshots = MetricSnapshot::where('analytics_property_id', $property->id)
            ->whereBetween('snapshot_date', [now()->subDays(30), now()])
            ->get();

        $topics = [];

        foreach ($snapshots as $snapshot) {
            if (!empty($snapshot->by_page_title)) {
                foreach ($snapshot->by_page_title as $page => $data) {
                    // Extract keywords from page titles
                    $keywords = $this->extractKeywords($page);
                    foreach ($keywords as $keyword) {
                        if (!isset($topics[$keyword])) {
                            $topics[$keyword] = 0;
                        }
                        $topics[$keyword] += $data['views'] ?? 1;
                    }
                }
            }
        }

        // Sort by frequency
        arsort($topics);

        return array_keys(array_slice($topics, 0, 20));
    }

    /**
     * Match topics to industry categories.
     */
    public function matchIndustry(array $topics): string
    {
        // Industry keyword mapping from Database
        $industries = \App\Models\Industry::all();

        Log::info('Discorvered Industries', [
            'industries' => $industries,
        ]);

        $scores = [];
        foreach ($industries as $industry) {
            $score = 0;
            $keywords = $industry->keywords ?? [];
            foreach ($topics as $topic) {
                foreach ($keywords as $keyword) {
                    if (stripos($topic, $keyword) !== false) {
                        $score++;
                    }
                }
            }
            $scores[$industry->slug] = $score;
        }

        arsort($scores);
        $topIndustry = array_key_first($scores);

        return (!empty($scores) && $scores[$topIndustry] > 0) ? $topIndustry : 'general';
    }

    /**
     * Update industry benchmarks.
     */
    public function updateBenchmarks(string $niche): array
    {
        $industry = \App\Models\Industry::where('slug', $niche)->first();

        if ($industry && !empty($industry->benchmarks)) {
            return $industry->benchmarks;
        }

        // Default industry benchmarks
        return [
            'avg_session_duration' => 150,
            'bounce_rate' => 50,
            'conversion_rate' => 2.0,
            'avg_ctr' => 3.0,
        ];
    }

    /**
     * Extract audience data.
     */
    protected function extractAudienceData(AnalyticsProperty $property): array
    {
        $snapshots = MetricSnapshot::where('analytics_property_id', $property->id)
            ->whereBetween('snapshot_date', [now()->subDays(30), now()])
            ->get();

        $audience = [
            'countries' => [],
            'demographics' => [],
        ];

        foreach ($snapshots as $snapshot) {
            if (!empty($snapshot->by_country)) {
                foreach ($snapshot->by_country as $key => $data) {
                    $country = is_numeric($key) ? ($data['name'] ?? $data['country'] ?? $key) : $key;
                    if (!isset($audience['countries'][$country])) {
                        $audience['countries'][$country] = 0;
                    }
                    $audience['countries'][$country] += $data['users'] ?? $data['activeUsers'] ?? 0;
                }
            }

            if (!empty($snapshot->by_audience)) {
                foreach ($snapshot->by_audience as $segment => $data) {
                    if (!isset($audience['demographics'][$segment])) {
                        $audience['demographics'][$segment] = 0;
                    }
                    $audience['demographics'][$segment] += $data['activeUsers'] ?? 0;
                }
            }
        }

        return $audience;
    }

    /**
     * Extract keywords from text.
     */
    protected function extractKeywords(string $text): array
    {
        // Simple keyword extraction
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
        
        // Remove common stop words
        $stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        $words = explode(' ', $text);
        
        $keywords = array_filter($words, function ($word) use ($stopWords) {
            return strlen($word) > 3 && !in_array($word, $stopWords);
        });

        return array_values($keywords);
    }

    /**
     * Calculate niche confidence.
     */
    protected function calculateNicheConfidence(array $topics, string $niche): float
    {
        // Higher confidence with more topics
        $topicCount = count($topics);
        $baseConfidence = min(90, ($topicCount / 20) * 90);

        // Adjust based on niche specificity
        if ($niche === 'general') {
            $baseConfidence *= 0.5;
        }

        return round($baseConfidence, 2);
    }

    /**
     * Get trending keywords in niche.
     */
    protected function getTrendingKeywords(string $niche): array
    {
        // Placeholder - in production, fetch from Google Trends
        return [];
    }

    /**
     * Get top geographic locations based on traffic.
     * Returns top countries with their cities and user counts.
     */
    public function getTopGeoLocations(Organization $organization, int $limit = 3): array
    {
        $properties = $organization->analyticsProperties;
        
        if ($properties->isEmpty()) {
            return [];
        }

        $geoData = [];

        foreach ($properties as $property) {
            $snapshots = MetricSnapshot::where('analytics_property_id', $property->id)
                ->whereBetween('snapshot_date', [now()->subDays(30), now()])
                ->get();

            foreach ($snapshots as $snapshot) {
                if (!empty($snapshot->by_country)) {
                    foreach ($snapshot->by_country as $key => $data) {
                        $countryName = is_numeric($key) ? ($data['name'] ?? $data['country'] ?? $key) : $key;
                        $countryCode = $this->getCountryCode($countryName);
                        if (!isset($geoData[$countryCode])) {
                            $geoData[$countryCode] = [
                                'country' => $countryCode,
                                'users' => 0,
                                'cities' => [],
                            ];
                        }
                        $geoData[$countryCode]['users'] += $data['users'] ?? $data['activeUsers'] ?? 0;
                    }
                }

                // Extract city data if available
                if (!empty($snapshot->by_city)) {
                    foreach ($snapshot->by_city as $city => $data) {
                        // Try to determine country from city data or use default
                        $countryCode = $data['country'] ?? 'US';
                        if (isset($geoData[$countryCode])) {
                            if (!isset($geoData[$countryCode]['cities'][$city])) {
                                $geoData[$countryCode]['cities'][$city] = 0;
                            }
                            $geoData[$countryCode]['cities'][$city] += $data['users'] ?? 0;
                        }
                    }
                }
            }
        }

        // Sort by user count descending
        uasort($geoData, function ($a, $b) {
            return $b['users'] <=> $a['users'];
        });

        // Format results
        $results = [];
        $count = 0;

        foreach ($geoData as $countryCode => $data) {
            if ($count >= $limit) {
                break;
            }

            // Get top city for this country
            $topCity = null;
            if (!empty($data['cities'])) {
                arsort($data['cities']);
                $topCity = array_key_first($data['cities']);
            }

            $results[] = [
                'country' => $countryCode,
                'city' => $topCity,
                'users' => $data['users'],
            ];

            $count++;
        }

        return $results;
    }

    /**
     * Convert country name to ISO 2-letter code.
     * Simple implementation - in production, use a proper country mapping library.
     */
    protected function getCountryCode(string $countryName): string
    {
        $countryMap = [
            'United States' => 'US',
            'United Kingdom' => 'GB',
            'Canada' => 'CA',
            'Australia' => 'AU',
            'Germany' => 'DE',
            'France' => 'FR',
            'India' => 'IN',
            'Japan' => 'JP',
            'China' => 'CN',
            'Brazil' => 'BR',
            'Mexico' => 'MX',
            'Spain' => 'ES',
            'Italy' => 'IT',
            'Netherlands' => 'NL',
            'Sweden' => 'SE',
            'Switzerland' => 'CH',
            'Singapore' => 'SG',
            'South Korea' => 'KR',
            'Russia' => 'RU',
            'Poland' => 'PL',
        ];

        return $countryMap[$countryName] ?? strtoupper(substr($countryName, 0, 2));
    }
}
