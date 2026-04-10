<?php

namespace App\Jobs;

use App\Models\AnalyticsProperty;
use App\Models\Organization;
use App\Services\AnalyticsAggregatorService;
use App\Services\ControlEngineService;
use App\Services\ForecastService;
use App\Services\InsightService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class GenerateSeoReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     */
    public $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Organization $organization,
        protected array $propertyIds,
        protected array $sections,
        protected string $startDate,
        protected string $endDate,
        protected string $jobId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(
        AnalyticsAggregatorService $aggregator,
        InsightService $insightService,
        ControlEngineService $controlEngine,
        ForecastService $forecastService
    ) {
        Cache::put("pique_report_{$this->jobId}_status", 'processing', 3600);
        Log::info("PiqueReportJob [{$this->jobId}]: Started processing.");

        try {
            $reportData = [];

            foreach ($this->propertyIds as $propId) {
                $property = AnalyticsProperty::where('id', $propId)
                    ->where('organization_id', $this->organization->id)
                    ->first();

                if (!$property) continue;

                $pData = [
                    'property'   => [
                        'id'          => $property->id,
                        'name'        => $property->name,
                        'website_url' => $property->website_url,
                        'property_id' => $property->property_id,
                    ],
                    'start_date' => $this->startDate,
                    'end_date'   => $this->endDate,
                    'sections'   => [],
                ];

                if (in_array('overview', $this->sections)) {
                    $pData['sections']['overview'] = $aggregator->getOverviewWithComparison($property->id, $this->startDate, $this->endDate);
                }

                if (in_array('traffic', $this->sections)) {
                    // Optimized: only send trend data if actually needed, limit to last 30 intervals
                    $trends = $aggregator->getTrendData($property->id, $this->startDate, $this->endDate);
                    $pData['sections']['traffic'] = is_array($trends) ? array_slice($trends, -30) : [];
                }

                if (in_array('acquisition', $this->sections)) {
                    try {
                        $ga4Service = app(\App\Services\Ga4Service::class);
                        $campaigns = $ga4Service->fetchCampaigns($property, $this->startDate, $this->endDate);
                        // Capped: only top 15 campaigns
                        $pData['sections']['acquisition'] = array_slice(array_values($campaigns), 0, 15);
                    } catch (\Exception $e) {
                        $pData['sections']['acquisition'] = [];
                    }
                }

                if (in_array('seo_intelligence', $this->sections)) {
                    $alerts = $controlEngine->getActiveAlerts($this->organization);
                    $pData['sections']['seo_intelligence'] = [
                        'alerts'           => collect($alerts)->take(20)->toArray(),
                        'critical_count'   => collect($alerts)->where('severity', 'critical')->count(),
                        'high_count'       => collect($alerts)->where('severity', 'high')->count(),
                        'opportunity_count'=> collect($alerts)->where('alert_type', 'trend_opportunity')->count(),
                    ];
                }

                if (in_array('insights', $this->sections)) {
                    $insight = $property->insights()
                        ->where('type', 'analytics_summary')
                        ->where('start_date', $this->startDate)
                        ->where('end_date', $this->endDate)
                        ->orderBy('insight_at', 'desc')
                        ->first();

                    if (!$insight) {
                        $insight = $insightService->generateDynamicInsight($property, $this->startDate, $this->endDate);
                    }
                    $pData['sections']['insights'] = $insight;
                }

                if (in_array('forecasts', $this->sections)) {
                    $forecasts = \App\Models\AnalyticalForecast::where('analytics_property_id', $property->id)
                        ->get()
                        ->pluck('forecast_data', 'forecast_type');

                    $pData['sections']['forecasts'] = [
                        'sessions'    => $forecasts->get('sessions', []),
                        'conversions' => $forecasts->get('conversions', []),
                        'strategy'    => $forecasts->get('strategic_strategy', []),
                    ];
                }

                $reportData[] = $pData;
            }

            Log::info("PiqueReportJob [{$this->jobId}]: Data aggregated. Rendering PDF.");

            // Render PDF
            $pdf = Pdf::loadView('pdf.seo-report', [
                'organization' => $this->organization,
                'reports'      => $reportData,
                'generated_at' => now()->format('F j, Y \a\t H:i'),
                'sections'     => $this->sections,
            ])->setPaper('a4', 'portrait')
              ->setOption('defaultFont', 'sans-serif')
              ->setOption('isHtml5ParserEnabled', true)
              ->setOption('isRemoteEnabled', false);

            $filename = "seo-report-{$this->jobId}.pdf";
            
            if (!Storage::disk('public')->exists('reports')) {
                Storage::disk('public')->makeDirectory('reports');
            }
            Storage::disk('public')->put("reports/{$filename}", $pdf->output());

            Log::info("PiqueReportJob [{$this->jobId}]: PDF generated and stored: {$filename}");

            $result = [
                'url'        => url("storage/reports/{$filename}"),
                'filename'   => $filename,
                'properties' => collect($reportData)->pluck('property.name')->join(', '),
                'date_range' => Carbon::parse($this->startDate)->format('M j') . ' – ' . Carbon::parse($this->endDate)->format('M j, Y'),
                'sections'   => count($this->sections),
            ];

            Cache::put("pique_report_{$this->jobId}_result", $result, 3600);
            Cache::put("pique_report_{$this->jobId}_status", 'completed', 3600);

            Log::info("PiqueReportJob [{$this->jobId}]: Status transitioned to COMPLETED.");

        } catch (\Exception $e) {
            Log::error("PiqueReportJob Error: " . $e->getMessage());
            Cache::put("pique_report_{$this->jobId}_status", 'failed', 3600);
            Cache::put("pique_report_{$this->jobId}_error", $e->getMessage(), 3600);
            throw $e;
        }
    }
}
