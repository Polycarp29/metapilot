<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\TrendingKeyword;
use App\Models\KeywordIntelligence;

class BlogTopicSuggestionService
{
    /**
     * Get trending topic suggestions for an organization.
     */
    public function getSuggestions(Organization $org): array
    {
        // 1. Get recent trending keywords for this org
        $localTrends = TrendingKeyword::where('organization_id', $org->id)
            ->where('created_at', '>=', now()->subDays(14))
            ->orderBy('growth_rate', 'desc')
            ->take(10)
            ->get();

        // 2. Get global high-score keywords (could filter by niche if org has one set)
        $globalTrends = KeywordIntelligence::where('decay_status', 'rising')
            ->orderBy('global_score', 'desc')
            ->take(10)
            ->get();

        $topics = [];

        foreach ($localTrends as $trend) {
            $topics[] = [
                'topic' => $this->formatTopic($trend->keyword),
                'keyword' => $trend->keyword,
                'source' => 'Local Trends',
                'relevance' => $trend->growth_rate,
                'type' => 'rising_star'
            ];
        }

        foreach ($globalTrends as $trend) {
            $topics[] = [
                'topic' => $this->formatTopic($trend->keyword),
                'keyword' => $trend->keyword,
                'source' => 'Global Intelligence',
                'relevance' => $trend->global_score,
                'type' => 'viral_potential'
            ];
        }

        return $topics;
    }

    protected function formatTopic(string $keyword): string
    {
        // Simple heuristic to make it sound like a headline
        $templates = [
            "Winning with {kw}: A Complete Guide",
            "Why {kw} is Trending Right Now",
            "10 Tips for {kw} Success in 2026",
            "The Future of {kw}: What You Need to Know",
            "Mastering {kw}: Best Practices"
        ];
        
        $template = $templates[array_rand($templates)];
        return str_replace('{kw}', ucwords($keyword), $template);
    }
}
