<?php

namespace App\Jobs;

use App\Models\Organization;
use App\Services\CampaignKeywordService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DiscoverTrendingKeywordsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(CampaignKeywordService $service): void
    {
        Log::info("Starting trending keywords discovery job");

        $count = 0;
        $errors = 0;

        Organization::chunk(10, function ($organizations) use ($service, &$count, &$errors) {
            foreach ($organizations as $organization) {
                try {
                    // Check if due for discovery
                    $frequency = $organization->keyword_discovery_frequency ?? 24;
                    $lastRun = $organization->last_keyword_discovery_at;

                    if ($lastRun && $lastRun->addHours($frequency)->isFuture()) {
                        continue; // Skip if not due yet
                    }

                    $keywords = $service->discoverTrendingKeywords($organization);
                    
                    // Update last run timestamp
                    $organization->update(['last_keyword_discovery_at' => now()]);
                    
                    $count++;
                    
                    Log::info("Discovered keywords for organization", [
                        'organization_id' => $organization->id,
                        'keywords_count' => count($keywords)
                    ]);
                } catch (\Exception $e) {
                    $errors++;
                    Log::error("Failed to discover keywords for organization", [
                        'organization_id' => $organization->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        });

        Log::info("Trending keywords discovery job completed", [
            'organizations_processed' => $count,
            'errors' => $errors
        ]);
    }
}
