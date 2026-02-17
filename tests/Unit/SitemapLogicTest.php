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
}
