<?php

namespace App\Models\Admin\Settings;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Builder;

class SEOConfigurations extends Model
{
    //

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        // Page identification
        'page_url',
        'route_name',
        'is_active',

        // Basic Meta Tags
        'title',
        'meta_description',
        'meta_keywords',

        // Favicon
        'favicon_path',
        'favicon_type',

        // Open Graph Tags
        'og_title',
        'og_description',
        'og_image',
        'og_type',
        'og_url',
        'og_site_name',

        // Twitter Card Tags
        'twitter_card',
        'twitter_title',
        'twitter_description',
        'twitter_image',
        'twitter_site',
        'twitter_creator',

        // Technical SEO
        'robots_meta',
        'canonical_url',
        'hreflang',

        // Schema.org structured data
        'schema_markup',

        // Additional SEO settings
        'author',
        'publisher',
        'publish_date',
        'modified_date',
        'custom_head_tags',
        'gtm_head',
        'gtm_body',
        'microsoft_tag',
        'out_bound',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'hreflang' => 'array',
        'schema_markup' => 'array',
        'publish_date' => 'date',
        'modified_date' => 'date',
    ];

    /**
     * Validation rules for SEO aspects.
     */
    public static function validationRules(): array
    {
        return [
            'page_url' => 'required|string|max:255|unique:s_e_o_aspects,page_url',
            'route_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',

            // Basic Meta Tags
            'title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords' => 'nullable|string',

            // Favicon
            'favicon_path' => 'nullable|string|max:255',
            'favicon_type' => 'nullable|string|max:20',

            // Open Graph Tags
            'og_title' => 'nullable|string|max:60',
            'og_description' => 'nullable|string|max:300',
            'og_image' => 'nullable|url',
            'og_type' => 'nullable|string|max:50',
            'og_url' => 'nullable|url',
            'og_site_name' => 'nullable|string|max:100',

            // Twitter Card Tags
            'twitter_card' => 'nullable|string|max:50',
            'twitter_title' => 'nullable|string|max:60',
            'twitter_description' => 'nullable|string|max:200',
            'twitter_image' => 'nullable|url',
            'twitter_site' => 'nullable|string|max:50',
            'twitter_creator' => 'nullable|string|max:50',

            // Technical SEO
            'robots_meta' => 'nullable|string|max:100',
            'canonical_url' => 'nullable|url',
            'hreflang' => 'nullable|array',

            // Schema.org structured data
            'schema_markup' => 'nullable|array',

            // Additional SEO settings
            'author' => 'nullable|string|max:100',
            'publisher' => 'nullable|string|max:100',
            'publish_date' => 'nullable|date',
            'modified_date' => 'nullable|date',
            'custom_head_tags' => 'nullable|string',
            'gtm_head' => 'nullable|string',
            'gtm_body' => 'nullable|string',
            'microsoft_tag' => 'nullable|string',
        ];
    }

    /**
     * Scope for active SEO aspects.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to find SEO aspects by page URL.
     */
    public function scopeByPageUrl(Builder $query, string $pageUrl): Builder
    {
        return $query->where('page_url', $pageUrl);
    }

    /**
     * Scope to find SEO aspects by route name.
     */
    public function scopeByRoute(Builder $query, string $routeName): Builder
    {
        return $query->where('route_name', $routeName);
    }

    /**
     * Get the favicon URL attribute.
     */
    public function getFaviconUrlAttribute(): ?string
    {
        if (!$this->favicon_path) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($this->favicon_path, FILTER_VALIDATE_URL)) {
            return $this->favicon_path;
        }

        // If it's a storage path, generate URL
        if (Storage::exists($this->favicon_path)) {
            return Storage::url($this->favicon_path);
        }

        // If it's a public path, return asset URL
        return asset($this->favicon_path);
    }

    /**
     * Get the effective title (falls back to og_title if title is empty).
     */
    public function getEffectiveTitleAttribute(): ?string
    {
        return $this->title ?: $this->og_title;
    }

    /**
     * Get the effective description (falls back to og_description if meta_description is empty).
     */
    public function getEffectiveDescriptionAttribute(): ?string
    {
        return $this->meta_description ?: $this->og_description;
    }

    /**
     * Generate all meta tags as HTML string.
     */
    public function generateMetaTags(): string
    {
        $tags = [];

        // Basic meta tags
        if ($this->effective_title) {
            $tags[] = '<title>' . e($this->effective_title) . '</title>';
        }

        if ($this->effective_description) {
            $tags[] = '<meta name="description" content="' . e($this->effective_description) . '">';
        }

        if ($this->meta_keywords) {
            $tags[] = '<meta name="keywords" content="' . e($this->meta_keywords) . '">';
        }

        if ($this->author) {
            $tags[] = '<meta name="author" content="' . e($this->author) . '">';
        }

        if ($this->robots_meta) {
            $tags[] = '<meta name="robots" content="' . e($this->robots_meta) . '">';
        }

        // Canonical URL
        if ($this->canonical_url) {
            $tags[] = '<link rel="canonical" href="' . e($this->canonical_url) . '">';
        }

        // Favicon
        if ($this->favicon_url) {
            $tags[] = '<link rel="icon" type="' . e($this->favicon_type) . '" href="' . e($this->favicon_url) . '">';
        }

        // Open Graph tags
        if ($this->og_title) {
            $tags[] = '<meta property="og:title" content="' . e($this->og_title) . '">';
        }

        if ($this->og_description) {
            $tags[] = '<meta property="og:description" content="' . e($this->og_description) . '">';
        }

        if ($this->og_type) {
            $tags[] = '<meta property="og:type" content="' . e($this->og_type) . '">';
        }

        if ($this->og_url) {
            $tags[] = '<meta property="og:url" content="' . e($this->og_url) . '">';
        }

        if ($this->og_image) {
            $tags[] = '<meta property="og:image" content="' . e($this->og_image) . '">';
        }

        if ($this->og_site_name) {
            $tags[] = '<meta property="og:site_name" content="' . e($this->og_site_name) . '">';
        }

        // Twitter Card tags
        if ($this->twitter_card) {
            $tags[] = '<meta name="twitter:card" content="' . e($this->twitter_card) . '">';
        }

        if ($this->twitter_title) {
            $tags[] = '<meta name="twitter:title" content="' . e($this->twitter_title) . '">';
        }

        if ($this->twitter_description) {
            $tags[] = '<meta name="twitter:description" content="' . e($this->twitter_description) . '">';
        }

        if ($this->twitter_image) {
            $tags[] = '<meta name="twitter:image" content="' . e($this->twitter_image) . '">';
        }

        if ($this->twitter_site) {
            $tags[] = '<meta name="twitter:site" content="' . e($this->twitter_site) . '">';
        }

        if ($this->twitter_creator) {
            $tags[] = '<meta name="twitter:creator" content="' . e($this->twitter_creator) . '">';
        }

        // Hreflang tags
        if ($this->hreflang && is_array($this->hreflang)) {
            foreach ($this->hreflang as $lang => $url) {
                $tags[] = '<link rel="alternate" hreflang="' . e($lang) . '" href="' . e($url) . '">';
            }
        }

        // Schema.org JSON-LD
        if ($this->schema_markup && is_array($this->schema_markup)) {
            $tags[] = '<script type="application/ld+json">' . json_encode($this->schema_markup) . '</script>';
        }

        // Custom head tags
        if ($this->custom_head_tags) {
            $tags[] = $this->custom_head_tags;
        }

        return implode("\n", $tags);
    }

    /**
     * Create or update SEO aspects for a page.
     */
    public static function updateOrCreateForPage(string $pageUrl, array $seoData): self
    {
        return self::updateOrCreate(
            ['page_url' => $pageUrl],
            $seoData
        );
    }

    /**
     * Get SEO aspects for current page by URL.
     */
    public static function getForPage(string $pageUrl): ?self
    {
        return self::active()->byPageUrl($pageUrl)->first();
    }

    /**
     * Get SEO aspects for current page by route name.
     */
    public static function getForRoute(string $routeName): ?self
    {
        return self::active()->byRoute($routeName)->first();
    }
}
