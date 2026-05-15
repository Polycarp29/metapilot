<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\PixelSite;
use App\Jobs\PrefetchCdnAnalyticsJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CdnPrefetch extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cdn:prefetch {--org= : Optional organization ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prefetch and cache CDN analytics for all active organizations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $orgId = $this->option('org');

        if ($orgId) {
            $organizations = Organization::where('id', $orgId)->get();
        } else {
            // Only prefetch for organizations that actually have verified CDN pixels
            $organizations = Organization::whereHas('pixelSites', function ($query) {
                $query->whereNotNull('pixel_verified_at');
            })->get();
        }

        $this->info("Found {$organizations->count()} organizations to prefetch.");

        foreach ($organizations as $org) {
            $this->info("Processing Org: {$org->id} ({$org->name})...");
            
            try {
                // 1. Prefetch aggregate for the whole organization
                $this->line("  -> Dispatching Organization Aggregate...");
                PrefetchCdnAnalyticsJob::dispatch($org->id);

                // 2. Prefetch for each specific site if they have multiple
                $sites = $org->pixelSites()->whereNotNull('pixel_verified_at')->get();
                if ($sites->count() > 1) {
                    $this->line("  -> Found {$sites->count()} sites. Dispatching individual site jobs...");
                    foreach ($sites as $site) {
                        $this->line("     - Site: {$site->id} ({$site->label})");
                        PrefetchCdnAnalyticsJob::dispatch($org->id, $site->id);
                    }
                }
                $this->info("  [DONE] Dispatch complete for {$org->name}");
            } catch (\Exception $e) {
                $this->error("  [ERROR] Failed to dispatch for {$org->name}: " . $e->getMessage());
            }
        }

        $this->info('--- All prefetch jobs dispatched ---');

    }
}
