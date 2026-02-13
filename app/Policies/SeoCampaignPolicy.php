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
        return $user->organizations()->where('organizations.id', $seoCampaign->organization_id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Simplified for this implementation
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SeoCampaign $seoCampaign): bool
    {
        return $user->organizations()->where('organizations.id', $seoCampaign->organization_id)->exists();
    }
}
