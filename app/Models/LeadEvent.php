<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadEvent extends Model
{
    protected $fillable = [
        'analytics_property_id',
        'event_at',
        'event_name',
        'form_name',
        'page_url',
        'source',
        'medium',
        'campaign',
        'device_category',
        'event_params',
    ];

    protected $casts = [
        'event_at' => 'datetime',
        'event_params' => 'array',
    ];

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
