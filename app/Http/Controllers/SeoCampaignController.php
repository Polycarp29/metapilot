<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsProperty;
use App\Models\SeoCampaign;
use App\Services\StrategyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SeoCampaignController extends Controller
{
    protected $strategyService;

    public function __construct(StrategyService $strategyService)
    {
        $this->strategyService = $strategyService;
    }

    public function index(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        $campaigns = $organization->seoCampaigns()->with('property')->latest()->get();
        $properties = $organization->analyticsProperties()->where('is_active', true)->get();

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'properties' => $properties,
        ]);
    }

    public function create(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        $properties = $organization->analyticsProperties()->where('is_active', true)->get();

        return Inertia::render('Campaigns/Create', [
            'properties' => $properties,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'analytics_property_id' => 'required|exists:analytics_properties,id',
            'name' => 'required|string|max:255',
            'objective' => 'nullable|string',
            'target_urls' => 'nullable|array',
            'keywords' => 'nullable|array',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $campaign = $request->user()->currentOrganization()->seoCampaigns()->create($validated);

        return redirect()->route('campaigns.index')->with('success', 'Campaign created effectively.');
    }

    public function show(SeoCampaign $campaign, Request $request)
    {
        $this->authorize('view', $campaign);
        $campaign->load('property');

        return Inertia::render('Campaigns/Show', [
            'campaign' => $campaign,
        ]);
    }

    /**
     * Get real-time performance data for a campaign.
     */
    public function performance(SeoCampaign $campaign)
    {
        $this->authorize('view', $campaign);
        $performance = $this->strategyService->getCampaignPerformanceMetrics($campaign);

        return response()->json($performance);
    }

    /**
     * Get an AI-powered campaign proposal.
     */
    public function propose(AnalyticsProperty $property)
    {
        $proposal = $this->strategyService->proposeCampaign($property);

        return response()->json($proposal);
    }
}
