<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sitemap extends Model
{
    protected $fillable = ['name', 'filename', 'is_index', 'last_generated_at'];

    public function links()
    {
        return $this->hasMany(SitemapLink::class);
    }
}
