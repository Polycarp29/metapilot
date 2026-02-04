<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SitemapLink extends Model
{
    protected $fillable = [
        'sitemap_id', 'url', 'lastmod', 'changefreq', 'priority', 'is_canonical', 'canonical_url'
    ];

    public function sitemap()
    {
        return $this->belongsTo(Sitemap::class);
    }
}
