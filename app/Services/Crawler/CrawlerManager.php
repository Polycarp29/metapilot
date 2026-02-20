<?php

namespace App\Services\Crawler;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CrawlerManager
{
    protected $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.crawler.url', env('CRAWLER_SERVICE_URL', 'http://localhost:5000'));
    }

    /**
     * Dispatch a crawl job to the Python microservice.
     */
    public function dispatch($sitemapId, $url, $maxDepth = 3, $options = [])
    {
        $callbackUrl = route('api.crawler.callback');
        
        // Ensure the callback URL is reachable (might need adjustment for local dev)
        if (app()->environment('local') && str_contains($callbackUrl, 'localhost')) {
             // If we are in local dev, we might need a tunnel or just log it
             Log::info("Local environment detected: generated callback URL is $callbackUrl");
        }

        $payload = [
            'job_id' => $options['job_id'] ?? (string) Str::uuid(),
            'sitemap_id' => $sitemapId,
            'url' => $url,
            'max_depth' => $maxDepth,
            'callback_url' => $callbackUrl,
            'options' => array_merge([
                'render_js' => true,
                'individual_results' => false,
            ], $options)
        ];

        try {
            Log::info("Dispatching crawl to Python API: {$this->baseUrl}/v1/crawl", $payload);
            
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->timeout(10)->retry(3, 100)->post("{$this->baseUrl}/v1/crawl", $payload);

            if ($response->successful()) {
                $data = $response->json();
                Log::info("Crawler job dispatched: " . ($data['job_id'] ?? 'no-id'));
                return $data;
            }

            Log::error("Failed to dispatch crawl: " . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error("Exception while dispatching crawl: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Check job status from the Python service.
     */
    public function getStatus($jobId)
    {
        try {
            $response = Http::get("{$this->baseUrl}/v1/status/{$jobId}");
            if ($response->successful()) {
                return $response->json();
            }
            return null;
        } catch (\Exception $e) {
            Log::error("Error checking crawler status: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Stop/cancel a crawl job in the Python service.
     */
    public function stop($jobId)
    {
        try {
            $response = Http::post("{$this->baseUrl}/v1/stop/{$jobId}");
            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Error stopping crawler job: " . $e->getMessage());
            return false;
        }
    }
}
