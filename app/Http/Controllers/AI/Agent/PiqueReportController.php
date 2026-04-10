<?php

namespace App\Http\Controllers\AI\Agent;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsProperty;
use App\Services\AnalyticsAggregatorService;
use App\Services\InsightService;
use App\Services\ControlEngineService;
use App\Services\ForecastService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PiqueReportController extends Controller
{
    public function __construct(
        protected AnalyticsAggregatorService $aggregator,
        protected InsightService $insightService,
        protected ControlEngineService $controlEngine,
        protected ForecastService $forecastService,
    ) {}

    /**
     * List active GA4 properties for the current org.
     */
    public function listProperties()
    {
        $org = auth()->user()->currentOrganization();
        if (!$org) return response()->json([]);

        $props = AnalyticsProperty::where('organization_id', $org->id)
            ->where('is_active', true)
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'property_id' => $p->property_id,
                'website_url' => $p->website_url,
            ]);

        return response()->json($props);
    }

    /**
     * Dispatch background generation of a professional PDF SEO report.
     */
    public function generate(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        if (!$org) return response()->json(['error' => 'No organization selected.'], 400);

        $validated = $request->validate([
            'property_ids'  => 'required|array|min:1',
            'property_ids.*'=> 'integer|exists:analytics_properties,id',
            'days'          => 'nullable|integer|in:7,30,90',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date',
            'sections'      => 'required|array|min:1',
        ]);

        // Resolve date range
        if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
            $startDate = \Carbon\Carbon::parse($validated['start_date'])->format('Y-m-d');
            $endDate   = \Carbon\Carbon::parse($validated['end_date'])->format('Y-m-d');
        } else {
            $days      = $validated['days'] ?? 30;
            $endDate   = now()->yesterday()->format('Y-m-d');
            $startDate = now()->subDays($days)->format('Y-m-d');
        }

        $jobId = Str::uuid()->toString();
        
        // Dispatch to background queue
        \App\Jobs\GenerateSeoReportJob::dispatch(
            $org, 
            $validated['property_ids'], 
            $validated['sections'], 
            $startDate, 
            $endDate, 
            $jobId
        );

        \Illuminate\Support\Facades\Cache::put("pique_report_{$jobId}_status", 'pending', 3600);

        return response()->json([
            'job_id' => $jobId,
            'status' => 'pending'
        ]);
    }

    /**
     * Check progress of report generation.
     */
    public function checkStatus($jobId)
    {
        $status = \Illuminate\Support\Facades\Cache::get("pique_report_{$jobId}_status", 'not_found');
        $result = \Illuminate\Support\Facades\Cache::get("pique_report_{$jobId}_result");
        $error  = \Illuminate\Support\Facades\Cache::get("pique_report_{$jobId}_error");

        return response()->json([
            'status' => $status,
            'data'   => $result,
            'error'  => $error
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
          ->header('Pragma', 'no-cache');
    }
}
