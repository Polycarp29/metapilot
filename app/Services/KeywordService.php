<?php

namespace App\Services;

use App\Models\KeywordResearch;
use App\Models\Organization;
use App\Traits\KeywordIntelligence;
use App\Services\SerperService;
use Illuminate\Support\Facades\Log;

class KeywordService
{
    use KeywordIntelligence;

    protected SerperService $serper;
    protected TrendsAnalysisService $trends;

    public function __construct(SerperService $serper, TrendsAnalysisService $trends)
    {
        $this->serper = $serper;
        $this->trends = $trends;
    }

    /**
     * Perform hybrid keyword research.
     * Checks cache first, then calls Serper API, classifies, and stores.
     */
    public function research(Organization $organization, string $query, string $gl = 'ke', string $hl = 'en'): array
    {
        // 1. Check Cache (within last 7 days)
        $cached = KeywordResearch::where('organization_id', $organization->id)
            ->where('query', strtolower($query))
            ->where('gl', $gl)
            ->where('hl', $hl)
            ->where('last_searched_at', '>', now()->subDays(7))
            ->first();

        if ($cached) {
            Log::info("Returning cached keyword research", ['query' => $query]);
            return [
                'results' => $cached->results,
                'intent' => $cached->intent,
                'niche' => $cached->niche,
                'growth_rate' => $cached->growth_rate,
                'current_interest' => $cached->current_interest,
                'cached' => true,
                'last_searched_at' => $cached->last_searched_at->diffForHumans(),
            ];
        }

        // 2. Call Serper API
        $results = $this->serper->search($query, $gl, $hl);

        if (!$results) {
            return [
                'results' => null,
                'error' => 'Failed to fetch results from search engine.'
            ];
        }

        // 2.5 Hybrid: Fetch Trend Data
        $trendMetrics = $this->trends->compareTrend($query);
        $growthRate = $trendMetrics['change'] ?? 0;
        $currentInterest = $trendMetrics['current'] ?? 0;

        // 3. Process & Classify
        $intent = $this->detectIntentFromSerp($results['organic'] ?? []);
        $niche = $this->determineNiche($organization, $query, $results['organic'] ?? []);

        // 4. Store Results
        $research = KeywordResearch::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'query' => strtolower($query),
                'gl' => $gl,
                'hl' => $hl,
            ],
            [
                'intent' => $intent,
                'niche' => $niche,
                'results' => $results,
                'growth_rate' => $growthRate,
                'current_interest' => $currentInterest,
                'last_searched_at' => now(),
            ]
        );

        return [
            'results' => $results,
            'intent' => $intent,
            'niche' => $niche,
            'growth_rate' => $growthRate,
            'current_interest' => $currentInterest,
            'cached' => false,
            'last_searched_at' => 'just now',
        ];
    }

    /**
     * Determine niche based on organization settings and search results.
     */
    protected function determineNiche(Organization $organization, string $query, array $organicResults): string
    {
        // ... (rest of the file)
        // Primary: User organization's niche if already detected
        $nicheIntel = $organization->nicheIntelligence;
        if ($nicheIntel && $nicheIntel->detected_niche) {
            return $nicheIntel->detected_niche;
        }

        // Secondary: Fallback to industry in settings
        if (isset($organization->settings['industry'])) {
            return $organization->settings['industry'];
        }

        // Tertiary: Basic keyword pattern matching if no org context
        $text = strtolower($query);
        $nicheMap = [
            'ecommerce' => ['shop', 'shoes', 'clothing', 'electronics', 'buy'],
            'saas' => ['software', 'platform', 'tool', 'automation', 'crm'],
            'real_estate' => ['property', 'house', 'apartment', 'rent', 'buy home'],
            'health' => ['medical', 'fitness', 'wellness', 'diet', 'vitamin'],
            'finance' => ['loan', 'credit', 'bank', 'invest', 'stock'],
            'travel' => ['flight', 'hotel', 'resort', 'vacation', 'tour'],
            'education' => ['course', 'university', 'degree', 'training', 'learn'],
        ];

        foreach ($nicheMap as $niche => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($text, $kw)) return $niche;
            }
        }

        return 'General';
    }
}
