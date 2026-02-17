<?php

namespace App\Services;

use App\Models\GoogleTrendsCache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class TrendsAnalysisService
{
    protected int $cacheHours;
    protected int $rateLimit;

    public function __construct()
    {
        $this->cacheHours = config('services.google_trends.cache_duration', 24);
        $this->rateLimit = config('services.google_trends.rate_limit_per_hour', 100);
    }

    /**
     * Fetch trend data with caching.
     */
    public function fetchTrendData(
        string $keyword,
        string $geo = 'US',
        string $timeframe = 'today 12-m'
    ): ?array {
        // Check cache first
        $cached = $this->getCachedTrend($keyword, $geo, $timeframe);
        if ($cached) {
            Log::info("Using cached trend data", ['keyword' => $keyword]);
            return $cached->trend_data;
        }

        // Fetch from API
        try {
            $data = $this->fetchFromGoogleTrends($keyword, $geo, $timeframe);
            
            if ($data) {
                $this->cacheTrendData($keyword, $geo, $timeframe, $data);
                return $data;
            }
        } catch (\Exception $e) {
            Log::error("Failed to fetch Google Trends data", [
                'keyword' => $keyword,
                'error' => $e->getMessage()
            ]);
        }

        return null;
    }

    /**
     * Detect trending topics from keywords.
     */
    public function detectTrendingTopics(array $keywords, string $geo = 'US'): array
    {
        $trending = [];

        foreach ($keywords as $keyword) {
            $trend = $this->fetchTrendData($keyword, $geo, 'today 3-m');
            
            if ($trend && isset($trend['interest_over_time'])) {
                $growth = $this->calculateGrowth($trend['interest_over_time']);
                
                if ($growth > 20) { // 20% growth threshold
                    $trending[] = [
                        'keyword' => $keyword,
                        'growth_rate' => $growth,
                        'current_interest' => end($trend['interest_over_time'])['value'] ?? 0,
                    ];
                }
            }

            // Rate limiting - basic implementation
            usleep(100000); // 0.1 second delay
        }

        // Sort by growth rate
        usort($trending, function ($a, $b) {
            return $b['growth_rate'] <=> $a['growth_rate'];
        });

        return array_slice($trending, 0, 10); // Top 10
    }

    /**
     * Compare trend over time.
     */
    public function compareTrend(string $keyword, int $days = 30): array
    {
        $trend = $this->fetchTrendData($keyword, 'US', "today {$days}-d");
        
        if (!$trend || !isset($trend['interest_over_time'])) {
            return [
                'current' => 0,
                'previous' => 0,
                'change' => 0,
            ];
        }

        $data = $trend['interest_over_time'];
        $midPoint = intval(count($data) / 2);

        $previousPeriod = array_slice($data, 0, $midPoint);
        $currentPeriod = array_slice($data, $midPoint);

        $previousAvg = $this->calculateAverage($previousPeriod);
        $currentAvg = $this->calculateAverage($currentPeriod);

        $change = $previousAvg > 0 
            ? (($currentAvg - $previousAvg) / $previousAvg) * 100 
            : 0;

        return [
            'current' => $currentAvg,
            'previous' => $previousAvg,
            'change' => round($change, 2),
        ];
    }

    /**
     * Get related queries.
     */
    public function getRelatedQueries(string $keyword, string $geo = 'US'): array
    {
        $cached = $this->getCachedTrend($keyword, $geo);
        
        if ($cached && $cached->related_queries) {
            return $cached->related_queries;
        }

        // In a real implementation, fetch from Google Trends API
        // For now, return empty array
        return [];
    }

    /**
     * Analyze seasonality in trend data.
     */
    public function analyzeSeasonality(array $timeSeriesData): array
    {
        if (count($timeSeriesData) < 52) { // Need at least 1 year of weekly data
            return ['detected' => false];
        }

        // Simple seasonal decomposition
        // This is a placeholder for more sophisticated analysis
        $monthlyAverages = [];
        
        foreach ($timeSeriesData as $point) {
            $month = date('n', strtotime($point['date'] ?? 'now'));
            if (!isset($monthlyAverages[$month])) {
                $monthlyAverages[$month] = [];
            }
            $monthlyAverages[$month][] = $point['value'] ?? 0;
        }

        $seasonalPattern = [];
        foreach ($monthlyAverages as $month => $values) {
            $seasonalPattern[$month] = array_sum($values) / count($values);
        }

        return [
            'detected' => true,
            'pattern' => $seasonalPattern,
            'period' => 'monthly',
        ];
    }

    /**
     * Get cached trend data.
     */
    protected function getCachedTrend(
        string $keyword,
        string $geo = 'US',
        ?string $timeframe = null
    ): ?GoogleTrendsCache {
        $query = GoogleTrendsCache::where('keyword', $keyword)
            ->where('geo', $geo);

        if ($timeframe) {
            $query->where('timeframe', $timeframe);
        }

        $cached = $query->where('fetched_at', '>', now()->subHours($this->cacheHours))
            ->first();

        return $cached;
    }

    /**
     * Cache trend data.
     */
    protected function cacheTrendData(
        string $keyword,
        string $geo,
        string $timeframe,
        array $data
    ): void {
        GoogleTrendsCache::create([
            'keyword' => $keyword,
            'geo' => $geo,
            'timeframe' => $timeframe,
            'trend_data' => $data,
            'related_queries' => $data['related_queries'] ?? null,
            'rising_queries' => $data['rising_queries'] ?? null,
            'fetched_at' => now(),
        ]);
    }

    /**
     * Fetch from Google Trends API using dual-fallback strategy.
     * 1. Try SerpAPI (Official/Paid)
     * 2. Try Custom Scraper (Unofficial/Free)
     * 3. Return null on failure
     */
    protected function fetchFromGoogleTrends(
        string $keyword,
        string $geo,
        string $timeframe
    ): ?array {
        // Strategy 1: SerpAPI (Primary)
        if (config('services.serpapi.api_key')) {
            try {
                $data = $this->fetchFromSerpApi($keyword, $geo, $timeframe);
                if ($data) return $data;
            } catch (\Exception $e) {
                Log::warning("SerpAPI failed, falling back to scraper", [
                    'keyword' => $keyword,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Strategy 2: Custom Scraper (Fallback)
        if (config('services.google_trends.fallback_enabled', true)) {
            try {
                // Initialize scraper on demand to avoid overhead if not needed
                $scraper = new \App\Services\GoogleTrends\GoogleTrendsScraper();
                $data = $scraper->fetchInterestOverTime($keyword, $geo, $timeframe);
                
                if ($data) {
                    Log::info("Fetched trends via scraper", ['keyword' => $keyword]);
                    return $data;
                }
            } catch (\Exception $e) {
                Log::error("Scraper fallback failed", [
                    'keyword' => $keyword,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return null;
    }

    /**
     * Fetch from SerpAPI.
     */
    protected function fetchFromSerpApi(string $keyword, string $geo, string $timeframe): ?array
    {
        $apiKey = config('services.serpapi.api_key');
        
        $response = Http::get('https://serpapi.com/search', [
            'engine' => 'google_trends',
            'q' => $keyword,
            'geo' => $geo,
            'date' => $this->convertTimeframeToSerpApi($timeframe),
            'api_key' => $apiKey
        ]);

        if (!$response->successful()) {
            throw new \Exception("SerpAPI Error: " . $response->status());
        }

        $json = $response->json();
        
        if (!isset($json['interest_over_time']['timeline_data'])) {
            return null;
        }

        // Transform to standard format
        $timeline = [];
        foreach ($json['interest_over_time']['timeline_data'] as $point) {
            $timeline[] = [
                'date' => $point['date'],
                'value' => $point['values'][0]['extracted_value'] ?? 0,
            ];
        }

        return [
            'interest_over_time' => $timeline,
            'related_queries' => $json['related_queries'] ?? [],
            'rising_queries' => $json['related_queries']['rising'] ?? [],
        ];
    }

    /**
     * Convert local timeframe format to SerpAPI format.
     */
    protected function convertTimeframeToSerpApi(string $timeframe): string
    {
        // Simple mapping - expand as needed
        if (str_contains($timeframe, 'today 12-m')) return 'today 12-m';
        if (str_contains($timeframe, 'today 3-m')) return 'today 3-m';
        if (str_contains($timeframe, 'now 7-d')) return 'now 7-d';
        
        return 'today 12-m'; // Default
    }

    /**
     * Calculate growth rate from time series.
     */
    protected function calculateGrowth(array $timeSeries): float
    {
        if (count($timeSeries) < 2) {
            return 0;
        }

        $firstHalf = array_slice($timeSeries, 0, intval(count($timeSeries) / 2));
        $secondHalf = array_slice($timeSeries, intval(count($timeSeries) / 2));

        $firstAvg = $this->calculateAverage($firstHalf);
        $secondAvg = $this->calculateAverage($secondHalf);

        if ($firstAvg == 0) {
            return 0;
        }

        return (($secondAvg - $firstAvg) / $firstAvg) * 100;
    }

    /**
     * Calculate average value from data points.
     */
    protected function calculateAverage(array $dataPoints): float
    {
        if (empty($dataPoints)) {
            return 0;
        }

        $sum = 0;
        foreach ($dataPoints as $point) {
            $sum += $point['value'] ?? 0;
        }

        return $sum / count($dataPoints);
    }

    /**
     * Detect trending topics for a specific geographic location.
     * Used by CampaignKeywordService for geo-targeted keyword suggestions.
     */
    public function detectTrendingByGeo(
        \App\Models\Organization $organization,
        string $countryCode,
        array $baseKeywords = []
    ): array {
        Log::info("Detecting trends for geo", [
            'organization_id' => $organization->id,
            'country' => $countryCode,
            'base_keywords' => count($baseKeywords)
        ]);

        $trending = [];

        // If no base keywords provided, return empty
        if (empty($baseKeywords)) {
            return [];
        }

        foreach ($baseKeywords as $keyword) {
            $trend = $this->fetchTrendData($keyword, $countryCode, 'today 3-m');
            
            if ($trend && isset($trend['interest_over_time'])) {
                $growthRate = $this->calculateGrowth($trend['interest_over_time']);
                $currentInterest = end($trend['interest_over_time'])['value'] ?? 0;
                
                // Only include if showing significant growth or high interest
                if ($growthRate > 15 || $currentInterest > 50) {
                    $trending[] = [
                        'keyword' => $keyword,
                        'growth_rate' => round($growthRate, 2),
                        'current_interest' => $currentInterest,
                        'related_queries' => $trend['related_queries'] ?? null,
                    ];
                }
            }

            // Rate limiting
            usleep(150000); // 0.15 second delay
        }

        // Sort by growth rate descending
        usort($trending, function ($a, $b) {
            return $b['growth_rate'] <=> $a['growth_rate'];
        });

        return array_slice($trending, 0, 15); // Top 15 for this geo
    }
}
