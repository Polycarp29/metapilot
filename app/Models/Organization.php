<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'slug',
        'description',
        'settings',
        'keyword_discovery_frequency',
        'last_keyword_discovery_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'keyword_discovery_frequency' => 'integer',
        'last_keyword_discovery_at' => 'datetime',
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

    public function seoCampaigns()
    {
        return $this->hasMany(SeoCampaign::class);
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

    /**
     * Get the trend patterns for the organization.
     */
    public function trendPatterns()
    {
        return $this->hasMany(TrendPattern::class);
    }

    /**
     * Get the niche intelligence for the organization.
     */
    public function nicheIntelligence()
    {
        return $this->hasOne(NicheIntelligence::class);
    }

    /**
     * Get the control engine alerts for the organization.
     */
    public function controlEngineAlerts()
    {
        return $this->hasMany(ControlEngineAlert::class);
    }
}
