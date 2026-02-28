<?php

namespace App\Jobs;

use App\Models\AnalyticsProperty;
use App\Services\PythonEngineService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAnalyticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300;

    /**
     * Execute the job.
     */
    public function handle(PythonEngineService $service): void
    {
        Log::info("Starting automated analytics processing job");

        $processed = 0;
        $skipped = 0;
        $errors = 0;

        AnalyticsProperty::where('is_active', true)->chunk(10, function ($properties) use ($service, &$processed, &$skipped, &$errors) {
            foreach ($properties as $property) {
                try {
                    $organization = $property->organization;
                    if (!$organization) {
                        Log::warning("Skipping property {$property->id} - no organization found");
                        $skipped++;
                        continue;
                    }

                    $frequency = $organization->keyword_discovery_frequency ?? 24;
                    $lastSync = $property->last_sync_at;

                    if ($lastSync && $lastSync->addHours($frequency)->isFuture()) {
                        $skipped++;
                        continue; // Not due yet
                    }

                    Log::info("Dispatching strategic analysis for property: {$property->name}", [
                        'property_id' => $property->id,
                        'org_id' => $organization->id
                    ]);

                    // Process property (this will dispatch to Redis/Worker if data is large)
                    $success = $service->processProperty($property, 30);
                    
                    if ($success) {
                        $property->update(['last_sync_at' => now()]);
                        $processed++;
                    } else {
                        $errors++;
                    }

                } catch (\Exception $e) {
                    $errors++;
                    Log::error("Failed to process property {$property->id}: " . $e->getMessage());
                }
            }
        });

        Log::info("Automated analytics processing job completed", [
            'properties_processed' => $processed,
            'skipped' => $skipped,
            'errors' => $errors
        ]);
    }
}
