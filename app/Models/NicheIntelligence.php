<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NicheIntelligence extends Model
{
    protected $fillable = [
        'organization_id',
        'detected_niche',
        'confidence',
        'evidence',
        'industry_benchmarks',
        'trend_keywords',
        'seasonal_patterns',
        'last_updated_at',
    ];

    protected $casts = [
        'confidence' => 'decimal:2',
        'evidence' => 'array',
        'industry_benchmarks' => 'array',
        'trend_keywords' => 'array',
        'seasonal_patterns' => 'array',
        'last_updated_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
