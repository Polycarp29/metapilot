<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentKeywordMapping extends Model
{
    use HasFactory;

    protected $fillable = [
        'blog_post_id',
        'keyword',
        'keyword_type',
        'density',
        'occurrences',
    ];

    public function blogPost()
    {
        return $this->belongsTo(BlogPost::class);
    }
}
