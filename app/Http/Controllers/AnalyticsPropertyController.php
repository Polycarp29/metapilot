<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsProperty;
use Illuminate\Http\Request;

class AnalyticsPropertyController extends Controller
{
    /**
     * Store a newly created analytic property in storage.
     */
    public function store(Request $request)
    {
        $organization = $request->user()->currentOrganization();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'property_id' => 'required|string|max:255',
            'website_url' => 'nullable|url|max:255',
            'gsc_site_url' => 'nullable|string|max:255',
        ]);

        $property = AnalyticsProperty::updateOrCreate(
            ['property_id' => $validated['property_id']],
            [
                'organization_id' => $organization->id,
                'user_id' => $request->user()->id,
                'name' => $validated['name'],
                'website_url' => $validated['website_url'],
                'gsc_site_url' => $validated['gsc_site_url'],
                'is_active' => true,
                'access_token' => session('google_access_token'),
                'refresh_token' => session('google_refresh_token'),
                'token_expires_at' => session('google_token_expires_at'),
            ]
        );

        // Clear session after use
        session()->forget(['google_access_token', 'google_refresh_token', 'google_token_expires_at']);

        return back()->with('message', 'Analytics property connected successfully.');
    }

    /**
     * Update the specified analytic property in storage.
     */
    public function update(Request $request, AnalyticsProperty $property)
    {
        // Ensure user belongs to the same organization as the property
        if (!$request->user()->organizations->contains($property->organization_id)) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'gsc_site_url' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $property->update($validated);

        // Dispatch background sync
        \App\Jobs\SyncPropertyDataJob::dispatch($property);

        return back()->with('message', 'Analytics property updated. Syncing data in background...');
    }

    /**
     * Remove the specified analytic property from storage.
     */
    public function destroy(AnalyticsProperty $property)
    {
        // Ensure user belongs to the same organization as the property
        if (!request()->user()->organizations->contains($property->organization_id)) {
            abort(403, 'Unauthorized');
        }

        $property->delete();

        return back()->with('message', 'Analytics property disconnected.');
    }
}
