<?php

namespace App\Http\Controllers;

use App\Models\TrendingKeyword;
use App\Models\SeoCampaign;
use App\Services\CampaignKeywordService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CampaignKeywordController extends Controller
{
    protected CampaignKeywordService $service;

    public function __construct(CampaignKeywordService $service)
    {
        $this->service = $service;
    }

    /**
     * Get trending keywords for the current organization.
     */
    public function index(Request $request)
    {
        $request->validate([
            'country_code' => 'nullable|string|size:2',
            'limit' => 'nullable|integer|min:1|max:100',
            'recommendation_type' => 'nullable|in:high_potential,rising,seasonal',
            'days_recent' => 'nullable|integer|min:1|max:90',
        ]);

        $organization = $request->user()->currentOrganization();

        $query = TrendingKeyword::where('organization_id', $organization->id)
            ->recent($request->input('days_recent', 30))
            ->orderBy('growth_rate', 'desc');

        if ($request->has('country_code')) {
            $query->where('country_code', $request->input('country_code'));
        }

        if ($request->has('recommendation_type')) {
            $query->where('recommendation_type', $request->input('recommendation_type'));
        }

        $keywords = $query->limit($request->input('limit', 50))->get();

        return response()->json([
            'keywords' => $keywords,
            'total' => $keywords->count(),
        ]);
    }

    /**
     * Get keyword suggestions for campaign creation.
     * Groups suggestions by geo and recommendation type.
     */
    public function suggestions(Request $request)
    {
        $request->validate([
            'days_recent' => 'nullable|integer|min:1|max:90',
        ]);

        $organization = $request->user()->currentOrganization();
        $daysRecent = $request->input('days_recent', 30);

        $suggestions = $this->service->getAllSuggestions($organization, $daysRecent);

        return response()->json([
            'suggestions' => $suggestions,
            'grouped_by' => 'country_code',
        ]);
    }

    /**
     * Attach trending keywords to a campaign.
     */
    public function attachKeywords(Request $request, SeoCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        $request->validate([
            'keyword_ids' => 'required|array',
            'keyword_ids.*' => 'exists:trending_keywords,id',
        ]);

        try {
            $campaign->syncTrendingKeywords($request->input('keyword_ids'));

            Log::info("Attached trending keywords to campaign", [
                'campaign_id' => $campaign->id,
                'keyword_count' => count($request->input('keyword_ids'))
            ]);

            return response()->json([
                'message' => 'Keywords attached successfully',
                'campaign' => $campaign->load('trendingKeywords'),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to attach keywords to campaign", [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to attach keywords'
            ], 500);
        }
    }

    /**
     * Get keyword performance for a campaign.
     */
    public function performance(SeoCampaign $campaign)
    {
        $this->authorize('view', $campaign);

        $performance = $this->service->getKeywordPerformance($campaign);

        return response()->json([
            'campaign_id' => $campaign->id,
            'keywords' => $performance,
        ]);
    }

    /**
     * Manually trigger keyword discovery for current organization.
     */
    public function discover(Request $request)
    {
        $organization = $request->user()->currentOrganization();

        try {
            $keywords = $this->service->discoverTrendingKeywords($organization);

            return response()->json([
                'message' => 'Keyword discovery completed',
                'keywords_discovered' => count($keywords),
            ]);
        } catch (\Exception $e) {
            Log::error("Manual keyword discovery failed", [
                'organization_id' => $organization->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Keyword discovery failed'
            ], 500);
        }
    }
}
