<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsProperty;
use App\Models\AdCampaign;
use App\Models\AnalyticalForecast;
use App\Jobs\SyncAdCampaignsJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdCampaignController extends Controller
{
    /**
     * Get ad campaigns and forecasts for a property.
     */
    public function index(Request $request)
    {
        $propertyId = $request->query('property_id');
        if (!$propertyId) {
            return response()->json(['error' => 'Property ID is required'], 400);
        }

        $property = AnalyticsProperty::findOrFail($propertyId);
        $campaigns = AdCampaign::where('analytics_property_id', $property->id)->get();
        
        $forecast = AnalyticalForecast::where('analytics_property_id', $property->id)
            ->where('forecast_type', 'ad_performance')
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json([
            'campaigns' => $campaigns,
            'forecast' => $forecast ? $forecast->forecast_data : null,
            'last_sync' => $campaigns->max('synced_at'),
        ]);
    }

    /**
     * Connect Google Ads customer ID to the organization.
     */
    public function connect(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|string',
        ]);

        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $organization->update([
            'ads_customer_id' => $request->customer_id,
            'ads_site_token' => $organization->ads_site_token ?: (string) Str::uuid(),
        ]);

        // Trigger immediate sync
        SyncAdCampaignsJob::dispatch($organization);

        return response()->json([
            'message' => 'Google Ads connected successfully. Syncing data...',
            'customer_id' => $organization->ads_customer_id,
            'site_token' => $organization->ads_site_token,
        ]);
    }

    /**
     * Manually trigger a sync.
     */
    public function sync(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization || !$organization->ads_customer_id) {
            return response()->json(['error' => 'Google Ads not connected'], 400);
        }

        SyncAdCampaignsJob::dispatch($organization);

        return response()->json(['message' => 'Sync triggered successfully']);
    }

    /**
     * Regenerate the ads site token.
     */
    public function regenerateToken(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $organization->update([
            'ads_site_token' => (string) Str::uuid(),
        ]);

        return response()->json([
            'message' => 'Token regenerated successfully',
            'site_token' => $organization->ads_site_token,
        ]);
    }

    /**
     * Get the embed snippet for the organization.
     */
    public function embedSnippet(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization || !$organization->ads_site_token) {
            return response()->json(['error' => 'Ads site token not generated'], 404);
        }

        $baseUrl = config('app.url');
        $snippet = "<script src=\"{$baseUrl}/cdn/ads-tracker.js\" data-token=\"{$organization->ads_site_token}\" async></script>";

        return response()->json(['snippet' => $snippet]);
    }
}
