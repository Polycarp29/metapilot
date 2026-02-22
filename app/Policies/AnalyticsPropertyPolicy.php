<?php

namespace App\Policies;

use App\Models\AnalyticsProperty;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AnalyticsPropertyPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AnalyticsProperty $analyticsProperty): bool
    {
        $organization = $user->organizations()->where('organizations.id', $analyticsProperty->organization_id)->first();
        
        if (!$organization) {
            return false;
        }

        // If user is restricted to a project, they can only see properties linked to that project
        if ($organization->pivot->project_id) {
            $campaign = \App\Models\SeoCampaign::find($organization->pivot->project_id);
            return $campaign && $campaign->analytics_property_id === $analyticsProperty->id;
        }

        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        $organization = $user->currentOrganization();
        if (!$organization) return false;

        $role = $user->getRoleIn($organization);
        $pivot = $user->organizations()->where('organization_id', $organization->id)->first();

        // Restricted users cannot create new properties
        if ($pivot && $pivot->pivot->project_id) {
            return false;
        }

        return in_array($role, ['owner', 'admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, AnalyticsProperty $analyticsProperty): bool
    {
        $organization = $user->organizations()->where('organizations.id', $analyticsProperty->organization_id)->first();
        
        if (!$organization) return false;

        if ($organization->pivot->project_id) {
            return false; // Restricted users cannot update properties
        }

        return in_array($organization->pivot->role, ['owner', 'admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AnalyticsProperty $analyticsProperty): bool
    {
        $organization = $user->organizations()->where('organizations.id', $analyticsProperty->organization_id)->first();
        
        if (!$organization) return false;

        if ($organization->pivot->project_id) {
            return false; // Restricted users cannot delete properties
        }

        return $organization->pivot->role === 'owner';
    }
}
