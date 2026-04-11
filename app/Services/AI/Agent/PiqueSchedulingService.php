<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;
use App\Models\PiqueScheduledTask;
use App\Models\CrawlSchedule;
use App\Models\Sitemap;
use Carbon\Carbon;

class PiqueSchedulingService
{
    /**
     * Create or update a scheduled task for Pique.
     */
    public function scheduleTask(Organization $organization, array $params): array
    {
        $type = $params['type'] ?? 'analytics_alert';
        $freq = $params['frequency'] ?? 'weekly';
        $time = $params['run_at'] ?? '08:00';
        $day  = $params['day_of_week'] ?? 1; // Monday

        if ($type === 'crawl') {
            return $this->scheduleCrawl($organization, $params);
        }

        $task = PiqueScheduledTask::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'task_type' => $type,
            ],
            [
                'frequency' => $freq,
                'run_at' => $time,
                'day_of_week' => $day,
                'payload' => $params['payload'] ?? [],
                'is_active' => true,
            ]
        );

        $task->update(['next_run_at' => $task->computeNextRunAt()]);

        return [
            'status' => 'success',
            'task_id' => $task->id,
            'next_run' => $task->next_run_at->toDateTimeString(),
            'label' => "Scheduled {$type} ({$freq}) starting {$task->next_run_at->format('M j, H:i')}"
        ];
    }

    /**
     * Bridge to existing CrawlSchedule system.
     */
    protected function scheduleCrawl(Organization $organization, array $params): array
    {
        $sitemapId = $params['sitemap_id'] ?? null;
        if (!$sitemapId) {
            // Find first sitemap if not provided
            $sitemap = Sitemap::where('organization_id', $organization->id)->first();
            $sitemapId = $sitemap?->id;
        }

        if (!$sitemapId) {
            return ['status' => 'error', 'message' => 'No sitemap found to crawl. Create a sitemap first.'];
        }

        $schedule = CrawlSchedule::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'sitemap_id' => $sitemapId,
            ],
            [
                'frequency' => $params['frequency'] ?? 'weekly',
                'run_at' => $params['run_at'] ?? '02:00',
                'day_of_week' => $params['day_of_week'] ?? 1,
                'is_active' => true,
                'max_depth' => $params['max_depth'] ?? 3,
                'render_js' => $params['render_js'] ?? true,
            ]
        );

        $schedule->update(['next_run_at' => $schedule->computeNextRunAt()]);

        return [
            'status' => 'success',
            'schedule_id' => $schedule->id,
            'next_run' => $schedule->next_run_at->toDateTimeString(),
            'label' => "Crawl scheduled ({$schedule->frequency}) for sitemap #{$sitemapId}"
        ];
    }

    /**
     * Execute a due task (usually called by a Job).
     */
    public function executeTask(PiqueScheduledTask $task): bool
    {
        // This is where we wire up specific AI alerts or reports
        // Actual execution happens in ProcessScheduledPiqueTaskJob
        return true;
    }
}
