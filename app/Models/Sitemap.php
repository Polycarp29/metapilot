<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sitemap extends Model
{
    protected $fillable = ['user_id', 'organization_id', 'name', 'site_url', 'filename', 'is_index', 'last_generated_at', 'last_crawl_status', 'last_crawl_job_id'];

    protected $casts = [
        'last_generated_at' => 'datetime',
        'is_index' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function links()
    {
        return $this->hasMany(SitemapLink::class);
    }

    public function schedule()
    {
        return $this->hasOne(CrawlSchedule::class);
    }

    public function scopeForOrganization($query, $orgId)
    {
        return $query->where('organization_id', $orgId);
    }
}
