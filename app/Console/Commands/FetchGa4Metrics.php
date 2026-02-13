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
    protected $signature = 'analytics:fetch-metrics';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch metrics from GA4 for all active properties';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\Ga4Service $ga4Service)
    {
        $properties = \App\Models\AnalyticsProperty::where('is_active', true)->get();

        if ($properties->isEmpty()) {
            $this->info('No active analytics properties found.');
            return;
        }

        $yesterday = now()->subDay()->format('Y-m-d');

        foreach ($properties as $property) {
            $this->info("Fetching metrics for property: {$property->name} ({$property->property_id})");
            
            $metrics = $ga4Service->fetchDailyMetrics($property->property_id, $yesterday, $yesterday);

            if ($metrics) {
                foreach ($metrics as $dayData) {
                    \App\Models\MetricSnapshot::updateOrCreate([
                        'analytics_property_id' => $property->id,
                        'snapshot_date' => $dayData['date'],
                    ], $dayData);
                }
                $this->info("Successfully fetched metrics for property: {$property->name}");
            } else {
                $this->error("Failed to fetch metrics for property: {$property->name}");
            }
        }

        $this->info('Metric fetching completed.');
    }
}
