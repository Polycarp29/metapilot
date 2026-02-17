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

    public function trendingKeywords()
    {
        return $this->belongsToMany(TrendingKeyword::class, 'campaign_trending_keyword')
            ->withTimestamps();
    }

    /**
     * Sync trending keywords to this campaign and update keywords field.
     */
    public function syncTrendingKeywords(array $keywordIds): void
    {
        $this->trendingKeywords()->sync($keywordIds);
        
        // Mark keywords as used
        TrendingKeyword::whereIn('id', $keywordIds)->update(['used_in_campaign' => true]);
        
        // Update the keywords JSON field for backward compatibility
        $keywords = TrendingKeyword::whereIn('id', $keywordIds)
            ->pluck('keyword')
            ->toArray();
        
        $existingKeywords = $this->keywords ?? [];
        $mergedKeywords = array_unique(array_merge($existingKeywords, $keywords));
        
        $this->update(['keywords' => $mergedKeywords]);
    }
}
