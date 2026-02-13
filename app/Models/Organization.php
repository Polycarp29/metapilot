<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    /**
     * The users that belong to the organization.
     */
    public function users()
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the owners of the organization.
     */
    public function owners()
    {
        return $this->users()->wherePivot('role', 'owner');
    }

    /**
     * Get the analytics properties for the organization.
     */
    public function analyticsProperties()
    {
        return $this->hasMany(AnalyticsProperty::class);
    }

    /**
     * Get the schemas for the organization.
     */
    public function schemas()
    {
        return $this->hasMany(Schema::class);
    }

    /**
     * Get the sitemaps for the organization.
     */
    public function sitemaps()
    {
        return $this->hasMany(Sitemap::class);
    }

    /**
     * Get the invitations for the organization.
     */
    public function invitations()
    {
        return $this->hasMany(OrganizationInvitation::class);
    }

    /**
     * Check if a user has a specific role in this organization.
     */
    public function hasUserWithRole(User $user, string|array $roles): bool
    {
        $roles = is_array($roles) ? $roles : [$roles];
        $userPivot = $this->users()->where('user_id', $user->id)->first();
        
        return $userPivot && in_array($userPivot->pivot->role, $roles);
    }
}
