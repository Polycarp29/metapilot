<?php

namespace App\Jobs;

use App\Models\SitemapLink;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessCrawlerResultJob implements ShouldQueue
{
    use Queueable;

    public $resultData;

    /**
     * Create a new job instance.
     */
    public function __construct(array $resultData)
    {
        $this->resultData = $resultData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $data = $this->resultData['data'];
        $url = $this->resultData['url'];
        $jobId = $this->resultData['job_id'];

        // Find the link by URL and potentially job_id if we want to be strict
        // For now, we update by URL within the sitemap context (handled by finding the link)
        $link = SitemapLink::where('url', $url)->first();

        if ($link) {
            $link->update([
                'title' => $data['title'],
                'description' => $data['meta']['description'],
                'h1' => $data['content']['h1'],
                'canonical' => $data['meta']['canonical'],
                'keywords' => $data['content']['keywords'],
                'load_time' => $data['metrics']['load_time'],
                'schema_suggestions' => $data['schema_suggestions'],
                'seo_audit' => $data['seo_audit'] ?? null,
                'ssl_info' => $data['ssl_info'] ?? null,
                'request_analysis' => $data['request_analysis'] ?? null,
                'extracted_json_ld' => $data['extracted_json_ld'] ?? null,
                'status' => 'completed',
            ]);
        }
    }
}
