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
            'label'          => $request->label,
            'ads_site_token' => (string) Str::uuid(),
            'allowed_domain' => $request->allowed_domain ?: null,
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

        // Don't allow deleting the last site? Or just delete it.
        // For now, let's just delete it.
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
}
