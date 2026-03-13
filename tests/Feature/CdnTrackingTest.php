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
}
