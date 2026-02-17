<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ControlEngineAlert extends Model
{
    protected $fillable = [
        'organization_id',
        'analytics_property_id',
        'alert_type',
        'severity',
        'title',
        'description',
        'affected_metrics',
        'recommendations',
        'context_data',
        'is_dismissed',
        'dismissed_at',
    ];

    protected $casts = [
        'affected_metrics' => 'array',
        'recommendations' => 'array',
        'context_data' => 'array',
        'is_dismissed' => 'boolean',
        'dismissed_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function analyticsProperty()
    {
        return $this->belongsTo(AnalyticsProperty::class);
    }
}
