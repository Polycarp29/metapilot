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
            ->take(8)
            ->get();

        // 2. Get global high-score keywords
        $globalTrends = KeywordIntelligence::where('decay_status', 'rising')
            ->orderBy('global_score', 'desc')
            ->take(8)
            ->get();

        $topics = [];

        foreach ($localTrends as $trend) {
            $formatted = $this->formatTopic($trend->keyword);
            $topics[] = [
                'topic' => $formatted['title'],
                'keyword' => $trend->keyword,
                'source' => 'Local Trends',
                'relevance' => $trend->growth_rate,
                'type' => 'rising_star',
                'category' => $formatted['category'],
                'angle' => $formatted['angle']
            ];
        }

        foreach ($globalTrends as $trend) {
            $formatted = $this->formatTopic($trend->keyword);
            $topics[] = [
                'topic' => $formatted['title'],
                'keyword' => $trend->keyword,
                'source' => 'Global Intelligence',
                'relevance' => $trend->global_score,
                'type' => 'viral_potential',
                'category' => $formatted['category'],
                'angle' => $formatted['angle']
            ];
        }

        return $topics;
    }

    protected function formatTopic(string $keyword): array
    {
        $kw = ucwords($keyword);
        
        $options = [
            [
                'category' => 'Guide',
                'angle' => 'educational',
                'templates' => [
                    "Winning with {kw}: A Complete Guide",
                    "Mastering {kw}: Step-by-Step for 2026",
                    "The Ultimate {kw} Playbook for Success"
                ]
            ],
            [
                'category' => 'Trending',
                'angle' => 'analytical',
                'templates' => [
                    "Why {kw} is Taking Over the Market Right Now",
                    "The Rise of {kw}: What Changed?",
                    "{kw} Evolution: Trends You Can't Ignore"
                ]
            ],
            [
                'category' => 'Strategy',
                'angle' => 'practical',
                'templates' => [
                    "10 Tips for {kw} Success in 2026",
                    "How to Scale Your {kw} Strategy Fast",
                    "Common {kw} Mistakes and How to Avoid Them"
                ]
            ],
            [
                'category' => 'Future',
                'angle' => 'visionary',
                'templates' => [
                    "The Future of {kw}: Predictions for Next Year",
                    "Will {kw} Replace Traditional Methods?",
                    "Preparing for the Next Big Shift in {kw}"
                ]
            ]
        ];
        
        $set = $options[array_rand($options)];
        $template = $set['templates'][array_rand($set['templates'])];
        
        return [
            'title' => str_replace('{kw}', $kw, $template),
            'category' => $set['category'],
            'angle' => $set['angle']
        ];
    }
}
