<?php

namespace App\Jobs;

use App\Models\Organization;
use App\Services\GoogleAdsReportService;
use App\Services\PythonEngineService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncAdCampaignsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The Organization instance.
     *
     * @var \App\Models\Organization
     */
    protected $organization;

    /**
     * The date range for syncing.
     *
     * @var string
     */
    protected $dateRange;

    /**
     * Create a new job instance.
     */
    public function __construct(Organization $organization, string $dateRange = 'LAST_30_DAYS')
    {
        $this->organization = $organization;
        $this->dateRange = $dateRange;
    }

    /**
     * Execute the job.
     */
    public function handle(GoogleAdsReportService $adsService, PythonEngineService $pythonService): void
    {
        if (!$this->organization->ads_customer_id) {
            Log::warning("Skipping Ads sync for organization {$this->organization->id}: No Customer ID.");
            return;
        }

        $property = $this->organization->analyticsProperties()->first();
        if (!$property) {
            Log::warning("Skipping Ads sync for organization {$this->organization->id}: No analytics property found.");
            return;
        }

        Log::info("Starting Google Ads sync for organization: {$this->organization->name} ({$this->organization->id})");

        try {
            // 1. Fetch from Google Ads API
            $campaigns = $adsService->fetchCampaigns($property, $this->organization->ads_customer_id, $this->dateRange);
            
            if (empty($campaigns)) {
                Log::warning("No campaigns found for organization {$this->organization->id}");
            } else {
                // 2. Sync to Database
                $adsService->syncToDb($this->organization, $campaigns, $this->dateRange);
                Log::info("Synced " . count($campaigns) . " campaigns to DB for org {$this->organization->id}");
            }

            // 3. Trigger Python Engine / Prophet Processing
            Log::info("Dispatching Prophet analysis for org {$this->organization->id}");
            $pythonService->processAdPerformance($property);

            Log::info("Google Ads sync completed for organization: {$this->organization->id}");
        } catch (\Exception $e) {
            Log::error("Google Ads sync failed for organization: {$this->organization->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
