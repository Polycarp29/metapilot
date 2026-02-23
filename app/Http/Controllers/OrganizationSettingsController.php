<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationSettingsController extends Controller
{
    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        
        if (auth()->user()->getRoleIn($organization) === 'member') {
            abort(403, 'Members do not have access to organization settings.');
        }
        
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
            'analyticsProperties' => $organization->analyticsProperties()->latest()->get()->map(function ($p) {
                return [
                    'id'                   => $p->id,
                    'name'                 => $p->name,
                    'property_id'          => $p->property_id,
                    'website_url'          => $p->website_url,
                    'gsc_site_url'         => $p->gsc_site_url,
                    'is_active'            => $p->is_active,
                    'google_token_invalid' => (bool) $p->google_token_invalid,
                    'has_google_token'     => !empty($p->refresh_token),
                    'token_expires_at'     => $p->token_expires_at?->toIso8601String(),
                ];
            }),
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

        auth()->user()->logActivity('settings_update', "Updated organization settings for {$organization->name}", [
            'organization_id' => $organization->id,
            'changes' => array_keys($newSettings)
        ], $organization->id);

        return back()->with('message', 'Organization settings updated.');
    }
}
