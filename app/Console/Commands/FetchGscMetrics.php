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

    public function handle(GscService $gscService)
    {
        $properties = AnalyticsProperty::where('is_active', true)
            ->whereNotNull('gsc_site_url')
            ->get();

        $days = (int) $this->option('days');
        $this->info("Fetching GSC metrics for " . count($properties) . " properties...");

        foreach ($properties as $property) {
            $this->info("Processing property: {$property->name}");

            for ($i = $days; $i >= 1; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $this->line(" - Fetching for date: {$date}");

                try {
                    $performance = $gscService->fetchPerformance($property, $date, $date);
                    $breakdowns = $gscService->fetchBreakdowns($property, $date, $date);
                    
                    // Fetch sitemaps only for the most recent date to avoid redundant API calls
                    $sitemaps = ($i === 1) ? $gscService->fetchSitemaps($property) : null;

                    if ($performance && !empty($performance)) {
                        $daily = $performance[0];
                        
                        \App\Models\SearchConsoleMetric::updateOrCreate(
                            [
                                'analytics_property_id' => $property->id,
                                'snapshot_date' => $date,
                            ],
                            [
                                'clicks' => $daily['clicks'],
                                'impressions' => $daily['impressions'],
                                'ctr' => $daily['ctr'],
                                'position' => $daily['position'],
                                'top_queries' => $breakdowns['top_queries'] ?? [],
                                'top_pages' => $breakdowns['top_pages'] ?? [],
                                'sitemaps' => $sitemaps,
                            ]
                        );
                    }
                } catch (\Exception $e) {
                    $this->error("   ! Error for date {$date}: " . $e->getMessage());
                }
            }

            $this->info("Completed property: {$property->name}");
        }

        $this->info("GSC syncing completed.");
    }
}
