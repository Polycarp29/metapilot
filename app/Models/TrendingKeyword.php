<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrendingKeyword extends Model
{
    protected $fillable = [
        'organization_id',
        'keyword',
        'niche',
        'country_code',
        'city',
        'growth_rate',
        'current_interest',
        'related_queries',
        'recommendation_type',
        'trending_date',
        'used_in_campaign',
        'intent',
        'serp_data',
    ];

    protected $casts = [
        'growth_rate' => 'decimal:2',
        'related_queries' => 'array',
        'serp_data' => 'array',
        'trending_date' => 'date',
        'used_in_campaign' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function campaigns()
    {
        return $this->belongsToMany(SeoCampaign::class, 'campaign_trending_keyword')
            ->withTimestamps();
    }

    /**
     * Scope: Get high-potential keywords
     */
    public function scopeHighPotential($query)
    {
        return $query->where('recommendation_type', 'high_potential')
            ->where('growth_rate', '>', 30);
    }

    /**
     * Scope: Get by geo
     */
    public function scopeForGeo($query, string $countryCode, ?string $city = null)
    {
        $query->where('country_code', $countryCode);
        
        if ($city) {
            $query->where('city', $city);
        }
        
        return $query;
    }

    /**
     * Scope: Recent trends
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('trending_date', '>=', now()->subDays($days));
    }

    /**
     * Scope: Unused in campaigns
     */
    public function scopeUnused($query)
    {
        return $query->where('used_in_campaign', false);
    }
}
