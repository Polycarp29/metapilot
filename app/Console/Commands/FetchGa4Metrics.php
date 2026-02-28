<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class FetchGa4Metrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:fetch-metrics {--days=1 : Number of days to fetch}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch metrics from GA4 for all active properties';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $properties = \App\Models\AnalyticsProperty::where('is_active', true)->get();

        if ($properties->isEmpty()) {
            $this->info('No active analytics properties found.');
            return;
        }

        $days = (int) $this->option('days');
        $this->info("Dispatching GA4 sync jobs for " . count($properties) . " properties (Range: {$days} days)...");

        foreach ($properties as $property) {
            $this->info(" - Dispatching for property: {$property->name}");
            \App\Jobs\SyncPropertyDataJob::dispatch($property, $days);
        }

        $this->info("GA4 sync jobs dispatched successfully.");
    }
}
