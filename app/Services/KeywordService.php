<?php

namespace App\Services;

use App\Models\KeywordResearch;
use App\Models\Organization;
use App\Services\SerperService;
use Illuminate\Support\Facades\Log;

class KeywordService
{
    protected SerperService $serper;

    public function __construct(SerperService $serper)
    {
        $this->serper = $serper;
    }

    /**
     * Perform hybrid keyword research.
     * Checks cache first, then calls Serper API, classifies, and stores.
     */
    public function research(Organization $organization, string $query, string $gl = 'us', string $hl = 'en'): array
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

        // 3. Process & Classify
        $intent = $this->detectIntent($results['organic'] ?? []);
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
                'last_searched_at' => now(),
            ]
        );

        return [
            'results' => $results,
            'intent' => $intent,
            'niche' => $niche,
            'cached' => false,
            'last_searched_at' => 'just now',
        ];
    }

    /**
     * Detect intent based on search results.
     */
    protected function detectIntent(array $organicResults): string
    {
        if (empty($organicResults)) return 'Unknown';

        $text = '';
        foreach (array_slice($organicResults, 0, 5) as $result) {
            $text .= ($result['title'] ?? '') . ' ' . ($result['snippet'] ?? '') . ' ';
        }
        $text = strtolower($text);

        if (preg_match('/buy|price|shop|discount|coupon|shipping|store|cheap/', $text)) return 'Commercial';
        if (preg_match('/how to|what is|guide|tutorial|steps|learn|meaning|why/', $text)) return 'Informational';
        if (preg_match('/best|review|top|comparison|vs|rating/', $text)) return 'Transactional';
        if (preg_match('/login|sign in|official|portal|dashboard/', $text)) return 'Navigational';

        return 'Informational'; // Default fallback
    }

    /**
     * Determine niche based on organization settings and search results.
     */
    protected function determineNiche(Organization $organization, string $query, array $organicResults): string
    {
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
