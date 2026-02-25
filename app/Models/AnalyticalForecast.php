<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticalForecast extends Model
{
    protected $fillable = [
        'analytics_property_id',
        'forecast_type',
        'forecast_data',
        'confidence_score',
        'valid_until',
    ];

    protected $casts = [
        'forecast_data' => 'array',
        'confidence_score' => 'decimal:2',
        'valid_until' => 'datetime',
    ];

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
