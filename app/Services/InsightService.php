<?php

namespace App\Services;

use App\Models\AnalyticsProperty;
use App\Models\Insight;
use App\Models\MetricSnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class InsightService
{
    protected $openai;
    protected $aggregator;

    public function __construct(OpenAIService $openai, AnalyticsAggregatorService $aggregator)
    {
        $this->openai = $openai;
        $this->aggregator = $aggregator;
    }

    /**
     * Generate dynamic insights for a property and date range.
     */
    public function generateDynamicInsight(AnalyticsProperty $property, string $startDate, string $endDate)
    {
        // Check if AI insights are enabled for this organization
        $org = $property->organization;
        if ($org && ($org->settings['ai_insights_enabled'] ?? true) === false) {
            Log::info("AI Insights are disabled for organization: {$org->id}. Skipping generation.");
            return null;
        }

        // Set AI Model based on settings
        $aiModel = $org->settings['ai_model'] ?? 'gpt-4-turbo';
        $this->openai->setModel($aiModel);

        $currentStart = Carbon::parse($startDate);
        $currentEnd = Carbon::parse($endDate);
        
        $days = $currentStart->diffInDays($currentEnd) + 1;
        
        $prevEnd = $currentStart->copy()->subDay();
        $prevStart = $prevEnd->copy()->subDays($days - 1);

        $currentRaw = $this->aggregator->getOverview($property->id, $currentStart->format('Y-m-d'), $currentEnd->format('Y-m-d'));
        $prevRaw = $this->aggregator->getOverview($property->id, $prevStart->format('Y-m-d'), $prevEnd->format('Y-m-d'));

        if (!$currentRaw || !$prevRaw) {
            return null;
        }

        $currentData = $this->formatMetricsForAi($currentRaw);
        $prevData = $this->formatMetricsForAi($prevRaw);

        // Include top keywords if available
        $currentData['top_keywords'] = $currentRaw['top_queries'] ?? [];

        // Apply organization AI model preference
        $org = $property->organization;
        if ($org && !empty($org->settings['ai_model'])) {
            $this->openai->setModel($org->settings['ai_model']);
            Log::info("Using organization-specific AI model: {$org->settings['ai_model']} for property: {$property->id}");
        }

        try {
            $insightData = $this->openai->analyzeAnalyticsData($property->name, $currentData, $prevData);
            
            if ($insightData) {
                return Insight::create([
                    'analytics_property_id' => $property->id,
                    'title' => "Performance Analysis: {$currentStart->format('M j')} - {$currentEnd->format('M j, Y')}",
                    'body' => $insightData['summary'],
                    'context' => $insightData,
                    'type' => 'analytics_summary',
                    'severity' => $insightData['severity'] ?? 'low',
                    'insight_at' => now(),
                    'start_date' => $currentStart->format('Y-m-d'),
                    'end_date' => $currentEnd->format('Y-m-d'),
                ]);
            }
            return null;
        } catch (\Exception $e) {
            Log::error('Dynamic Insight Generation Failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate a weekly summary report for a property.
     */
    public function generateWeeklySummary(AnalyticsProperty $property)
    {
        $endDate = now()->yesterday();
        $startDate = now()->subDays(7);
        return $this->generateDynamicInsight($property, $startDate->format('Y-m-d'), $endDate->format('Y-m-d'));
    }

    /**
     * Format raw metrics for better AI consumption.
     */
    protected function formatMetricsForAi($metrics)
    {
        return [
            'total_users' => (int) ($metrics['total_users'] ?? 0),
            'total_sessions' => (int) ($metrics['total_sessions'] ?? 0),
            'total_conversions' => (int) ($metrics['total_conversions'] ?? 0),
            'total_clicks' => (int) ($metrics['total_clicks'] ?? 0),
            'total_impressions' => (int) ($metrics['total_impressions'] ?? 0),
            'avg_ctr' => round(($metrics['avg_ctr'] ?? 0) * 100, 2) . '%',
            'avg_position' => round($metrics['avg_position'] ?? 0, 1),
            'avg_engagement_rate' => round(($metrics['avg_engagement_rate'] ?? 0) * 100, 2) . '%',
            'avg_session_duration' => $this->formatDuration((float) ($metrics['avg_duration'] ?? 0)),
        ];
    }

    /**
     * Generate Ad Performance Insight based on Industry.
     */
    public function generateAdPerformanceInsight(AnalyticsProperty $property, array $adData)
    {
        // Check if AI insights are enabled
        $org = $property->organization;
        if ($org && ($org->settings['ai_insights_enabled'] ?? true) === false) {
            return null;
        }

        // Get Industry & Business Profile
        $industry = $org->settings['industry'] ?? 'General Business';
        $businessProfile = $org->settings['business_profile'] ?? [];
        
        // Set AI Model based on settings
        $aiModel = $org->settings['ai_model'] ?? 'gpt-4-turbo'; // Default to turbo if not set
        $this->openai->setModel($aiModel);

        // Prepare Data for AI
        // We only send campaigns that have ad spend to save tokens and focus on ads
        $activeCampaigns = array_filter($adData, fn($c) => ($c['ad_cost'] ?? 0) > 0);
        
        // If no active ad campaigns, return no insight
        if (empty($activeCampaigns)) {
            return null;
        }

        // Simplify data for prompt
        $campaignSummary = array_map(function($c) {
            return [
                'name' => $c['campaign'],
                'cost' => $c['ad_cost'],
                'clicks' => $c['ad_clicks'],
                'roas' => $c['roas'],
                'top_keywords' => array_column(($c['keywords'] ?? []), 'keyword'),
            ];
        }, array_values($activeCampaigns));

        $promptContext = [
            'industry' => $industry,
            'business_profile' => $businessProfile,
            'campaigns' => $campaignSummary,
            'trends_year' => date('Y'),
        ];

        try {
            // We use a specialized prompt for Ad Analysis
            $response = $this->openai->analyzeAdPerformance($property->name, $promptContext);

            if ($response) {
                return Insight::create([
                    'analytics_property_id' => $property->id,
                    'title' => "Ad Performance Strategies ({$industry})",
                    'body' => $response['summary'],
                    'context' => $response,
                    'type' => 'ad_performance',
                    'severity' => 'info',
                    'insight_at' => now(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Ad Performance Insight Generation Failed: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Format seconds into a human-readable duration string.
     */
    private function formatDuration(float $seconds): string
    {
        if ($seconds < 1) return '0s';
        
        $minutes = floor($seconds / 60);
        $remainingSeconds = (int) round($seconds % 60);
        
        if ($minutes > 0) {
            return "{$minutes}m {$remainingSeconds}s";
        }
        
        return "{$remainingSeconds}s";
    }
}
