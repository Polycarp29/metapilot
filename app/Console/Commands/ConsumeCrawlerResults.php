<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use App\Jobs\ProcessCrawlerResultJob;
use App\Models\SitemapLink;
use App\Services\SitemapService;

class ConsumeCrawlerResults extends Command
{
    protected $signature = 'crawler:consume';

    protected $description = 'Consume crawl results from Redis and process them';

    public function handle(): void
    {
        $this->info("Listening for crawler results on 'crawler:results'...");

        while (true) {
            try {
                $result = Redis::blpop('crawler:results', 0);

                if ($result) {
                    $payload = json_decode($result[1], true);
                    
                    if ($payload) {
                        $event = $payload['event'] ?? 'result';
                        $url = $payload['url'] ?? 'unknown';

                        if ($event === 'discovered') {
                            $this->info("Discovered URL: {$url}");
                            
                            $sitemapId = $payload['sitemap_id'] ?? null;
                            $data = $payload['data'] ?? [];
                            $depth = $data['depth'] ?? 0;

                            if ($sitemapId && $url) {
                                $sitemapService = app(SitemapService::class);
                                $bottlenecks = $sitemapService->analyzeUrlStructure($url);
                                $slugQuality = $sitemapService->assessSlugQuality($url);

                                $link = SitemapLink::firstOrCreate(
                                    ['sitemap_id' => $sitemapId, 'url' => $url],
                                    [
                                        'status' => 'discovered',
                                        'parent_url' => $data['parent_url'] ?? null,
                                        'depth_from_root' => $depth,
                                        'structure_level' => $depth,
                                        'lastmod' => now()->format('Y-m-d'),
                                        'changefreq' => 'daily',
                                        'priority' => max(0.3, round(0.9 - ($depth * 0.1), 1)),
                                        'seo_bottlenecks' => $bottlenecks,
                                        'url_slug_quality' => $slugQuality,
                                    ]
                                );

                                if ($link->wasRecentlyCreated) {
                                    $this->warn("NEW Link Saved [ID: {$link->id}]: {$url}");
                                } else {
                                    $this->line("Link already exists: {$url}");
                                }
                            } else {
                                $this->error("Missing data for discovery: Sitemap: " . ($sitemapId ?? 'NULL') . ", URL: " . ($url ?? 'NULL'));
                            }
                        } else {
                            $this->info("Processing crawl result for URL: {$url}");
                            ProcessCrawlerResultJob::dispatch($payload);
                        }
                    }
                }
            } catch (\Predis\TimeoutException $e) {
                continue;
            } catch (\Exception $e) {
                $this->error("Error in consumer: " . $e->getMessage());
                sleep(2);
            }
        }
    }
}
