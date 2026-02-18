<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeywordResearch extends Model
{
    use HasFactory;
    protected $table = 'keyword_researches';

    protected $fillable = [
        'organization_id',
        'query',
        'gl',
        'hl',
        'niche',
        'intent',
        'results',
        'growth_rate',
        'current_interest',
        'last_searched_at',
    ];

    protected $casts = [
        'results' => 'array',
        'growth_rate' => 'decimal:2',
        'last_searched_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
