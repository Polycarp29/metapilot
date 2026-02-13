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
        ]);

        $property = $organization->analyticsProperties()->create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'property_id' => $validated['property_id'],
            'website_url' => $validated['website_url'],
            'is_active' => true,
        ]);

        return back()->with('message', 'Analytics property connected successfully.');
    }

    /**
     * Update the specified analytic property in storage.
     */
    public function update(Request $request, AnalyticsProperty $property)
    {
        $this->authorize('update', $property);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $property->update($validated);

        return back()->with('message', 'Analytics property updated.');
    }

    /**
     * Remove the specified analytic property from storage.
     */
    public function destroy(AnalyticsProperty $property)
    {
        $this->authorize('delete', $property);

        $property->delete();

        return back()->with('message', 'Analytics property disconnected.');
    }
}
