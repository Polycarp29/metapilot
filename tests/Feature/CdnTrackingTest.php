<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CdnTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_pixel_hit_is_recorded()
    {
        $token = (string) \Illuminate\Support\Str::uuid();
        $org = Organization::factory()->create([
            'ads_site_token' => $token
        ]);

        $payload = [
            'token' => $token,
            'page_url' => 'https://example.com/landing',
            'referrer' => 'https://google.com',
            'session_id' => 'test-session-xyz',
            'screen_resolution' => '1920x1080',
            'campaign' => 'spring_promo',
            'utm_source' => 'google',
            'utm_medium' => 'cpc',
            'gclid' => 'GCLID12345'
        ];

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        ])->postJson('/cdn/ad-hit', $payload);

        $response->assertStatus(204);

        $this->assertDatabaseHas('ad_track_events', [
            'organization_id' => $org->id,
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
    }

    public function test_pixel_hit_with_invalid_token_is_rejected()
    {
        $payload = [
            'token' => 'invalid-token',
            'url' => 'https://example.com'
        ];

        $response = $this->postJson('/cdn/ad-hit', $payload);

        $response->assertStatus(422);
    }
}
