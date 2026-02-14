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
    public function handle(\App\Services\Ga4Service $ga4Service)
    {
        $properties = \App\Models\AnalyticsProperty::where('is_active', true)->get();

        if ($properties->isEmpty()) {
            $this->info('No active analytics properties found.');
            return;
        }

        $days = (int) $this->option('days');
        $endDate = now()->subDay()->format('Y-m-d');
        $startDate = now()->subDays($days)->format('Y-m-d');

        $this->info("Fetching metrics from {$startDate} to {$endDate}...");

        $startTime = microtime(true);

        foreach ($properties as $property) {
            $this->info("Processing property: {$property->name} ({$property->property_id})");
            
            try {
                $metrics = $ga4Service->fetchDailyMetrics($property, $startDate, $endDate);
                $breakdowns = $ga4Service->fetchBreakdowns($property, $startDate, $endDate);

                if ($metrics) {
                    $this->table(
                        ['Date', 'Users', 'Sessions', 'Engagement Rate', 'Conversions'],
                        collect($metrics)->take(5)->map(fn($m) => [
                            $m['date'],
                            $m['users'],
                            $m['sessions'],
                            number_format($m['engagement_rate'] * 100, 2) . '%',
                            $m['conversions'],
                        ])->toArray()
                    );

                    if (count($metrics) > 5) {
                        $this->info("... and " . (count($metrics) - 5) . " more days.");
                    }

                    foreach ($metrics as $dayData) {
                        $dataToSave = $dayData;

                        // If this is the latest date in the set, attach the breakdowns
                        if ($dayData['date'] === $endDate) {
                            $dataToSave = array_merge($dayData, $breakdowns);
                        }

                        \App\Models\MetricSnapshot::updateOrCreate([
                            'analytics_property_id' => $property->id,
                            'snapshot_date' => $dayData['date'],
                        ], $dataToSave);
                    }
                    $this->info("Successfully saved metrics and breakdowns for: {$property->name}");
                } else {
                    $this->error("Failed to fetch metrics for: {$property->name}");
                }
            } catch (\Exception $e) {
                $this->error("Error processing property {$property->name}: " . $e->getMessage());
                \Illuminate\Support\Facades\Log::error("GA4 Fetch Loop Error for {$property->name}: " . $e->getMessage());
            }
        }

        $executionTime = round(microtime(true) - $startTime, 2);
        $this->info("Metric fetching completed in {$executionTime}s.");
    }
}
