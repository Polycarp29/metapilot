<?php

namespace App\Jobs;

use App\Models\PiqueScheduledTask;
use App\Models\ControlEngineAlert;
use App\Services\AI\Agent\PixelIntelligenceService;
use App\Services\AnalyticsAggregatorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessScheduledPiqueTaskJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $task;

    public function __construct(PiqueScheduledTask $task)
    {
        $this->task = $task;
    }

    public function handle(
        PixelIntelligenceService $pixelIntel, 
        AnalyticsAggregatorService $aggregator
    ): void {
        Log::info("Processing Pique Scheduled Task #{$this->task->id} ({$this->task->task_type})");

        try {
            match ($this->task->task_type) {
                'analytics_alert' => $this->handleAnalyticsAlert($pixelIntel, $aggregator),
                'weekly_summary'  => $this->handleWeeklySummary($pixelIntel, $aggregator),
                default           => Log::warning("Unknown task type: {$this->task->task_type}"),
            };

            $this->task->update([
                'last_run_at' => now(),
                'last_run_status' => 'completed',
                'next_run_at' => $this->task->computeNextRunAt(),
            ]);
        } catch (\Exception $e) {
            Log::error("Pique Task #{$this->task->id} failed: " . $e->getMessage());
            $this->task->update([
                'last_run_at' => now(),
                'last_run_status' => 'failed',
                'next_run_at' => $this->task->computeNextRunAt(),
            ]);
        }
    }

    protected function handleAnalyticsAlert($pixelIntel, $aggregator)
    {
        $org = $this->task->organization;
        $payload = $this->task->payload ?? [];
        
        // Example logic: check bounce rate or hit drop
        $summary = $pixelIntel->getSummary($org, 1); // last 24h
        
        $threshold = $payload['bounce_threshold'] ?? 80;
        
        if ($summary['bounce_rate'] > $threshold) {
            ControlEngineAlert::create([
                'organization_id' => $org->id,
                'alert_type' => 'bounce_anomaly',
                'severity' => 'high',
                'title' => 'High Bounce Rate Alert',
                'description' => "Bounce rate reached {$summary['bounce_rate']}% in the last 24h.",
                'affected_metrics' => ['bounce_rate' => $summary['bounce_rate']],
                'recommendations' => ['Check landing page content', 'Verify mobile speed'],
                'context_data' => $summary,
            ]);
        }
    }

    protected function handleWeeklySummary($pixelIntel, $aggregator)
    {
        // Proactive summary generation...
    }
}
