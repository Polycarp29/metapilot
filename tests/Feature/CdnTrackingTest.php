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
            'campaign' => 'spring_promo',
            'utm_source' => 'google',
            'utm_medium' => 'cpc',
            'gclid' => 'GCLID12345'
        ];

        $response = $this->postJson('/cdn/ad-hit', $payload);

        $response->assertStatus(204);

        $this->assertDatabaseHas('ad_track_events', [
            'organization_id' => $org->id,
            'page_url' => 'https://example.com/landing',
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
