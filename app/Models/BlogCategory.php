<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'slug',
        'description',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function blogPosts()
    {
        return $this->hasMany(BlogPost::class);
    }
}
