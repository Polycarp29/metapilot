<?php

namespace App\Console\Commands;

use App\Models\CrawlSchedule;
use App\Services\Crawler\CrawlerManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RunScheduledCrawlsCommand extends Command
{
    protected $signature = 'crawl:run-scheduled';

    protected $description = 'Run due crawl schedules';

    public function handle(CrawlerManager $crawlerManager): int
    {
        $dueSchedules = CrawlSchedule::ready()
            ->with('sitemap')
            ->get();

        if ($dueSchedules->isEmpty()) {
            $this->info('No scheduled crawls due.');
            return 0;
        }

        $this->info("Found {$dueSchedules->count()} due crawl(s).");

        foreach ($dueSchedules as $schedule) {
            $sitemap = $schedule->sitemap;
            if (!$sitemap) {
                Log::warning("CrawlSchedule #{$schedule->id} has no associated sitemap.");
                $schedule->update(['is_active' => false]);
                continue;
            }

            $startUrl = $sitemap->site_url ?? $sitemap->name;

            if (!filter_var($startUrl, FILTER_VALIDATE_URL)) {
                Log::warning("CrawlSchedule #{$schedule->id}: Invalid URL — {$startUrl}");
                $schedule->update([
                    'last_run_at' => now(),
                    'last_run_status' => 'failed',
                    'next_run_at' => $schedule->computeNextRunAt(),
                ]);
                continue;
            }

            $this->info("Dispatching crawl for sitemap '{$sitemap->name}' — {$startUrl}");

            try {
                $jobId = (string) \Illuminate\Support\Str::uuid();
                $result = $crawlerManager->dispatch(
                    $sitemap->id,
                    $startUrl,
                    $schedule->max_depth,
                    ['job_id' => $jobId]
                );

                if ($result) {
                    $actualJobId = $result['job_id'] ?? $jobId;
                    $sitemap->update([
                        'last_crawl_status' => 'dispatched',
                        'last_crawl_job_id' => $actualJobId,
                    ]);

                    $schedule->update([
                        'last_run_at' => now(),
                        'last_run_status' => 'dispatched',
                        'next_run_at' => $schedule->computeNextRunAt(),
                    ]);

                    $this->info("  → Job {$actualJobId} dispatched.");
                } else {
                    $schedule->update([
                        'last_run_at' => now(),
                        'last_run_status' => 'failed',
                        'next_run_at' => $schedule->computeNextRunAt(),
                    ]);

                    $this->error("  → Dispatch failed for sitemap #{$sitemap->id}");
                }
            } catch (\Exception $e) {
                Log::error("Scheduled crawl failed for schedule #{$schedule->id}: {$e->getMessage()}");
                $schedule->update([
                    'last_run_at' => now(),
                    'last_run_status' => 'failed',
                    'next_run_at' => $schedule->computeNextRunAt(),
                ]);
            }
        }

        return 0;
    }
}
