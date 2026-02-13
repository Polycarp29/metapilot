<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Insight extends Model
{
    protected $fillable = [
        'analytics_property_id',
        'title',
        'body',
        'context',
        'type',
        'severity',
        'insight_at',
        'is_read',
    ];

    protected $casts = [
        'context' => 'array',
        'insight_at' => 'datetime',
        'is_read' => 'boolean',
    ];

    public function property()
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
