<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleTrendsCache extends Model
{
    protected $table = 'google_trends_cache';

    protected $fillable = [
        'keyword',
        'geo',
        'timeframe',
        'trend_data',
        'related_queries',
        'rising_queries',
        'fetched_at',
    ];

    protected $casts = [
        'trend_data' => 'array',
        'related_queries' => 'array',
        'rising_queries' => 'array',
        'fetched_at' => 'datetime',
    ];
}
