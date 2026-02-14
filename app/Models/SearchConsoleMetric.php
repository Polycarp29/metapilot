<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchConsoleMetric extends Model
{
    protected $fillable = [
        'analytics_property_id',
        'snapshot_date',
        'clicks',
        'impressions',
        'ctr',
        'position',
        'top_queries',
        'top_pages',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'clicks' => 'integer',
        'impressions' => 'integer',
        'ctr' => 'float',
        'position' => 'float',
        'top_queries' => 'array',
        'top_pages' => 'array',
    ];

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
