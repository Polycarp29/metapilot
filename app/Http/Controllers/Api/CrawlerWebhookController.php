<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sitemap;
use App\Models\SitemapLink;
use App\Services\SitemapService;
use App\Jobs\ProcessCrawlerResultJob;
use App\Jobs\ProcessCrawlerDiscoveryJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CrawlerWebhookController extends Controller
{
    /**
     * Handle callbacks from the Python Crawler service.
     */
    public function handle(Request $request)
    {
        // Verify shared secret
        $expectedSecret = config('services.crawler.webhook_secret');
        if ($expectedSecret && $request->header('X-Crawler-Secret') !== $expectedSecret) {
            Log::warning('Crawler webhook: invalid secret received.');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $jobId = $payload['job_id'] ?? null;
        $sitemapId = $payload['sitemap_id'] ?? null;
        $event = $payload['event'] ?? 'unknown';

        Log::info("Crawler Webhook received: [Event: $event] [Job: $jobId]", $payload);

        if (!$sitemapId) {
            return response()->json(['error' => 'Missing sitemap_id'], 400);
        }

        $sitemap = Sitemap::find($sitemapId);
        if (!$sitemap) {
            Log::error("Sitemap not found for callback: $sitemapId");
            return response()->json(['error' => 'Sitemap not found'], 404);
        }

        switch ($event) {
            case 'started':
                $sitemap->update([
                    'last_crawl_status' => 'crawling',
                    'last_crawl_job_id' => $jobId
                ]);
                break;

            case 'completed':
                $sitemap->update(['last_crawl_status' => 'completed']);
                break;

            case 'failed':
                $sitemap->update(['last_crawl_status' => 'failed']);
                Log::warning("Crawler job $jobId reported failure", $payload['data'] ?? []);
                break;

            case 'discovered':
                // URL discovered but not yet fully crawled
                $this->handleDiscovery($sitemap, $payload);
                break;

            case 'result':
                // Full crawl result for a page — pass complete payload
                if (isset($payload['data'])) {
                    ProcessCrawlerResultJob::dispatch($payload);
                }
                break;

            default:
                Log::debug("Unhandled crawler event: $event");
                break;
        }

        return response()->json(['status' => 'acknowledged']);
    }
}
