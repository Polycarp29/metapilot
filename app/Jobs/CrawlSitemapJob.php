<?php

namespace App\Jobs;

use App\Models\Sitemap;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class CrawlSitemapJob implements ShouldQueue
{
    use Queueable;

    public $sitemap;
    public $startingUrl;
    public $options;

    /**
     * Create a new job instance.
     */
    public function __construct(Sitemap $sitemap, string $startingUrl = null, array $options = [])
    {
        $this->sitemap = $sitemap;
        $this->startingUrl = $startingUrl ?? $sitemap->name;
        $this->options = array_merge([
            'render_js' => true,
            'detect_schema' => true,
            'extract_keywords' => true,
            'max_depth' => 3
        ], $options);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $jobId = (string) Str::uuid();

        $payload = [
            'id' => $jobId,
            'sitemap_id' => $this->sitemap->id,
            'starting_url' => $this->startingUrl,
            'max_depth' => $this->options['max_depth'],
            'options' => $this->options
        ];

        Redis::rpush('crawler:jobs', json_encode($payload));
    }
}
