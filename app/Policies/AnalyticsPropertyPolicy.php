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
        return $user->organizations->contains($analyticsProperty->organization_id);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, AnalyticsProperty $analyticsProperty): bool
    {
        return $user->organizations->contains($analyticsProperty->organization_id);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AnalyticsProperty $analyticsProperty): bool
    {
        return $user->organizations->contains($analyticsProperty->organization_id);
    }
}
