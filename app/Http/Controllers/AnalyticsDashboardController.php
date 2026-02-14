<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsProperty;
use App\Services\AnalyticsAggregatorService;
use App\Services\InsightService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AnalyticsDashboardController extends Controller
{
    protected $aggregator;
    protected $insightService;

    public function __construct(AnalyticsAggregatorService $aggregator, InsightService $insightService)
    {
        $this->aggregator = $aggregator;
        $this->insightService = $insightService;
    }

    public function index(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        
        if (!$organization) {
            return redirect()->route('dashboard')->with('error', 'Please select an organization first.');
        }

        $properties = $organization->analyticsProperties()->where('is_active', true)->get();

        return Inertia::render('Analytics/Dashboard', [
            'properties' => $properties,
            'organization' => $organization,
        ]);
    }

    /**
     * Get summary metrics for a property.
     */
    public function getOverview(AnalyticsProperty $property, Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        if (!$startDate || !$endDate) {
            $days = $request->get('days', 30);
            $endDate = now()->yesterday()->format('Y-m-d');
            $startDate = now()->subDays($days)->format('Y-m-d');
        }

        Log::info("Fetching analytics overview for property {$property->id} from {$startDate} to {$endDate}.");
        
        $overview = $this->aggregator->getOverview($property->id, $startDate, $endDate);
        
        Log::debug("Analytics overview data for property {$property->id}: " . json_encode($overview));

        return response()->json($overview);
    }

    /**
     * Get trend data for charts.
     */
    public function getTrends(AnalyticsProperty $property, Request $request)
    {
        $metric = $request->get('metric', 'users');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        if (!$startDate || !$endDate) {
            $days = $request->get('days', 30);
            $endDate = now()->yesterday()->format('Y-m-d');
            $startDate = now()->subDays($days)->format('Y-m-d');
        }

        Log::info("Fetching analytics trends for property {$property->id}, metric: {$metric}, from {$startDate} to {$endDate}.");

        $trends = $this->aggregator->getTrendData($property->id, $startDate, $endDate);
        
        Log::debug("Analytics trend data for property {$property->id} ({$metric}): " . json_encode($trends));

        return response()->json($trends);
    }
    /**
     * Get insights for a property.
     */
    public function getInsights(AnalyticsProperty $property, Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        if (!$startDate || !$endDate) {
            $days = $request->get('days', 30);
            $endDate = now()->yesterday()->format('Y-m-d');
            $startDate = now()->subDays($days)->format('Y-m-d');
        }

        Log::info("AI Insight request for property {$property->id} [Range: {$startDate} to {$endDate}]" . ($request->has('refresh') ? " (FORCE REFRESH)" : ""));

        // Try to get existing recent insight for this range
        $insight = $property->insights()
            ->where('type', 'analytics_summary')
            ->orderBy('insight_at', 'desc')
            ->first();

        // If no insight or user forces refresh (could add a flag), generate new
        if (!$insight || $request->has('refresh')) {
            Log::info("No cached insight found or refresh triggered for property {$property->id}. Starting generation...");
            $insight = $this->insightService->generateDynamicInsight($property, $startDate, $endDate);
            if ($insight) {
                Log::info("AI Insight generation successful for property {$property->id}.");
            } else {
                Log::warning("AI Insight generation failed for property {$property->id}.");
            }
        } else {
            Log::info("Serving cached AI insight for property {$property->id} (Created at: {$insight->insight_at}).");
        }

        return response()->json($insight);
    }
}
