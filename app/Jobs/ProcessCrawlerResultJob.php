<?php

namespace App\Jobs;

use App\Models\SitemapLink;
use App\Services\SitemapService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessCrawlerResultJob implements ShouldQueue
{
    use Queueable;

    public $resultData;

    public function __construct(array $resultData)
    {
        $this->resultData = $resultData;
    }

    public function handle(): void
    {
        $data = $this->resultData['data'] ?? null;
        $url = $this->resultData['url'] ?? null;
        $jobId = $this->resultData['job_id'] ?? null;
        $sitemapId = $this->resultData['sitemap_id'] ?? null;

        if (!$sitemapId || !$url) {
            Log::warning('ProcessCrawlerResultJob: missing sitemap_id or url', $this->resultData);
            return;
        }

        if (!$data) {
            Log::warning("ProcessCrawlerResultJob: no data for URL: $url");
            return;
        }

        $sitemapService = app(SitemapService::class);
        $bottlenecks = $sitemapService->analyzeUrlStructure($url);
        $slugQuality = $sitemapService->assessSlugQuality($url);

        // Count internal links out from the page data
        $internalLinksOut = 0;
        if (isset($data['internal_links_count'])) {
            $internalLinksOut = $data['internal_links_count'];
        }

        $httpStatus = $data['request_analysis']['status'] ?? 200;
        $canonicalUrl = $data['meta']['canonical'] ?? null;
        
        // Normalize URLs for comparison
        $normalize = function($u) {
            return strtolower(rtrim(trim($u), '/'));
        };

        $isCanonical = true;
        if ($httpStatus >= 300) {
            $isCanonical = false; // Redirects or errors are not "safe" for sitemap
        } elseif ($canonicalUrl) {
            $isCanonical = ($normalize($url) === $normalize($canonicalUrl));
        }

        SitemapLink::updateOrCreate(
            ['sitemap_id' => $sitemapId, 'url' => $url],
            [
                'title' => $data['title'] ?? null,
                'description' => $data['meta']['description'] ?? null,
                'h1' => $data['content']['h1'] ?? null,
                'canonical' => $canonicalUrl,
                'canonical_url' => $canonicalUrl,
                'effective_url' => $url, // In Scrapy, response.url is the final/effective URL
                'is_canonical' => $isCanonical,
                'http_status' => $httpStatus,
                'keywords' => $data['content']['keywords'] ?? [],
                'load_time' => $data['metrics']['load_time'] ?? 0,
                'schema_suggestions' => $data['schema_suggestions'] ?? [],
                'seo_audit' => $data['seo_audit'] ?? null,
                'ssl_info' => $data['ssl_info'] ?? null,
                'request_analysis' => $data['request_analysis'] ?? null,
                'extracted_json_ld' => $data['extracted_json_ld'] ?? null,
                'status' => 'completed',
                'parent_url' => $data['parent_url'] ?? null,
                'depth_from_root' => $data['depth'] ?? 0,
                'structure_level' => $data['depth'] ?? 0,
                'internal_links_out' => $internalLinksOut,
                'seo_bottlenecks' => $bottlenecks,
                'url_slug_quality' => $slugQuality,
            ]
        );

        // Update internal_links_in for the parent page
        if (!empty($data['parent_url'])) {
            SitemapLink::where('sitemap_id', $sitemapId)
                ->where('url', $data['parent_url'])
                ->increment('internal_links_in');
        }
    }
}
