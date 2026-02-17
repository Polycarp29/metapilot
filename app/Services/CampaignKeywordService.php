<?php

namespace App\Services;

use App\Models\TrendingKeyword;
use App\Models\Organization;
use App\Models\SeoCampaign;
use Illuminate\Support\Facades\Log;

class CampaignKeywordService
{
    protected NicheDetectionService $nicheDetection;
    protected TrendsAnalysisService $trendsAnalysis;

    public function __construct(
        NicheDetectionService $nicheDetection,
        TrendsAnalysisService $trendsAnalysis
    ) {
        $this->nicheDetection = $nicheDetection;
        $this->trendsAnalysis = $trendsAnalysis;
    }

    /**
     * Discover and store trending keywords for an organization.
     * Automatically uses top geographic locations from analytics.
     */
    public function discoverTrendingKeywords(Organization $organization): array
    {
        Log::info("Discovering trending keywords", [
            'organization_id' => $organization->id
        ]);

        // Get niche and top geolocations
        $niche = $organization->nicheIntelligence;
        if (!$niche) {
            Log::info("Attempting fallback niche detection from settings", [
                'organization_id' => $organization->id
            ]);
            
            $industry = $organization->settings['industry'] ?? null;
            if ($industry) {
                $niche = \App\Models\NicheIntelligence::updateOrCreate(
                    ['organization_id' => $organization->id],
                    [
                        'detected_niche' => strtolower($industry),
                        'confidence' => 100,
                        'last_updated_at' => now(),
                    ]
                );
            }
        }

        if (!$niche) {
            Log::error("Cannot discover keywords without niche", [
                'organization_id' => $organization->id
            ]);
            return [];
        }

        $geoLocations = $this->nicheDetection->getTopGeoLocations($organization, 3);
        
        if (empty($geoLocations)) {
            Log::info("No geo data available, using default fallback (US)", [
                'organization_id' => $organization->id
            ]);
            $geoLocations = [
                ['country' => 'US', 'city' => null, 'users' => 0]
            ];
        }

        $discoveredKeywords = [];

        // Get base keywords from niche
        $baseKeywords = $niche->trend_keywords ?? $this->getDefaultKeywordsForNiche($niche->detected_niche);

        foreach ($geoLocations as $location) {
            $countryCode = $location['country'];
            
            Log::info("Fetching trends for geo", [
                'country' => $countryCode,
                'users' => $location['users'] ?? 0
            ]);

            // Detect trending topics for this geo
            $trending = $this->trendsAnalysis->detectTrendingByGeo(
                $organization,
                $countryCode,
                $baseKeywords
            );

            foreach ($trending as $trendData) {
                // Store each trending keyword
                $keyword = TrendingKeyword::updateOrCreate(
                    [
                        'organization_id' => $organization->id,
                        'keyword' => $trendData['keyword'],
                        'country_code' => $countryCode,
                        'niche' => $niche->detected_niche,
                    ],
                    [
                        'city' => $location['city'] ?? null,
                        'growth_rate' => $trendData['growth_rate'],
                        'current_interest' => $trendData['current_interest'],
                        'related_queries' => $trendData['related_queries'] ?? null,
                        'recommendation_type' => $this->classifyRecommendation($trendData),
                        'trending_date' => now()->toDateString(),
                    ]
                );

                $discoveredKeywords[] = $keyword;
            }
        }

        Log::info("Keyword discovery complete", [
            'organization_id' => $organization->id,
            'keywords_discovered' => count($discoveredKeywords)
        ]);

        return $discoveredKeywords;
    }

    /**
     * Get keyword suggestions for a specific geo location.
     */
    public function getSuggestionsForGeo(
        Organization $organization,
        string $countryCode,
        int $limit = 20
    ): array {
        return TrendingKeyword::where('organization_id', $organization->id)
            ->where('country_code', $countryCode)
            ->unused()
            ->recent(30)
            ->orderBy('growth_rate', 'desc')
            ->limit($limit)
            ->get()
            ->groupBy('recommendation_type')
            ->toArray();
    }

    /**
     * Get all suggestions grouped by geo.
     */
    public function getAllSuggestions(Organization $organization, int $daysRecent = 30): array
    {
        $keywords = TrendingKeyword::where('organization_id', $organization->id)
            ->unused()
            ->recent($daysRecent)
            ->orderBy('growth_rate', 'desc')
            ->get();

        return $keywords->groupBy('country_code')->map(function ($countryKeywords) {
            return $countryKeywords->groupBy('recommendation_type')->toArray();
        })->toArray();
    }

    /**
     * Mark keywords as used in a campaign.
     */
    public function markKeywordsUsed(array $keywordIds, int $campaignId): void
    {
        TrendingKeyword::whereIn('id', $keywordIds)
            ->update(['used_in_campaign' => true]);

        Log::info("Marked keywords as used", [
            'campaign_id' => $campaignId,
            'keyword_count' => count($keywordIds)
        ]);
    }

    /**
     * Get performance report for used keywords in a campaign.
     */
    public function getKeywordPerformance(SeoCampaign $campaign): array
    {
        $keywords = $campaign->trendingKeywords;

        return $keywords->map(function ($keyword) {
            return [
                'keyword' => $keyword->keyword,
                'country' => $keyword->country_code,
                'growth_rate' => $keyword->growth_rate,
                'interest' => $keyword->current_interest,
                'type' => $keyword->recommendation_type,
                'attached_at' => $keyword->pivot->created_at,
            ];
        })->toArray();
    }

    /**
     * Classify recommendation type based on metrics.
     */
    protected function classifyRecommendation(array $trendData): string
    {
        $growth = $trendData['growth_rate'];
        $interest = $trendData['current_interest'];

        if ($growth > 50 && $interest > 70) {
            return 'high_potential';
        } elseif ($growth > 30 || $interest > 60) {
            return 'rising';
        } else {
            return 'seasonal';
        }
    }

    /**
     * Get default keywords for a niche when trend keywords aren't available.
     */
    protected function getDefaultKeywordsForNiche(string $niche): array
    {
        $defaults = [
            'ecommerce' => ['online shopping', 'buy online', 'deals', 'discount'],
            'saas' => ['software', 'cloud platform', 'automation tool', 'app'],
            'blog' => ['guide', 'tutorial', 'how to', 'tips'],
            'education' => ['course', 'learn', 'training', 'certification'],
            'real_estate' => ['property', 'house for sale', 'apartment', 'real estate'],
            'health' => ['health tips', 'wellness', 'fitness', 'nutrition'],
            'finance' => ['investment', 'savings', 'financial planning', 'banking'],
            'travel' => ['travel guide', 'destination', 'vacation', 'hotel'],
            'food' => ['recipe', 'cooking', 'restaurant', 'food delivery'],
            'betting' => ['sports betting', 'betting tips', 'odds', 'online casino'],
            'casino' => ['casino games', 'slots', 'poker', 'gambling'],
        ];

        return $defaults[$niche] ?? ['trending', 'popular', 'best'];
    }
}
