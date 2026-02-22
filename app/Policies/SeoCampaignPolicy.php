<?php

namespace App\Policies;

use App\Models\SeoCampaign;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SeoCampaignPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SeoCampaign $seoCampaign): bool
    {
        $organization = $user->organizations()->where('organizations.id', $seoCampaign->organization_id)->first();
        
        if (!$organization) {
            return false;
        }

        // If user is restricted to a specific project, ensure it matches
        if ($organization->pivot->project_id && $organization->pivot->project_id !== $seoCampaign->id) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // For now, let's assume restricted users cannot create new campaigns
        $organization = $user->currentOrganization();
        if ($organization) {
            $roleInOrg = $user->getRoleIn($organization);
            $pivot = $user->organizations()->where('organization_id', $organization->id)->first();
            if ($pivot && $pivot->pivot->project_id) {
                return false;
            }
            return in_array($roleInOrg, ['owner', 'admin']);
        }
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SeoCampaign $seoCampaign): bool
    {
        $organization = $user->organizations()->where('organizations.id', $seoCampaign->organization_id)->first();
        
        if (!$organization) {
            return false;
        }

        // restricted users can only update their own project if they are not just 'viewers'
        // Let's check the project restriction
        if ($organization->pivot->project_id && $organization->pivot->project_id !== $seoCampaign->id) {
            return false;
        }

        return in_array($organization->pivot->role, ['owner', 'admin', 'member']);
    }
}
