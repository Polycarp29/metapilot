<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Services\SerperService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use App\Models\User;
use App\Models\Organization;
use App\Models\KeywordResearch;

class KeywordResearchTest extends TestCase
{
    use RefreshDatabase;
    /**
     * Test the keyword research page and Serper integration.
     */
    public function test_keyword_research_page_is_accessible()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('keywords.research'));

        $response->assertStatus(200);
    }

    /**
     * Test Serper service search functionality with mocking.
     */
    public function test_serper_service_returns_results_when_mocked()
    {
        Http::fake([
            'google.serper.dev/search' => Http::response([
                'organic' => [
                    ['title' => 'Test Result', 'link' => 'https://example.com', 'snippet' => 'Test snippet']
                ]
            ], 200)
        ]);

        config(['services.serper.api_key' => 'test-key']);

        $service = new SerperService();
        $results = $service->search('test query');

        $this->assertNotNull($results);
        $this->assertEquals('Test Result', $results['organic'][0]['title']);
    }

    /**
     * Test the controller handles search requests and returns hybrid data to Inertia.
     */
    public function test_research_controller_returns_hybrid_data_to_inertia()
    {
        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        $user->organizations()->attach($organization->id, ['role' => 'owner']);
        
        $this->actingAs($user);
        session(['current_organization_id' => $organization->id]);

        Http::fake([
            'google.serper.dev/search' => Http::response([
                'organic' => [['title' => 'Hybrid Result', 'link' => 'https://example.com', 'snippet' => 'Commercial snippet buy price']]
            ], 200),
            'google.serper.dev/trends' => Http::response([
                'interestOverTime' => [
                    'timelineData' => [
                        ['time' => '1641000000', 'value' => [50]],
                        ['time' => '1641086400', 'value' => [75]]
                    ]
                ],
                'relatedQueries' => [
                    'top' => ['related 1', 'related 2'],
                    'rising' => []
                ]
            ], 200)
        ]);

        config(['services.serper.api_key' => 'test-key']);
        config(['services.serpapi.api_key' => 'test-serp-key']);

        $response = $this->get(route('keywords.research', ['q' => 'buy shoes']));

        $response->assertInertia(fn ($page) => $page
            ->component('Keywords/Research')
            ->where('filters.gl', 'ke')
            ->where('results.organic.0.title', 'Hybrid Result')
            ->where('intent', 'Commercial')
            ->where('growth_rate', 50) // (75-50)/50 * 100 = 50%
            ->where('current_interest', 75)
            ->where('cached', false)
        );

        // Verify it's stored in DB
        $this->assertDatabaseHas('keyword_researches', [
            'query' => 'buy shoes',
            'gl' => 'ke',
            'intent' => 'Commercial',
            'growth_rate' => 50,
            'current_interest' => 75
        ]);
    }

    /**
     * Test results are returned from cache on second request.
     */
    public function test_research_results_are_cached()
    {
        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        $user->organizations()->attach($organization->id, ['role' => 'owner']);
        
        $this->actingAs($user);
        session(['current_organization_id' => $organization->id]);

        // Create a cached record
        KeywordResearch::create([
            'organization_id' => $organization->id,
            'query' => 'cached query',
            'gl' => 'ke',
            'hl' => 'en',
            'intent' => 'Informational',
            'niche' => 'General',
            'results' => ['organic' => [['title' => 'Cached Title']]],
            'last_searched_at' => now(),
        ]);

        // Mock Http should NOT be called
        Http::fake();

        $response = $this->get(route('keywords.research', ['q' => 'cached query']));

        $response->assertInertia(fn ($page) => $page
            ->where('results.organic.0.title', 'Cached Title')
            ->where('cached', true)
        );
        
        Http::assertNothingSent();
    }
}
