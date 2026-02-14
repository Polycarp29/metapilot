<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateWeeklyReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:weekly-report';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate AI reports and insights for all analytics properties';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\InsightService $insightService)
    {
        $this->info('Generating weekly reports...');
        
        $properties = \App\Models\AnalyticsProperty::where('is_active', true)->get();

        if ($properties->isEmpty()) {
            $this->info('No active analytics properties found.');
            return;
        }

        $bar = $this->output->createProgressBar($properties->count());
        $bar->start();

        foreach ($properties as $property) {
            $this->info("\nProcessing property: {$property->name}");
            
            try {
                $result = $insightService->generateWeeklySummary($property);
                
                if ($result instanceof \App\Models\Insight) {
                    $this->info("Successfully generated insight for: {$property->name}");
                } else {
                    $this->warn("Insight generation for {$property->name}: " . (is_string($result) ? $result : 'Unknown result type'));
                }
            } catch (\Exception $e) {
                $this->error("Error generating report for {$property->name}: " . $e->getMessage());
                \Illuminate\Support\Facades\Log::error("Weekly Report Generation Loop Error for {$property->name}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->info("\nWeekly reports generation completed.");
    }
}
