<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetricSnapshot extends Model
{
    protected $fillable = [
        'analytics_property_id',
        'snapshot_date',
        'users',
        'new_users',
        'sessions',
        'engaged_sessions',
        'engagement_rate',
        'avg_session_duration',
        'conversions',
        'lead_submissions',
        'signups',
        'conversion_rate',
        'by_source',
        'by_medium',
        'by_campaign',
        'by_page',
        'by_device',
        'raw_response',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'engagement_rate' => 'decimal:2',
        'avg_session_duration' => 'decimal:2',
        'conversion_rate' => 'decimal:2',
        'by_source' => 'array',
        'by_medium' => 'array',
        'by_campaign' => 'array',
        'by_page' => 'array',
        'by_device' => 'array',
        'raw_response' => 'array',
    ];

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
