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

    protected $property;

    /**
     * Create a new job instance.
     */
    public function __construct(AnalyticsProperty $property)
    {
        $this->property = $property;
        $this->queue = 'gsc'; // Reuse the gsc queue for now
    }

    /**
     * Execute the job.
     */
    public function handle(PythonEngineService $engine): void
    {
        Log::info("Processing predictive analytics for property: {$this->property->id}");
        
        $mainSuccess = $engine->processProperty($this->property);
        $adSuccess = $engine->processAdPerformance($this->property);

        if ($mainSuccess || $adSuccess) {
            Log::info("Predictive analytics completed for property: {$this->property->id} (Ads: " . ($adSuccess ? 'Yes' : 'No') . ")");
        } else {
            Log::warning("Predictive analytics failed or skipped for property: {$this->property->id}");
        }
    }
}
