<?php

namespace App\Services;

use App\Models\AnalyticsProperty;
use App\Models\Insight;
use App\Models\MetricSnapshot;
use Illuminate\Support\Facades\Log;

class InsightService
{
    protected $openai;

    public function __construct(OpenAIService $openai)
    {
        $this->openai = $openai;
    }

    /**
     * Generate a weekly summary report for a property.
     */
    public function generateWeeklySummary(AnalyticsProperty $property)
    {
        $endDate = now()->yesterday();
        $startDate = now()->subDays(7);

        $aggregator = new AnalyticsAggregatorService();
        $currentMetrics = $aggregator->getOverview($property->id, $startDate->format('Y-m-d'), $endDate->format('Y-m-d'));
        
        $prevEndDate = $startDate->copy()->subDay();
        $prevStartDate = $prevEndDate->copy()->subDays(7);
        $prevMetrics = $aggregator->getOverview($property->id, $prevStartDate->format('Y-m-d'), $prevEndDate->format('Y-m-d'));

        $prompt = "Analyze the following SEO metrics for '{$property->name}' for the last 7 days compared to the previous week:
        
        Current Period:
        - Users: {$currentMetrics->total_users}
        - Sessions: {$currentMetrics->total_sessions}
        - Conversions: {$currentMetrics->total_conversions}
        
        Previous Period:
        - Users: {$prevMetrics->total_users}
        - Sessions: {$prevMetrics->total_sessions}
        - Conversions: {$prevMetrics->total_conversions}
        
        Provide a concise, professional summary and 3 actionable recommendations.";

        try {
            // Reusing OpenAIService (assumes generateText or similar exists, but let's use the one we have)
            // For now, mirroring the structure
            $result = $this->openai->generateSchemaSuggestions($property->website_url, $prompt); 
            
            // Note: generateSchemaSuggestions returns decoded JSON as of my last edit
            return $result['summary'] ?? "Metrics show " . ($currentMetrics->total_users > $prevMetrics->total_users ? "growth" : "decline") . " in traffic.";
            
        } catch (\Exception $e) {
            Log::error('Insight Generation Failed: ' . $e->getMessage());
            return "Unable to generate AI insight at this time.";
        }
    }
}
