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
        ]);

        // Ensure a default pixel site exists
        if ($organization->pixelSites()->count() === 0) {
            $organization->pixelSites()->create([
                'label' => 'Default Site',
                'ads_site_token' => (string) Str::uuid(),
            ]);
        }

        // Trigger immediate sync
        SyncAdCampaignsJob::dispatch($organization);

        return response()->json([
            'message' => 'Google Ads connected successfully. Syncing data...',
            'customer_id' => $organization->ads_customer_id,
            'site_token' => $organization->pixelSites()->first()->ads_site_token,
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

}
