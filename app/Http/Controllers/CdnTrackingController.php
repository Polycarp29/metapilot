<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\AdTrackEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class CdnTrackingController extends Controller
{
    /**
     * Serve the tracking JS script.
     */
    public function serveScript()
    {
        $path = public_path('js/ads-tracker.js');
        if (!File::exists($path)) {
            return response()->json(['error' => 'Script not found'], 404);
        }

        return response()->file($path, [
            'Content-Type' => 'application/javascript',
            'Cache-Control' => 'public, max-age=31536000', // 1 year cache
        ]);
    }

    /**
     * Handle the tracking pixel hit.
     */
    public function trackHit(Request $request)
    {
        $request->validate([
            'token' => 'required|uuid',
            'page_url' => 'nullable|url',
        ]);

        $organization = Organization::where('ads_site_token', $request->token)->first();
        if (!$organization) {
            return response()->json(['error' => 'Invalid site token'], 422);
        }

        // Logic for extracting campaign from data-campaign if provided in script tag
        // or from UTM params in the payload.
        
        AdTrackEvent::create([
            'organization_id' => $organization->id,
            'site_token' => $request->token,
            'google_campaign_id' => $request->campaign_id,
            'page_url' => $request->page_url,
            'gclid' => $request->gclid,
            'utm_source' => $request->utm_source,
            'utm_medium' => $request->utm_medium,
            'utm_campaign' => $request->utm_campaign,
            'ip_hash' => hash('sha256', $request->ip()),
        ]);

        return response()->json(null, 204);
    }

    /**
     * Get recent track events for the organization.
     */
    public function events(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $events = AdTrackEvent::where('organization_id', $organization->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($events);
    }
}
