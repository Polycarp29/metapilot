<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use App\Models\User;
use App\Models\Organization;
use App\Models\Sitemap;
use App\Jobs\ProcessCrawlerResultJob;
use Tests\TestCase;

class CrawlerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_crawler_callback_updates_sitemap_status_to_crawling()
    {
        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        $sitemap = Sitemap::create([
            'user_id' => $user->id,
            'organization_id' => $organization->id,
            'name' => 'Test Sitemap',
            'filename' => 'test.xml'
        ]);

        $response = $this->postJson(route('api.crawler.callback'), [
            'event' => 'started',
            'job_id' => 'test-job-id',
            'sitemap_id' => $sitemap->id
        ]);

        $response->assertStatus(200);
        $this->assertEquals('crawling', $sitemap->fresh()->last_crawl_status);
        $this->assertEquals('test-job-id', $sitemap->fresh()->last_crawl_job_id);
    }

    public function test_crawler_callback_updates_sitemap_status_to_completed()
    {
        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        $sitemap = Sitemap::create([
            'user_id' => $user->id,
            'organization_id' => $organization->id,
            'name' => 'Test Sitemap',
            'filename' => 'test.xml',
            'last_crawl_status' => 'crawling'
        ]);

        $response = $this->postJson(route('api.crawler.callback'), [
            'event' => 'completed',
            'job_id' => 'test-job-id',
            'sitemap_id' => $sitemap->id
        ]);

        $response->assertStatus(200);
        $this->assertEquals('completed', $sitemap->fresh()->last_crawl_status);
    }

    public function test_crawler_callback_dispatches_process_job_on_result_event()
    {
        Queue::fake();

        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        $sitemap = Sitemap::create([
            'user_id' => $user->id,
            'organization_id' => $organization->id,
            'name' => 'Test Sitemap',
            'filename' => 'test.xml'
        ]);

        $resultData = [
            'url' => 'https://example.com/page1',
            'data' => ['title' => 'Page 1']
        ];

        $response = $this->postJson(route('api.crawler.callback'), [
            'event' => 'result',
            'job_id' => 'test-job-id',
            'sitemap_id' => $sitemap->id,
            'data' => $resultData
        ]);

        $response->assertStatus(200);
        Queue::assertPushed(ProcessCrawlerResultJob::class, function ($job) use ($resultData) {
            return $job->resultData['url'] === $resultData['url'];
        });

    }
}
