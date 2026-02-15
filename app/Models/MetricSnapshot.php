<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetricSnapshot extends Model
{
    protected $fillable = [
        'analytics_property_id',
        'snapshot_date',
        'users',
        'total_users',
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
        'by_country',
        'by_city',
        'bounce_rate',
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
        'by_country' => 'array',
        'by_city' => 'array',
        'bounce_rate' => 'decimal:2',
        'raw_response' => 'array',
    ];

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
