<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeywordIntelligence extends Model
{
    use HasFactory;

    protected $table = 'keyword_intelligence';

    protected $fillable = [
        'keyword',
        'language',
        'origin',
        'category',
        'is_active',
        'global_score',
        'search_volume_est',
        'click_through_est',
        'relevance_score',
        'decay_status',
        'trend_velocity',
        'related_queries',
        'rising_queries',
        'last_seen_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'global_score' => 'float',
        'search_volume_est' => 'integer',
        'click_through_est' => 'float',
        'relevance_score' => 'float',
        'trend_velocity' => 'float',
        'related_queries' => 'array',
        'rising_queries' => 'array',
        'last_seen_at' => 'datetime',
    ];

    public function trendHistory()
    {
        return $this->hasMany(KeywordTrendHistory::class, 'keyword_intelligence_id');
    }

    public function bookmarks()
    {
        return $this->hasMany(UserKeywordBookmark::class, 'keyword_intelligence_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByNiche($query, $niche)
    {
        return $query->where('category', $niche);
    }

    public function scopeTrending($query)
    {
        return $query->where('trend_velocity', '>', 0)
                     ->orderBy('trend_velocity', 'desc');
    }
}
