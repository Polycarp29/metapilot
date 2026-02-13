<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sitemap extends Model
{
    protected $fillable = ['user_id', 'organization_id', 'name', 'filename', 'is_index', 'last_generated_at'];

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
}
