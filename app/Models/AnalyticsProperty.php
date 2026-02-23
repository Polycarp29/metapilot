<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsProperty extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'property_id',
        'website_url',
        'gsc_site_url',
        'config',
        'is_active',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'google_token_invalid',
        'gsc_permission_error',
        'sync_status',
        'last_sync_at',
    ];

    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
        'token_expires_at' => 'datetime',
        'google_token_invalid' => 'boolean',
        'gsc_permission_error' => 'boolean',
        'last_sync_at' => 'datetime',
    ];

    /**
     * Get the organization that owns the analytics property.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function snapshots()
    {
        return $this->hasMany(MetricSnapshot::class);
    }

    public function leadEvents()
    {
        return $this->hasMany(LeadEvent::class);
    }

    public function insights()
    {
        return $this->hasMany(Insight::class);
    }

    public function searchConsoleMetrics()
    {
        return $this->hasMany(SearchConsoleMetric::class);
    }
}
