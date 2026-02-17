<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationSettingsController extends Controller
{
    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        
        return Inertia::render('Settings/Index', [
            'organization' => $organization,
            'members' => $organization->users()->withPivot('role')->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                    'avatar_url' => $user->profile_photo_url,
                ];
            }),
            'invitations' => $organization->invitations()->orderBy('created_at', 'desc')->get(),
            'currentUserRole' => auth()->user()->getRoleIn($organization),
            'aiModels' => \App\Services\OpenAIService::getAvailableModels(),
            'analyticsProperties' => $organization->analyticsProperties()->latest()->get(),
        ]);
    }

    public function update(Request $request)
    {
        $organization = auth()->user()->currentOrganization();

        if (auth()->user()->getRoleIn($organization) !== 'owner') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'keyword_discovery_frequency' => 'nullable|integer|in:3,6,12,24',
            'settings' => 'array',
            'settings.ai_model' => 'nullable|string',
            'settings.ai_insights_enabled' => 'nullable|boolean',
            'settings.analytics_period' => 'nullable|string',
            'settings.notifications_enabled' => 'boolean',
        ]);

        // Merge existing settings with new ones to prevent overwriting unsubmitted keys
        $currentSettings = $organization->settings ?? [];
        $newSettings = $validated['settings'] ?? [];
        $mergedSettings = array_merge($currentSettings, $newSettings);

        $organization->update([
            'name' => $validated['name'],
            'keyword_discovery_frequency' => $validated['keyword_discovery_frequency'] ?? 24,
            'settings' => $mergedSettings,
        ]);

        return back()->with('message', 'Organization settings updated.');
    }
}
