<?php

namespace App\Services;

use App\Models\TrendingKeyword;
use App\Models\Organization;
use App\Models\SeoCampaign;
use App\Traits\KeywordIntelligence;
use Illuminate\Support\Facades\Log;

class CampaignKeywordService
{
    use KeywordIntelligence;
    protected NicheDetectionService $nicheDetection;
    protected TrendsAnalysisService $trendsAnalysis;
    protected SerperService $serper;
    protected KeywordIntelligenceService $kiService;
    protected PythonEngineService $pythonEngine;

    public function __construct(
        NicheDetectionService $nicheDetection,
        TrendsAnalysisService $trendsAnalysis,
        SerperService $serper,
        KeywordIntelligenceService $kiService,
        PythonEngineService $pythonEngine
    ) {
        $this->nicheDetection = $nicheDetection;
        $this->trendsAnalysis = $trendsAnalysis;
        $this->serper = $serper;
        $this->kiService = $kiService;
        $this->pythonEngine = $pythonEngine;
    }

    /**
     * Discover and store trending keywords for an organization.
     */
    public function discoverTrendingKeywords(Organization $organization): array
    {
        Log::info("Discovering trending keywords via Python Engine", [
            'organization_id' => $organization->id
        ]);

        // 1. Get niche context
        $niche = $organization->nicheIntelligence ?? $this->nicheDetection->detectNiche($organization);

        if (!$niche) {
            Log::error("Cannot discover keywords without niche", ['organization_id' => $organization->id]);
            return [];
        }

        // 2. Determine target geolocations
        $geoLocations = $this->nicheDetection->getTopGeoLocations($organization, 3);
        if (empty($geoLocations)) {
            $geoLocations = [['country' => 'KE']];
        }

        // 3. Prepare niches/seeds for discovery
        $nichesToScan = [$niche->detected_niche];
        if (!empty($niche->trend_keywords)) {
            $nichesToScan = array_merge($nichesToScan, array_slice($niche->trend_keywords, 0, 3));
        }

        $discoveredKeywords = [];

        foreach ($geoLocations as $location) {
            $countryCode = $location['country'];
            
            try {
                Log::info("Calling Python Engine for smart discovery", [
                    'geo' => $countryCode,
                    'niches' => $nichesToScan,
                    'is_python_engine_up' => !!$this->pythonEngine
                ]);

                $response = $this->pythonEngine->getGlobalTrends($countryCode, $nichesToScan);
                
                if (!$response || empty($response['trends'])) {
                    continue;
                }

                foreach ($response['trends'] as $trendData) {
                    // Map Python engine data to TrendingKeyword model
                    $keyword = TrendingKeyword::updateOrCreate(
                        [
                            'organization_id' => $organization->id,
                            'keyword' => strtolower(trim($trendData['keyword'])),
                            'country_code' => $countryCode,
                            'niche' => $niche->detected_niche,
                        ],
                        [
                            'growth_rate' => $trendData['growth_rate'] ?? 50,
                            'current_interest' => $trendData['current_interest'] ?? 50,
                            'related_queries' => $trendData['related_queries'] ?? [],
                            'recommendation_type' => $this->classifyRecommendation($trendData),
                            'trending_date' => now()->toDateString(),
                            'origin' => 'python_engine_smart',
                        ]
                    );

                    // Sync to intelligence pool
                    try {
                        $this->kiService->upsertFromDiscovery([
                            'keyword' => $keyword->keyword,
                            'current_interest' => $keyword->current_interest,
                            'growth_rate' => $keyword->growth_rate,
                            'niche' => $keyword->niche,
                            'country_code' => $keyword->country_code,
                            'origin' => 'organization_smart_discovery'
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Intelligence sync failed", ['kw' => $keyword->keyword, 'err' => $e->getMessage()]);
                    }

                    $discoveredKeywords[] = $keyword;
                }
            } catch (\Exception $e) {
                Log::error("Python smart discovery failed for geo", [
                    'geo' => $countryCode,
                    'error' => $e->getMessage()
                ]);
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
        $growth = $trendData['growth_rate'] ?? 0;
        $interest = $trendData['current_interest'] ?? 0;

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
