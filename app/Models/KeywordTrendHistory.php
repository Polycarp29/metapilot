<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeywordTrendHistory extends Model
{
    use HasFactory;

    protected $table = 'keyword_trend_history';

    protected $fillable = [
        'keyword_intelligence_id',
        'region',
        'date',
        'interest_value',
        'trend_velocity',
        'search_volume',
        'ads_cpc',
        'competition_score',
        'seo_strength',
        'relevance_flag',
    ];

    protected $casts = [
        'date' => 'date',
        'interest_value' => 'float',
        'trend_velocity' => 'float',
        'search_volume' => 'integer',
        'ads_cpc' => 'float',
        'competition_score' => 'float',
        'seo_strength' => 'float',
        'relevance_flag' => 'boolean',
    ];

    public function intelligence()
    {
        return $this->belongsTo(KeywordIntelligence::class, 'keyword_intelligence_id');
    }
}
