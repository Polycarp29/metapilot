<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\PixelSite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PixelSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_pixel_hit_is_blocked_on_unauthorised_domain()
    {
        $org = Organization::factory()->create();
        $token = (string) \Illuminate\Support\Str::uuid();
        $pixelSite = PixelSite::create([
            'organization_id' => $org->id,
            'label' => 'Pinned Site',
            'allowed_domain' => 'allowed.com',
            'ads_site_token' => $token,
        ]);

        // Hit from unauthorised domain
        $response = $this->postJson(route('cdn.track-hit'), [
            'token' => $token,
            'page_url' => 'https://malicious.com/',
            'page_view_id' => 'view-' . \Illuminate\Support\Str::random(10),
            '_ts' => time(),
            '_sig' => 'fake-sig'
        ], [
            'Origin' => 'https://malicious.com'
        ]);

        $response->assertStatus(403);
        $response->assertJson(['error' => 'Domain not authorised']);
    }
}
