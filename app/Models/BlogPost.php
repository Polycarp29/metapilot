<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'user_id',
        'blog_category_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'focus_keyword',
        'secondary_keywords',
        'long_tail_keywords',
        'seo_score',
        'readability_score',
        'ai_content_score',
        'ai_detected',
        'ai_detection_notes',
        'word_count',
        'reading_time_minutes',
        'status',
        'published_at',
        'scheduled_at',
        'og_title',
        'og_description',
        'og_image',
        'canonical_url',
        'schema_type',
        'featured_image_url',
    ];

    protected $casts = [
        'meta_keywords' => 'array',
        'secondary_keywords' => 'array',
        'long_tail_keywords' => 'array',
        'ai_detected' => 'boolean',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }

    public function keywordMappings()
    {
        return $this->hasMany(ContentKeywordMapping::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeByOrg($query, $orgId)
    {
        return $query->where('organization_id', $orgId);
    }
}
