<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Models\PixelSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CdnTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_pixel_hit_with_invalid_token_is_rejected()
    {
        $payload = [
            'token' => (string) \Illuminate\Support\Str::uuid(), // Must be a valid UUID to pass validation
            'page_view_id' => 'test-pv-123',
            '_ts' => time(),
            '_sig' => 'invalid-sig'
        ];

        $response = $this->postJson('/cdn/ad-hit', $payload);

        $response->assertStatus(403); // Now returns 403 if token lookup fails
    }

    public function test_pixel_hit_is_recorded()
    {
        $org = Organization::factory()->create();
        $pixelSite = PixelSite::create([
            'organization_id' => $org->id,
            'label' => 'Test Site',
            'ads_site_token' => (string) \Illuminate\Support\Str::uuid(),
        ]);

        $ts = time();
        $pageViewId = 'test-pv-123';
        $signature = hash_hmac('sha256', $pixelSite->ads_site_token . $pageViewId . $ts, $pixelSite->ads_site_token);

        $payload = [
            'token' => $pixelSite->ads_site_token,
            'page_view_id' => $pageViewId,
            'page_url' => 'https://example.com/landing',
            'referrer' => 'https://google.com',
            'session_id' => 'test-session-xyz',
            'screen_resolution' => '1920x1080',
            'campaign_id' => 'spring_promo',
            'utm_source' => 'google',
            'utm_medium' => 'cpc',
            'gclid' => 'GCLID12345',
            '_ts' => $ts,
            '_sig' => $signature,
        ];

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        ])->postJson('/cdn/ad-hit', $payload);

        if ($response->status() !== 204) {
            dump($response->json());
        }

        $response->assertStatus(204);

        $this->assertDatabaseHas('ad_track_events', [
            'organization_id' => $org->id,
            'pixel_site_id' => $pixelSite->id,
            'page_url' => 'https://example.com/landing',
            'referrer' => 'https://google.com',
            'session_id' => 'test-session-xyz',
            'browser' => 'Safari',
            'platform' => 'iOS',
            'device_type' => 'Mobile',
            'screen_resolution' => '1920x1080',
            'utm_source' => 'google',
            'gclid' => 'GCLID12345'
        ]);

        $pixelSite->refresh();
        $this->assertNotNull($pixelSite->pixel_verified_at);
    }

    public function test_pixel_hit_with_invalid_signature_is_rejected()
    {
        $org = Organization::factory()->create();
        $pixelSite = PixelSite::create([
            'organization_id' => $org->id,
            'label' => 'Test Site',
        ]);

        $payload = [
            'token' => $pixelSite->ads_site_token,
            'page_view_id' => 'test-pv-123',
            '_ts' => time(),
            '_sig' => 'invalid-sig'
        ];

        $response = $this->postJson('/cdn/ad-hit', $payload);

        $response->assertStatus(403);
    }

    public function test_multiple_pixel_sites_hits_are_separated()
    {
        $org = Organization::factory()->create();
        $siteA = PixelSite::create(['organization_id' => $org->id, 'label' => 'Site A']);
        $siteB = PixelSite::create(['organization_id' => $org->id, 'label' => 'Site B']);

        // Send hit for Site A
        $ts = time();
        $pvA = 'pv-a-123';
        $sigA = hash_hmac('sha256', $siteA->ads_site_token . $pvA . $ts, $siteA->ads_site_token);
        
        $this->postJson('/cdn/ad-hit', [
            'token' => $siteA->ads_site_token,
            'page_view_id' => $pvA,
            '_ts' => $ts,
            '_sig' => $sigA,
        ])->assertStatus(204);

        // Send hit for Site B
        $pvB = 'pv-b-456';
        $sigB = hash_hmac('sha256', $siteB->ads_site_token . $pvB . $ts, $siteB->ads_site_token);

        $this->postJson('/cdn/ad-hit', [
            'token' => $siteB->ads_site_token,
            'page_view_id' => $pvB,
            '_ts' => $ts,
            '_sig' => $sigB,
        ])->assertStatus(204);

        $this->assertEquals(1, \App\Models\AdTrackEvent::where('pixel_site_id', $siteA->id)->count());
        $this->assertEquals(1, \App\Models\AdTrackEvent::where('pixel_site_id', $siteB->id)->count());
    }

    public function test_verify_connection_handshake()
    {
        $org = Organization::factory()->create();
        $pixelSite = PixelSite::create(['organization_id' => $org->id, 'label' => 'Test Site']);
        
        $challenge = 'test-challenge';
        $response = $this->getJson("/cdn/verify-connection?token={$pixelSite->ads_site_token}&challenge={$challenge}");

        $response->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'echo' => $challenge
            ]);
    }

    public function test_can_manually_trigger_schema_generation()
    {
        $user = User::factory()->create();
        $org = Organization::factory()->create();
        $user->organizations()->attach($org, ['role' => 'admin']);
        $user->update(['current_organization_id' => $org->id]);
        
        $pixelSite = PixelSite::create([
            'organization_id' => $org->id, 
            'label' => 'Test Site',
            'ads_site_token' => (string) \Illuminate\Support\Str::uuid()
        ]);
        
        $this->actingAs($user);

        // Mock Http for the internal generateSchemaForPage logic which might call OpenAI or Scraper
        \Illuminate\Support\Facades\Http::fake();
        
        // We also need to satisfy the organization check in controller
        $response = $this->postJson(route('google-ads.generate-schema'), [
            'pixel_site_id' => $pixelSite->id,
            'url' => 'https://example.com/test-page'
        ]);

        if ($response->status() !== 200) {
            dump($response->json());
        }

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);

        $this->assertDatabaseHas('cdn_page_schemas', [
            'pixel_site_id' => $pixelSite->id,
            'url' => 'https://example.com/test-page'
        ]);
    }

    public function test_can_fetch_page_source()
    {
        $user = User::factory()->create();
        $org = Organization::factory()->create();
        $user->organizations()->attach($org, ['role' => 'admin']);
        $user->update(['current_organization_id' => $org->id]);

        $pixelSite = PixelSite::create([
            'organization_id' => $org->id, 
            'label' => 'Example Site',
            'allowed_domain' => 'example.com',
            'ads_site_token' => (string) \Illuminate\Support\Str::uuid()
        ]);
        
        $this->actingAs($user);

        $htmlContent = "<html><body><h1>Test Page</h1></body></html>";
        \Illuminate\Support\Facades\Http::fake([
            'https://example.com/test-page' => \Illuminate\Support\Facades\Http::response($htmlContent, 200)
        ]);

        $response = $this->getJson(route('google-ads.page-source', ['url' => 'https://example.com/test-page']));

        if ($response->status() !== 200) {
            dump($response->json());
        }

        $response->assertStatus(200)
            ->assertJson([
                'html' => $htmlContent,
                'url' => 'https://example.com/test-page'
            ]);
    }
}
