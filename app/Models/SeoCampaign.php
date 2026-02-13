<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoCampaign extends Model
{
    protected $fillable = [
        'organization_id',
        'analytics_property_id',
        'name',
        'objective',
        'status',
        'target_urls',
        'keywords',
        'strategy_data',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'target_urls' => 'array',
        'keywords' => 'array',
        'strategy_data' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
