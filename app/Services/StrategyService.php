<?php

namespace App\Services;

use App\Models\AnalyticsProperty;
use App\Models\MetricSnapshot;
use App\Models\SeoCampaign;
use Illuminate\Support\Facades\Log;

class StrategyService
{
    protected $openai;

    public function __construct(OpenAIService $openai)
    {
        $this->openai = $openai;
    }

    /**
     * Analyze performance and suggest a new SEO campaign.
     */
    public function proposeCampaign(AnalyticsProperty $property)
    {
        $aggregator = new AnalyticsAggregatorService();
        $stats = $aggregator->getOverview($property->id, now()->subDays(30)->format('Y-m-d'), now()->yesterday()->format('Y-m-d'));

        // Identify "Low Hanging Fruit": High traffic, low conversion
        $prompt = "As an SEO Strategist, analyze this 30-day performance data for '{$property->name}':
        - Total Users: {$stats->total_users}
        - Total Conversions: {$stats->total_conversions}
        - Engagement Rate: " . ($stats->avg_engagement_rate * 100) . "%
        
        Suggest a specific SEO Campaign focusing on improving conversions. 
        Provide:
        1. Campaign Name
        2. Primary Objective
        3. 3-5 Target URLs or Keywords
        4. Strategic rationale based on the data.";

        try {
            $suggestion = $this->openai->generateSchemaSuggestions($property->website_url, $prompt);
            return $suggestion;
        } catch (\Exception $e) {
            Log::error('Campaign Proposal Failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Track the performance of a specific campaign by aggregating data for target URLs.
     */
    public function getCampaignPerformanceMetrics(SeoCampaign $campaign)
    {
        $propertyId = $campaign->analytics_property_id;
        $targetUrls = $campaign->target_urls ?: [];

        if (empty($targetUrls)) {
            return null;
        }

        // Fetch snapshots for the campaign period (or last 30 days)
        $snapshots = MetricSnapshot::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [
                $campaign->start_date ?: now()->subDays(30)->format('Y-m-d'),
                $campaign->end_date ?: now()->format('Y-m-d')
            ])
            ->get();

        $performance = [
            'total_users' => 0,
            'total_sessions' => 0,
            'total_conversions' => 0,
            'url_breakdown' => []
        ];

        foreach ($targetUrls as $url) {
            $performance['url_breakdown'][$url] = [
                'users' => 0,
                'sessions' => 0,
                'conversions' => 0
            ];
        }

        foreach ($snapshots as $snapshot) {
            $byPage = $snapshot->by_page ?: [];
            
            // Assuming byPage is an array of objects like { page: '/path', users: 10, ... }
            // or an associative array where key is the page path
            foreach ($byPage as $pagePath => $metrics) {
                // Determine if this page matches any target URL
                foreach ($targetUrls as $targetUrl) {
                    // Simple match (contains or exact)
                    if (str_contains($targetUrl, $pagePath) || str_contains($pagePath, $targetUrl)) {
                        $users = $metrics['users'] ?? 0;
                        $sessions = $metrics['sessions'] ?? 0;
                        $conversions = $metrics['conversions'] ?? 0;

                        $performance['total_users'] += $users;
                        $performance['total_sessions'] += $sessions;
                        $performance['total_conversions'] += $conversions;

                        $performance['url_breakdown'][$targetUrl]['users'] += $users;
                        $performance['url_breakdown'][$targetUrl]['sessions'] += $sessions;
                        $performance['url_breakdown'][$targetUrl]['conversions'] += $conversions;
                    }
                }
            }
        }

        return $performance;
    }
}
