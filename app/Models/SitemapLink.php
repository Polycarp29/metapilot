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
        'request_analysis', 'extracted_json_ld'
    ];

    protected $casts = [
        'keywords' => 'json',
        'schema_suggestions' => 'json',
        'seo_audit' => 'json',
        'ssl_info' => 'json',
        'request_analysis' => 'json',
        'extracted_json_ld' => 'json',
        'load_time' => 'float',
        'priority' => 'float',
        'is_canonical' => 'boolean',
    ];

    public function sitemap()
    {
        return $this->belongsTo(Sitemap::class);
    }
}
