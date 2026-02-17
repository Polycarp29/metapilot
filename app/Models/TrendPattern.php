<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrendPattern extends Model
{
    protected $fillable = [
        'organization_id',
        'pattern_type',
        'niche',
        'pattern_data',
        'triggers',
        'confidence_score',
        'occurrence_count',
        'last_matched_at',
    ];

    protected $casts = [
        'pattern_data' => 'array',
        'triggers' => 'array',
        'confidence_score' => 'decimal:2',
        'last_matched_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
