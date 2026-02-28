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
        'returning_users',
        'sessions',
        'engaged_sessions',
        'engagement_rate',
        'avg_session_duration',
        'conversions',
        'lead_submissions',
        'signups',
        'conversion_rate',
        'by_source',
        'manual_source_sessions',
        'by_medium',
        'by_campaign',
        'by_first_source',
        'first_user_channel_group',
        'by_page',
        'by_page_title',
        'by_screen',
        'by_device',
        'by_country',
        'by_city',
        'by_event',
        'by_audience',
        'bounce_rate',
        'raw_response',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'engagement_rate' => 'decimal:2',
        'avg_session_duration' => 'decimal:2',
        'conversion_rate' => 'decimal:2',
        'by_source' => 'array',
        'manual_source_sessions' => 'array',
        'by_medium' => 'array',
        'by_campaign' => 'array',
        'by_page' => 'array',
        'by_page_title' => 'array',
        'by_screen' => 'array',
        'by_device' => 'array',
        'by_country' => 'array',
        'by_city' => 'array',
        'by_first_source' => 'array',
        'first_user_channel_group' => 'array',
        'by_event' => 'array',
        'by_audience' => 'array',
        'bounce_rate' => 'decimal:2',
        'raw_response' => 'array',
        'returning_users' => 'integer',
        'clicks' => 'integer',
        'impressions' => 'integer',
        'top_queries' => 'array',
        'top_pages' => 'array',
    ];

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
