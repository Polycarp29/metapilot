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
    protected $ga4Service;
    protected $gscService;
    protected $forecastService;
    protected $controlEngine;

    public function __construct(
        AnalyticsAggregatorService $aggregator, 
        InsightService $insightService,
        \App\Services\Ga4Service $ga4Service,
        \App\Services\GscService $gscService,
        \App\Services\ForecastService $forecastService,
        \App\Services\ControlEngineService $controlEngine
    ) {
        $this->aggregator = $aggregator;
        $this->insightService = $insightService;
        $this->ga4Service = $ga4Service;
        $this->gscService = $gscService;
        $this->forecastService = $forecastService;
        $this->controlEngine = $controlEngine;
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
            $days = (int) $request->get('days', 30);
            
            if ($days === 0) {
                // Today
                $startDate = now()->format('Y-m-d');
                $endDate = now()->format('Y-m-d');
            } elseif ($days === 1) {
                // Yesterday
                $startDate = now()->subDay()->format('Y-m-d');
                $endDate = now()->subDay()->format('Y-m-d');
            } else {
                // Last X Days (e.g. 7, 30, 90)
                $endDate = now()->yesterday()->format('Y-m-d');
                $startDate = now()->subDays($days)->format('Y-m-d');
            }
        } else {
             // Ensure dates are formatted correctly just in case
            $startDate = \Carbon\Carbon::parse($startDate)->format('Y-m-d');
            $endDate = \Carbon\Carbon::parse($endDate)->format('Y-m-d');
        }

        Log::info("Fetching analytics overview for property {$property->id} from {$startDate} to {$endDate}." . ($request->has('refresh') ? " (FORCE REFRESH)" : ""));
        
        $syncingQueued = false;
        if ($request->has('refresh')) {
            \App\Jobs\SyncPropertyDataJob::dispatch($property);
            $syncingQueued = true;
        }

        $overview = $this->aggregator->getOverview($property->id, $startDate, $endDate);
        $overview['syncing_queued'] = $syncingQueued;
        
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
            $days = (int) $request->get('days', 30);
            
            if ($days === 0) {
                // Today
                $startDate = now()->format('Y-m-d');
                $endDate = now()->format('Y-m-d');
            } elseif ($days === 1) {
                // Yesterday
                $startDate = now()->subDay()->format('Y-m-d');
                $endDate = now()->subDay()->format('Y-m-d');
            } else {
                // Last X Days (e.g. 7, 30, 90)
                $endDate = now()->yesterday()->format('Y-m-d');
                $startDate = now()->subDays($days)->format('Y-m-d');
            }
        } else {
             // Ensure dates are formatted correctly just in case
            $startDate = \Carbon\Carbon::parse($startDate)->format('Y-m-d');
            $endDate = \Carbon\Carbon::parse($endDate)->format('Y-m-d');
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
            $days = (int) $request->get('days', 30);
            
            if ($days === 0) {
                // Today
                $startDate = now()->format('Y-m-d');
                $endDate = now()->format('Y-m-d');
            } elseif ($days === 1) {
                // Yesterday
                $startDate = now()->subDay()->format('Y-m-d');
                $endDate = now()->subDay()->format('Y-m-d');
            } else {
                // Last X Days (e.g. 7, 30, 90)
                $endDate = now()->yesterday()->format('Y-m-d');
                $startDate = now()->subDays($days)->format('Y-m-d');
            }
        } else {
             // Ensure dates are formatted correctly just in case
            $startDate = \Carbon\Carbon::parse($startDate)->format('Y-m-d');
            $endDate = \Carbon\Carbon::parse($endDate)->format('Y-m-d');
        }

        Log::info("AI Insight request for property {$property->id} [Range: {$startDate} to {$endDate}]" . ($request->has('refresh') ? " (FORCE REFRESH)" : ""));

        // Try to get existing recent insight for this range
        $insight = $property->insights()
            ->where('type', 'analytics_summary')
            ->where('start_date', $startDate)
            ->where('end_date', $endDate)
            ->orderBy('insight_at', 'desc')
            ->first();

        // If no insight or user forces refresh (could add a flag), generate new
        if (!$insight || $request->has('refresh')) {
            Log::info("No cached insight found for range [{$startDate} - {$endDate}] or refresh triggered. Starting generation...");
            $insight = $this->insightService->generateDynamicInsight($property, $startDate, $endDate);
            if ($insight) {
                Log::info("AI Insight generation successful for property {$property->id}.");
            } else {
                Log::warning("AI Insight generation failed for property {$property->id}.");
            }
        } else {
            Log::info("Serving cached AI insight for property {$property->id} (Created at: {$insight->insight_at}).");
        }

        auth()->user()->logActivity('analytics_insight_view', "Viewed AI insights for property: {$property->name}", [
            'property_id' => $property->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'generated_new' => (!$insight || $request->has('refresh'))
        ], $property->organization_id);

        return response()->json($insight);
    }

    public function getAcquisition(AnalyticsProperty $property, Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        if (!$startDate || !$endDate) {
            $days = (int) $request->get('days', 30);
            
            if ($days === 0) {
                // Today
                $startDate = now()->format('Y-m-d');
                $endDate = now()->format('Y-m-d');
            } elseif ($days === 1) {
                // Yesterday
                $startDate = now()->subDay()->format('Y-m-d');
                $endDate = now()->subDay()->format('Y-m-d');
            } else {
                // Last X Days
                $endDate = now()->yesterday()->format('Y-m-d');
                $startDate = now()->subDays($days)->format('Y-m-d');
            }
        } else {
            $startDate = \Carbon\Carbon::parse($startDate)->format('Y-m-d');
            $endDate = \Carbon\Carbon::parse($endDate)->format('Y-m-d');
        }

        $campaigns = $this->ga4Service->fetchCampaigns($property, $startDate, $endDate);
        
        return response()->json($campaigns);
    }

    /**
     * Generate Ad Performance Insights.
     */
    public function getAdInsights(AnalyticsProperty $property, Request $request)
    {
        $adData = $request->input('ad_data', []);
        $industry = $request->input('industry');
        
        if (empty($adData)) {
            return response()->json(['error' => 'No ad data provided'], 400);
        }

        // Save Industry if provided
        if ($industry) {
            $org = $property->organization;
            if ($org) {
                // Update settings using array merging to preserve other settings
                $settings = $org->settings ?? [];
                $settings['industry'] = $industry;
                $org->settings = $settings;
                $org->save();
            }
        }

        try {
            $insight = $this->insightService->generateAdPerformanceInsight($property, $adData);

            auth()->user()->logActivity('ad_insight_generate', "Generated ad performance insights for property: {$property->name}", [
                'property_id' => $property->id,
                'industry' => $industry
            ], $property->organization_id);

            return response()->json($insight);
        } catch (\Exception $e) {
            Log::error("Ad Insight Generation Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to generate ad insights'], 500);
        }
    }

    /**
     * Get predictive forecast for the property.
     */
    public function getForecast(AnalyticsProperty $property, Request $request)
    {
        $lookback = (int) $request->get('lookback', 30);
        $days = (int) $request->get('days', 14);

        $forecast = $this->forecastService->forecast($property->id, $lookback, $days);

        return response()->json($forecast);
    }

    /**
     * Get SEO intelligence alerts and technical health signals.
     */
    public function getSEOIntelligence(AnalyticsProperty $property)
    {
        $alerts = $this->controlEngine->getActiveAlerts($property->organization);
        $niche = $this->controlEngine->getNicheIntelligence($property->organization);

        return response()->json([
            'alerts' => $alerts,
            'niche' => $niche,
            'summary' => [
                'critical_count' => collect($alerts)->where('severity', 'critical')->count(),
                'high_count' => collect($alerts)->where('severity', 'high')->count(),
                'opportunity_count' => collect($alerts)->where('alert_type', 'trend_opportunity')->count(),
            ]
        ]);
    }
}
