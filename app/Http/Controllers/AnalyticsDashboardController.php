<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsProperty;
use App\Services\AnalyticsAggregatorService;
use App\Services\InsightService;
use Illuminate\Http\Request;
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
        $days = $request->get('days', 30);
        $endDate = now()->yesterday()->format('Y-m-d');
        $startDate = now()->subDays($days)->format('Y-m-d');

        $overview = $this->aggregator->getOverview($property->id, $startDate, $endDate);

        return response()->json($overview);
    }

    /**
     * Get trend data for charts.
     */
    public function getTrends(AnalyticsProperty $property, Request $request)
    {
        $metric = $request->get('metric', 'users');
        $days = $request->get('days', 30);

        $trends = $this->aggregator->getTrendData($property->id, $metric, $days);

        return response()->json($trends);
    }
}
