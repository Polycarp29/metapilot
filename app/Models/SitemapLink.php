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
        'request_analysis', 'extracted_json_ld',
        'seo_bottlenecks', 'url_slug_quality', 'depth_from_root',
        'internal_links_in', 'internal_links_out',
        'http_status', 'effective_url', 'ai_schema_data'
    ];

    protected $casts = [
        'keywords' => 'json',
        'schema_suggestions' => 'json',
        'seo_audit' => 'json',
        'ssl_info' => 'json',
        'request_analysis' => 'json',
        'extracted_json_ld' => 'json',
        'seo_bottlenecks' => 'json',
        'load_time' => 'float',
        'priority' => 'float',
        'is_canonical' => 'boolean',
        'depth_from_root' => 'integer',
        'internal_links_in' => 'integer',
        'internal_links_out' => 'integer',
        'http_status' => 'integer',
        'ai_schema_data' => 'json',
    ];

    public function sitemap()
    {
        return $this->belongsTo(Sitemap::class);
    }
}
