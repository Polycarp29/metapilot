<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrganizationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Users can view their organizations
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Organization $organization): bool
    {
        return $user->organizations->contains($organization);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // All authenticated users can create organizations
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Organization $organization): bool
    {
        // Owner or admin can update
        return $user->canManage($organization);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Organization $organization): bool
    {
        // Only owners can delete organizations
        return $user->isOwnerOf($organization);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Organization $organization): bool
    {
        return $user->isOwnerOf($organization);
    }

    /**
     * Determine whether the user can manage team members.
     */
    public function manageTeam(User $user, Organization $organization): bool
    {
        return $user->canManage($organization);
    }

    /**
     * Determine whether the user can invite members.
     */
    public function inviteMembers(User $user, Organization $organization): bool
    {
        return $user->canManage($organization);
    }
}
