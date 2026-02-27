<?php

namespace App\Jobs;

use App\Services\KeywordIntelligenceService;
use App\Services\PythonEngineService;
use App\Models\Industry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SystemDiscoveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     */
    public $timeout = 600;

    /**
     * Execute the job.
     */
    public function handle(PythonEngineService $engine, KeywordIntelligenceService $kiService): void
    {
        Log::info("Starting System-Wide Global Discovery Job");

        // 1. Get a list of industries/niches to scan
        $niches = Industry::pluck('name')->toArray();
        if (empty($niches)) {
            $niches = ['Tech', 'Health', 'Finance', 'Betting', 'E-commerce'];
        }

        // 2. Define Geos to scan
        $geos = ['KE', 'US', 'WW'];

        foreach ($geos as $geo) {
            try {
                Log::info("Fetching global trends for geo", ['geo' => $geo]);
                
                $response = $engine->getGlobalTrends($geo, $niches);
                
                if (!$response || !isset($response['trends'])) {
                    continue;
                }

                $count = 0;
                foreach ($response['trends'] as $trendData) {
                    try {
                        $kiService->upsertFromDiscovery([
                            'keyword' => $trendData['keyword'],
                            'current_interest' => 100, // Seed with high interest for system trends
                            'growth_rate' => 50,
                            'niche' => $trendData['origin_seed'] ?? 'Generic',
                            'country_code' => $geo,
                            'origin' => 'system_discovery'
                        ]);
                        $count++;
                    } catch (\Exception $e) {
                        Log::error("Failed to upsert system-discovered keyword", [
                            'keyword' => $trendData['keyword'] ?? 'unknown',
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                Log::info("System discovery completed for geo", [
                    'geo' => $geo,
                    'discovered_count' => $count
                ]);

            } catch (\Exception $e) {
                Log::error("System Discovery Job failed for geo", [
                    'geo' => $geo,
                    'error' => $e->getMessage()
                ]);
            }
        }

        Log::info("System-Wide Global Discovery Job Completed");
    }
}
