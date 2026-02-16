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
    protected $ga4Service;
    protected $gscService;

    public function __construct(
        AnalyticsAggregatorService $aggregator, 
        InsightService $insightService,
        \App\Services\Ga4Service $ga4Service,
        \App\Services\GscService $gscService
    ) {
        $this->aggregator = $aggregator;
        $this->insightService = $insightService;
        $this->ga4Service = $ga4Service;
        $this->gscService = $gscService;
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
        
        if ($request->has('refresh')) {
            $this->ga4Service->syncData($property, $startDate, $endDate);
            $this->gscService->syncData($property, $startDate, $endDate);
        }

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

        Log::info("Fetching analytics trends for property {$property->id}, metric: {$metric}, from {$startDate} to {$endDate}." . ($request->has('refresh') ? " (FORCE REFRESH)" : ""));

        if ($request->has('refresh')) {
            $this->ga4Service->syncData($property, $startDate, $endDate);
            $this->gscService->syncData($property, $startDate, $endDate);
        }

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
            return response()->json($insight);
        } catch (\Exception $e) {
            Log::error("Ad Insight Generation Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to generate ad insights'], 500);
        }
    }
}
