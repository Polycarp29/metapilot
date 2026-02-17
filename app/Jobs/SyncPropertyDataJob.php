<?php

namespace App\Jobs;

use App\Models\AnalyticsProperty;
use App\Services\Ga4Service;
use App\Services\GscService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncPropertyDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The AnalyticsProperty instance.
     *
     * @var \App\Models\AnalyticsProperty
     */
    protected $property;

    /**
     * Create a new job instance.
     */
    public function __construct(AnalyticsProperty $property)
    {
        $this->property = $property;
    }

    /**
     * Execute the job.
     */
    public function handle(Ga4Service $ga4Service, GscService $gscService): void
    {
        Log::info("Starting background sync for property: {$this->property->name} ({$this->property->id})");

        $endDate = now()->subDay()->format('Y-m-d');
        $startDate = now()->subDays(30)->format('Y-m-d');

        try {
            // Sync GA4 Data
            Log::info("Syncing GA4 data for property: {$this->property->id}");
            $ga4Service->syncData($this->property, $startDate, $endDate);
            
            // Sync GSC Data
            Log::info("Syncing GSC data for property: {$this->property->id}");
            $gscService->syncData($this->property, $startDate, $endDate);

            Log::info("Background sync completed for property: {$this->property->id}");
        } catch (\Exception $e) {
            Log::error("Background sync failed for property: {$this->property->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
