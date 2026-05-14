<?php

namespace App\Http\Controllers;

use App\Models\PixelSite;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PixelSiteController extends Controller
{
    /**
     * List all pixel sites for the current organization.
     */
    public function index(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        return response()->json([
            'pixel_sites' => $organization->pixelSites()->orderBy('created_at', 'desc')->get(),
        ]);
    }

    /**
     * Store a new pixel site.
     */
    public function store(Request $request)
    {
        $request->validate([
            'label'          => 'required|string|max:255',
            'allowed_domain' => 'nullable|string|max:255|regex:/^([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})$/',
        ]);

        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $pixelSite = $organization->pixelSites()->create([
            'label'            => $request->label,
            'ads_site_token'   => (string) Str::uuid(),
            'allowed_domain'   => $request->allowed_domain ?: null,
            'tracking_enabled' => true,
        ]);

        return response()->json([
            'message'    => 'Pixel site created successfully',
            'pixel_site' => $pixelSite,
        ], 201);
    }

    /**
     * Update a pixel site.
     */
    public function update(Request $request, PixelSite $pixelSite)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization || $pixelSite->organization_id !== $organization->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'label'          => 'required|string|max:255',
            'allowed_domain' => 'nullable|string|max:255|regex:/^([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})$/',
        ]);

        // Reset verification if domain changes
        $domainChanged = $pixelSite->allowed_domain !== $request->allowed_domain;

        $pixelSite->update([
            'label'             => $request->label,
            'allowed_domain'    => $request->allowed_domain ?: null,
            'pixel_verified_at' => $domainChanged ? null : $pixelSite->pixel_verified_at,
        ]);

        return response()->json([
            'message'    => 'Pixel site updated successfully',
            'pixel_site' => $pixelSite,
        ]);
    }

    /**
     * Delete a pixel site.
     */
    public function destroy(Request $request, PixelSite $pixelSite)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization || $pixelSite->organization_id !== $organization->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $pixelSite->delete();

        return response()->json([
            'message' => 'Pixel site deleted successfully',
        ]);
    }

    /**
     * Regenerate token for a pixel site.
     */
    public function regenerateToken(Request $request, PixelSite $pixelSite)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization || $pixelSite->organization_id !== $organization->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $pixelSite->update([
            'ads_site_token' => (string) Str::uuid(),
        ]);

        return response()->json([
            'message'    => 'Token regenerated successfully',
            'pixel_site' => $pixelSite,
        ]);
    }

    /**
     * Toggle CDN hit ingestion on/off for a pixel site.
     *
     * When disabled:
     *  - trackHit()        returns 204 silently (JS client sees success, no retry loops)
     *  - logError()        returns 204 silently
     *  - verifyConnection() returns {ok: false, tracking_paused: true}
     *
     * This lets you immediately stop writing garbage from a problematic embedded site
     * without deleting the pixel site record or rotating the token.
     */
    public function toggleTracking(Request $request, PixelSite $pixelSite)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization || $pixelSite->organization_id !== $organization->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $newState = !$pixelSite->tracking_enabled;
        $pixelSite->update(['tracking_enabled' => $newState]);

        return response()->json([
            'tracking_enabled' => $newState,
            'message'          => $newState
                ? 'Tracking resumed. The CDN pixel is now accepting hits.'
                : 'Tracking paused. All incoming CDN hits are being silently dropped.',
        ]);
    }
}
