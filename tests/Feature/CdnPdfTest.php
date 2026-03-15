<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Models\PixelSite;
use App\Models\Sitemap;
use App\Models\SitemapLink;
use App\Models\AdTrackEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CdnPdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_generate_pdf_report_with_acquisition_data()
    {
        $user = User::factory()->create();
        $org = Organization::factory()->create();
        $user->organizations()->attach($org, ['role' => 'admin']);
        
        $pixelSite = PixelSite::create([
            'organization_id' => $org->id,
            'label' => 'Test site',
            'allowed_domain' => 'example.com',
            'ads_site_token' => (string) \Illuminate\Support\Str::uuid(),
        ]);

        $sitemap = Sitemap::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'name' => 'Main Sitemap',
            'site_url' => 'https://example.com',
            'filename' => 'sitemap.xml'
        ]);

        // Create some links with SEO audit
        for ($i = 0; $i < 5; $i++) {
            SitemapLink::create([
                'sitemap_id' => $sitemap->id,
                'url' => 'https://example.com/page-' . $i,
                'seo_audit' => ['score' => 80],
                'cdn_active' => true,
                'cdn_engagement_score' => 85
            ]);
        }

        // Create some traffic events for acquisition stats
        AdTrackEvent::create([
            'organization_id' => $org->id,
            'pixel_site_id' => $pixelSite->id,
            'country_code' => 'US',
            'city' => 'New York',
            'device_type' => 'Desktop',
            'referrer' => 'https://google.com',
            'page_url' => 'https://example.com/page-1',
            'ip_hash' => hash('sha256', '127.0.0.1'),
            'site_token' => $pixelSite->ads_site_token
        ]);
        
        // Add another with different city/referrer for variety
        AdTrackEvent::create([
            'organization_id' => $org->id,
            'pixel_site_id' => $pixelSite->id,
            'country_code' => 'CA',
            'city' => 'Toronto',
            'device_type' => 'Mobile',
            'referrer' => 'https://facebook.com',
            'page_url' => 'https://example.com/page-1',
            'ip_hash' => hash('sha256', '127.0.0.2'),
            'site_token' => $pixelSite->ads_site_token
        ]);

        $response = $this->actingAs($user)
            ->get(route('google-ads.web-analysis.pdf', ['pixel_site_id' => $pixelSite->id]));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        
        // Assert filename format
        $expectedName = 'web-analytics-report-' . now()->format('Y-m-d') . '.pdf';
        $response->assertHeader('Content-Disposition', 'attachment; filename=' . $expectedName);
    }
}
