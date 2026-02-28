<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AnalyticsProperty;
use App\Services\GscService;

class FetchGscMetrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:fetch-gsc {--days=1 : Number of days to fetch}';
    protected $description = 'Fetch and save search console metrics for properties';

    public function handle()
    {
        $properties = AnalyticsProperty::where('is_active', true)
            ->whereNotNull('gsc_site_url')
            ->get();

        $days = (int) $this->option('days');
        $this->info("Dispatching GSC sync jobs for " . count($properties) . " properties (Range: {$days} days)...");

        foreach ($properties as $property) {
            $this->info(" - Dispatching for property: {$property->name}");
            \App\Jobs\SyncPropertyDataJob::dispatch($property, $days);
        }

        $this->info("GSC sync jobs dispatched successfully.");
    }
}
