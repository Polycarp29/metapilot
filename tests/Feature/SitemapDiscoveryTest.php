<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\PixelSite;
use App\Models\Sitemap;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_discovery_sitemaps_are_isolated_by_pixel_site()
    {
        $user = User::factory()->create();
        $org = Organization::factory()->create();
        $user->organizations()->attach($org->id, ['role' => 'admin']);

        $siteA = PixelSite::create([
            'organization_id' => $org->id,
            'label' => 'Site A',
            'allowed_domain' => 'site-a.com',
            'ads_site_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $siteB = PixelSite::create([
            'organization_id' => $org->id,
            'label' => 'Site B',
            'allowed_domain' => 'site-b.com',
            'ads_site_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $this->actingAs($user);

        // 1. Enable discovery for Site A
        $responseA = $this->postJson(route('google-ads.enable-cdn-discovery'), [
            'pixel_site_id' => $siteA->id
        ]);
        $responseA->assertStatus(200);
        $sitemapAId = $responseA->json('sitemap_id');

        // 2. Enable discovery for Site B
        $responseB = $this->postJson(route('google-ads.enable-cdn-discovery'), [
            'pixel_site_id' => $siteB->id
        ]);
        $responseB->assertStatus(200);
        $sitemapBId = $responseB->json('sitemap_id');

        $this->assertNotEquals($sitemapAId, $sitemapBId);

        // 3. Verify sitemaps have correct pixel_site_id
        $sitemapA = Sitemap::find($sitemapAId);
        $sitemapB = Sitemap::find($sitemapBId);
        $this->assertEquals($siteA->id, $sitemapA->pixel_site_id);
        $this->assertEquals($siteB->id, $sitemapB->pixel_site_id);

        // 4. Verify webAnalysis filters sitemaps correctly
        $analysisA = $this->getJson(route('google-ads.web-analysis', ['pixel_site_id' => $siteA->id]));
        $this->assertCount(1, $analysisA->json('sitemaps'));
        $this->assertEquals($sitemapAId, $analysisA->json('sitemaps.0.id'));

        $analysisB = $this->getJson(route('google-ads.web-analysis', ['pixel_site_id' => $siteB->id]));
        $this->assertCount(1, $analysisB->json('sitemaps'));
        $this->assertEquals($sitemapBId, $analysisB->json('sitemaps.0.id'));
    }
}
