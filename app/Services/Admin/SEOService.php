<?php

namespace App\Services\Admin;

use Illuminate\Http\Request;
use App\View\Components\SEOAspects;
use Illuminate\Support\Facades\Route;
use App\Models\Admin\Settings\SEOConfigurations;

class SEOService{
    protected ? SEOConfigurations $seoAspects = null;

    public function loadCurrentPage(Request $request){
        $currentUrl = $request->url();
        $currentRoute = Route::currentRouteName();

        $this->seoAspects = SEOConfigurations::getForPage($currentUrl);

        // If not found by URL, try by route name
        if (!$this->seoAspects && $currentRoute) {
            $this->seoAspects = SEOConfigurations::getForRoute($currentRoute);
        }

        return $this;
    }


     /**
     * Load SEO aspects by page URL.
     */
    public function loadForPage(string $pageUrl): self
    {
        $this->seoAspects = SEOConfigurations::getForPage($pageUrl);
        return $this;
    }

    /**
     * Load SEO aspects by route name.
     */
    public function loadForRoute(string $routeName): self
    {
        $this->seoAspects = SEOConfigurations::getForRoute($routeName);
        return $this;
    }

    /**
     * Get the current SEO aspects instance.
     */
    public function getSeoAspects(): ?SEOConfigurations
    {
        return $this->seoAspects;
    }

    /**
     * Get page title with fallback.
     */
    public function getTitle(string $fallback = 'Page Title'): string
    {
        if (!$this->seoAspects) {
            return $fallback;
        }

        return $this->seoAspects->effective_title ?: $fallback;
    }

    /**
     * Get meta description.
     */
    public function getDescription(): ?string
    {
        return $this->seoAspects?->effective_description;
    }

    /**
     * Get favicon URL.
     */
    public function getFaviconUrl(): ?string
    {
        return  $this->seoAspects? asset('storage/' . $this->seoAspects->favicon_path ) : null;
    }

    /**
     * Get favicon type.
     */
    public function getFaviconType(): string
    {
        return $this->seoAspects?->favicon_type ?: 'image/x-icon';
    }

    /**
     * Check if SEO aspects exist for current page.
     */
    public function hasSeoData(): bool
    {
        return $this->seoAspects !== null;
    }

    /**
     * Generate all meta tags HTML.
     */
    public function generateMetaTags(): string
    {
        if (!$this->seoAspects) {
            return '';
        }

        return $this->seoAspects->generateMetaTags();
    }

    /**
     * Get canonical URL.
     */
    public function getCanonicalUrl(): ?string
    {
        return $this->seoAspects?->canonical_url;
    }

    /**
     * Get robots meta tag.
     */
    public function getRobotsMeta(): string
    {
        return $this->seoAspects?->robots_meta ?: 'index,follow';
    }

    /**
     * Get Open Graph data as array.
     */
    public function getOpenGraphData(): array
    {
        if (!$this->seoAspects) {
            return [];
        }

        return array_filter([
            'title' => $this->seoAspects->og_title,
            'description' => $this->seoAspects->og_description,
            'image' => $this->seoAspects->og_image,
            'type' => $this->seoAspects->og_type,
            'url' => $this->seoAspects->og_url,
            'site_name' => $this->seoAspects->og_site_name,
        ]);
    }

    /**
     * Get Twitter Card data as array.
     */
    public function getTwitterCardData(): array
    {
        if (!$this->seoAspects) {
            return [];
        }

        return array_filter([
            'card' => $this->seoAspects->twitter_card,
            'title' => $this->seoAspects->twitter_title,
            'description' => $this->seoAspects->twitter_description,
            'image' => $this->seoAspects->twitter_image,
            'site' => $this->seoAspects->twitter_site,
            'creator' => $this->seoAspects->twitter_creator,
        ]);
    }

    /**
     * Get structured data (Schema.org) as JSON.
     */
    public function getStructuredDataJson(): ?string
    {
        if (!$this->seoAspects || !$this->seoAspects->schema_markup) {
            return null;
        }

        return json_encode($this->seoAspects->schema_markup, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Create default SEO data for a page.
     */
    public function createDefaultSeoForPage(string $pageUrl, array $defaults = []): SEOConfigurations
    {
        $defaultData = array_merge([
            'page_url' => $pageUrl,
            'route_name' => Route::currentRouteName(),
            'is_active' => true,
            'title' => 'VervioDesk - ' . ucwords(str_replace(['/', '-', '_'], ' ', trim($pageUrl, '/'))),
            'meta_description' => 'Discover innovative solutions with VervioDesk.',
            'robots_meta' => 'index,follow',
            'og_type' => 'website',
            'twitter_card' => 'summary_large_image',
        ], $defaults);

        return SEOConfigurations::updateOrCreateForPage($pageUrl, $defaultData);
    }

    /**
     * Bulk update SEO data for multiple pages.
     */
    public function bulkUpdateSeoData(array $pagesData): array
    {
        $results = [];

        foreach ($pagesData as $pageUrl => $seoData) {
            $results[$pageUrl] = SEOConfigurations::updateOrCreateForPage($pageUrl, $seoData);
        }

        return $results;
    }

    /**
     * Get GTM Head script.
     */
    public function getGtmHead(): string
    {
        $tag = $this->seoAspects?->gtm_head 
            ?? SEOConfigurations::first()?->gtm_head 
            ?? '';
            
        return $tag;
    }

    /**
     * Get GTM Body script.
     */
    public function getGtmBody(): string
    {
        $tag = $this->seoAspects?->gtm_body 
            ?? SEOConfigurations::first()?->gtm_body 
            ?? '';

        return $tag;
    }

    /**
     * Get Microsoft/Other script.
     */
    public function getMicrosoftTag(): string
    {
        $tag = $this->seoAspects?->microsoft_tag 
            ?? SEOConfigurations::first()?->microsoft_tag 
            ?? '';

        return $tag;
    }

    /**
     * Get SEO performance data (basic metrics).
     */
    public function getSeoMetrics(): array
    {
        return [
            'total_pages' => SEOConfigurations::count(),
            'active_pages' => SEOConfigurations::active()->count(),
            'pages_with_meta_description' => SEOConfigurations::active()->whereNotNull('meta_description')->count(),
            'pages_with_og_image' => SEOConfigurations::active()->whereNotNull('og_image')->count(),
            'pages_with_structured_data' => SEOConfigurations::active()->whereNotNull('schema_markup')->count(),
        ];
    }
}