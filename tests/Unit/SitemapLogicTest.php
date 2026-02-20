<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

use App\Services\SitemapService;

class SitemapLogicTest extends TestCase
{
    protected $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SitemapService();
    }

    public function test_url_sanitization_removes_query_params_and_fragments(): void
    {
        $url = 'https://example.com/path?arg=val#fragment';
        $sanitized = $this->service->sanitizeUrl($url);
        
        $this->assertEquals('https://example.com/path', $sanitized);
    }

    public function test_url_sanitization_adds_https_if_missing(): void
    {
        $url = 'example.com/page';
        $sanitized = $this->service->sanitizeUrl($url);
        
        $this->assertEquals('https://example.com/page', $sanitized);
    }

    public function test_url_validation(): void
    {
        $this->assertTrue($this->service->isValidUrl('https://example.com/valid'));
        $this->assertFalse($this->service->isValidUrl('not-a-url'));
        $this->assertFalse($this->service->isValidUrl('ftp://example.com')); // Only http/https
    }

    public function test_url_sanitization_normalizes_slashes(): void
    {
        $url = 'https://example.com//double//slash';
        $sanitized = $this->service->sanitizeUrl($url);
        
        $this->assertEquals('https://example.com/double/slash', $sanitized);
    }

    public function test_url_structure_analysis_detects_deep_nesting(): void
    {
        $url = 'https://example.com/a/b/c/d/e/deep-page';
        $bottlenecks = $this->service->analyzeUrlStructure($url);
        
        $this->assertContains('deep_nesting', array_column($bottlenecks, 'type'));
    }

    public function test_url_structure_analysis_detects_long_slug(): void
    {
        $longSlug = str_repeat('a', 80);
        $url = "https://example.com/blog/{$longSlug}";
        $bottlenecks = $this->service->analyzeUrlStructure($url);
        
        $this->assertContains('long_slug', array_column($bottlenecks, 'type'));
    }

    public function test_url_structure_analysis_detects_underscores(): void
    {
        $url = 'https://example.com/page_with_underscores';
        $bottlenecks = $this->service->analyzeUrlStructure($url);
        
        $this->assertContains('underscores', array_column($bottlenecks, 'type'));
    }

    public function test_slug_quality_assessment(): void
    {
        $goodUrl = 'https://example.com/good-slug';
        $this->assertEquals('good', $this->service->assessSlugQuality($goodUrl));

        $warningUrl = 'https://example.com/a/b/c/d/e/warning-slug'; // Deep nesting
        $this->assertEquals('warning', $this->service->assessSlugQuality($warningUrl));

        $longSlug = str_repeat('a', 80);
        $poorUrl = "https://example.com/a/b/c/d/e/f/{$longSlug}"; // Deep + Long slug
        $this->assertEquals('poor', $this->service->assessSlugQuality($poorUrl));
    }
}
