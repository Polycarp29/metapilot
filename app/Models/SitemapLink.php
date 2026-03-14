<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SitemapLink extends Model
{
    protected $fillable = [
        'sitemap_id', 'url', 'title', 'description', 'h1', 'canonical', 
        'keywords', 'structure_level', 'parent_url', 'load_time', 
        'schema_suggestions', 'status', 'lastmod', 'changefreq', 'priority', 
        'is_canonical', 'canonical_url', 'seo_audit', 'ssl_info', 
        'request_analysis', 'extracted_json_ld', 'url_hash',
        'seo_bottlenecks', 'url_slug_quality', 'depth_from_root',
        'internal_links_in', 'internal_links_out',
        'http_status', 'effective_url', 'ai_schema_data',
        'cdn_hit_count', 'cdn_engagement_score', 'cdn_last_seen_at', 'cdn_active'
    ];

    protected $casts = [
        'keywords' => 'json',
        'schema_suggestions' => 'json',
        'seo_audit' => 'json',
        'ssl_info' => 'json',
        'request_analysis' => 'json',
        'extracted_json_ld' => 'json',
        'url_hash' => 'string',
        'seo_bottlenecks' => 'json',
        'load_time' => 'float',
        'priority' => 'float',
        'is_canonical' => 'boolean',
        'depth_from_root' => 'integer',
        'internal_links_in' => 'integer',
        'internal_links_out' => 'integer',
        'http_status' => 'integer',
        'ai_schema_data' => 'json',
        'cdn_hit_count' => 'integer',
        'cdn_engagement_score' => 'float',
        'cdn_last_seen_at' => 'datetime',
        'cdn_active' => 'boolean',
    ];

    public function sitemap()
    {
        return $this->belongsTo(Sitemap::class);
    }

    protected $appends = [];

    public function getCdnInsightAttribute()
    {
        $sitemapService = app(\App\Services\SitemapService::class);
        $seoScore = $sitemapService->calculateSeoScore($this);
        $engagementWeight = 0.5; // 50% SEO, 50% Engagement if active
        
        $unifiedScore = $seoScore;
        if ($this->cdn_active) {
            $unifiedScore = ($seoScore * (1 - $engagementWeight)) + ($this->cdn_engagement_score * $engagementWeight);
        }

        return [
            'active' => $this->cdn_active,
            'hit_count' => $this->cdn_hit_count,
            'last_seen_at' => $this->cdn_last_seen_at ? $this->cdn_last_seen_at->diffForHumans() : null,
            'engagement_score' => $this->cdn_engagement_score,
            'seo_score' => $seoScore,
            'unified_score' => (int) $unifiedScore,
            'is_orphan' => !$this->cdn_active && $this->http_status === 200,
            'is_ad_ready' => $this->cdn_engagement_score >= 70,
        ];
    }
}
