<?php

namespace App\Services;

use App\Models\MetricSnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsAggregatorService
{
    /**
     * Get overview stats for a property and date range.
     */
    protected $ga4Service;
    protected $gscService;

    public function __construct(\App\Services\Ga4Service $ga4Service, \App\Services\GscService $gscService)
    {
        $this->ga4Service = $ga4Service;
        $this->gscService = $gscService;
    }

    /**
     * Get overview stats for a property and date range.
     */
    public function getOverview($propertyId, $startDate, $endDate)
    {
        // 1. Get the latest record in the range to pull the JSON breakdowns
        $latestRecord = MetricSnapshot::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate, $endDate])
            ->orderBy('snapshot_date', 'desc')
            ->first();

        // 2. Get the aggregated totals/averages for the entire range
        $aggregates = MetricSnapshot::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate, $endDate])
            ->select([
                DB::raw('COALESCE(SUM(users), 0) as total_users'),
                DB::raw('COALESCE(SUM(total_users), 0) as total_users_all'),
                DB::raw('COALESCE(SUM(new_users), 0) as total_new_users'),
                DB::raw('COALESCE(SUM(sessions), 0) as total_sessions'),
                DB::raw('COALESCE(SUM(conversions), 0) as total_conversions'),
                DB::raw('COALESCE(AVG(engagement_rate), 0) as avg_engagement_rate'),
                DB::raw('COALESCE(AVG(avg_session_duration), 0) as avg_duration'),
                DB::raw('COALESCE(AVG(bounce_rate), 0) as avg_bounce_rate'),
            ])
            ->first();

        // 3. Try to fetch live aggregates for better accuracy (especially for user counts)
        $property = \App\Models\AnalyticsProperty::find($propertyId);
        $liveAggregates = null;
        
        try {
            // Only fetch live if within reasonable range (e.g. last 90 days) to avoid timeouts
            // offering a 10s timeout to backend processing
            $liveAggregates = $this->ga4Service->fetchAggregateMetrics($property, $startDate, $endDate);
        } catch (\Exception $e) {
            // Fallback to DB aggregates
            \Illuminate\Support\Facades\Log::warning("Live aggregate fetch failed for property {$propertyId}: " . $e->getMessage());
        }

        // Merge live data with DB data (prefer live for counts, DB for averages if improved)
        $finalStats = [
            'total_users' => $liveAggregates['active_users'] ?? (int) $aggregates->total_users, // Active Users is the standard "Users" metric
            'total_users_all' => $liveAggregates['total_users'] ?? (int) $aggregates->total_users_all,
            'total_new_users' => $liveAggregates['new_users'] ?? (int) $aggregates->total_new_users,
            'total_sessions' => $liveAggregates['sessions'] ?? (int) $aggregates->total_sessions,
            'total_conversions' => $liveAggregates['conversions'] ?? (int) $aggregates->total_conversions,
            'avg_engagement_rate' => $liveAggregates ? $liveAggregates['engagement_rate'] : (float) $aggregates->avg_engagement_rate,
            'avg_duration' => $liveAggregates ? $liveAggregates['avg_session_duration'] : (float) $aggregates->avg_duration,
            'avg_bounce_rate' => $liveAggregates ? $liveAggregates['bounce_rate'] : (float) $aggregates->avg_bounce_rate,
        ];

        if (!$latestRecord && !$liveAggregates) {
            return [
                'total_users' => 0,
                'total_users_all' => 0,
                'total_new_users' => 0,
                'total_sessions' => 0,
                'total_conversions' => 0,
                'total_clicks' => 0,
                'total_impressions' => 0,
                'avg_ctr' => 0,
                'avg_position' => 0,
                'avg_engagement_rate' => 0,
                'avg_duration' => 0,
                'avg_bounce_rate' => 0,
                'by_page' => [],
                'by_page_title' => [],
                'by_screen' => [],
                'by_source' => [],
                'by_medium' => [],
                'by_campaign' => [],
                'by_device' => [],
                'by_country' => [],
                'by_city' => [],
                'by_event' => [],
                'by_audience' => [],
                'top_queries' => [],
                'top_pages_gsc' => [],
                'sitemaps' => [],
                'gsc_permission_error' => (bool) ($property?->gsc_permission_error ?? false),
                'google_token_invalid' => (bool) ($property?->google_token_invalid ?? false),
                'gsc_permission_error_info' => $property?->gsc_permission_error,
                'last_updated' => null,
            ];
        }

        // 3. Get the Search Console aggregated totals for the same range
        $gscAggregates = \App\Models\SearchConsoleMetric::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate, $endDate])
            ->select([
                DB::raw('COALESCE(SUM(clicks), 0) as total_clicks'),
                DB::raw('COALESCE(SUM(impressions), 0) as total_impressions'),
                DB::raw('COALESCE(AVG(ctr), 0) as avg_ctr'),
                DB::raw('COALESCE(AVG(position), 0) as avg_position'),
            ])
            ->first();

        // 3.5 Try to fetch live GSC aggregates if DB is empty
        $liveGscAggregates = null;
        if ((int) $gscAggregates->total_impressions === 0 && (int) $gscAggregates->total_clicks === 0) {
            try {
                $liveGscAggregates = $this->gscService->fetchAggregatePerformance($property, $startDate, $endDate);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Live GSC aggregate fetch failed for property {$propertyId}: " . $e->getMessage());
            }
        }

        // 4. Get all Search Console records for the range to aggregate breakdowns
        $gscRecords = \App\Models\SearchConsoleMetric::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate, $endDate])
            ->orderBy('snapshot_date', 'desc')
            ->get();

        $latestGscRecord = $gscRecords->first();
        
        $aggregatedQueries = [];
        $aggregatedPages = [];
        
        if ($gscRecords->isNotEmpty()) {
            foreach ($gscRecords as $record) {
                // Aggregate Queries
                foreach ($record->top_queries ?? [] as $q) {
                    $key = $q['name'] ?? ($q['query'] ?? 'unknown');
                    if (!isset($aggregatedQueries[$key])) {
                        $aggregatedQueries[$key] = ['name' => $key, 'clicks' => 0, 'impressions' => 0, 'position' => 0, 'count' => 0];
                    }
                    $aggregatedQueries[$key]['clicks'] += $q['clicks'] ?? 0;
                    $aggregatedQueries[$key]['impressions'] += $q['impressions'] ?? 0;
                    $aggregatedQueries[$key]['position'] += $q['position'] ?? 0;
                    $aggregatedQueries[$key]['count']++;
                }
                
                // Aggregate Pages
                foreach ($record->top_pages ?? [] as $p) {
                    $key = $p['name'] ?? ($p['page'] ?? 'unknown');
                    if (!isset($aggregatedPages[$key])) {
                        $aggregatedPages[$key] = ['name' => $key, 'clicks' => 0, 'impressions' => 0, 'position' => 0, 'count' => 0];
                    }
                    $aggregatedPages[$key]['clicks'] += $p['clicks'] ?? 0;
                    $aggregatedPages[$key]['impressions'] += $p['impressions'] ?? 0;
                    $aggregatedPages[$key]['position'] += $p['position'] ?? 0;
                    $aggregatedPages[$key]['count']++;
                }
            }
            
            // Finalize averages and sort Queries
            foreach ($aggregatedQueries as &$q) {
                $q['position'] = $q['position'] / $q['count'];
                $q['ctr'] = $q['impressions'] > 0 ? $q['clicks'] / $q['impressions'] : 0;
                unset($q['count']);
            }
            usort($aggregatedQueries, fn($a, $b) => $b['clicks'] <=> $a['clicks']);
            
            // Finalize averages and sort Pages
            foreach ($aggregatedPages as &$p) {
                $p['position'] = $p['position'] / $p['count'];
                unset($p['count']);
            }
            usort($aggregatedPages, fn($a, $b) => $b['clicks'] <=> $a['clicks']);
        }

        $latestGscBreakdowns = null;
        if ($gscRecords->isEmpty()) {
            try {
                $latestGscBreakdowns = $this->gscService->fetchBreakdowns($property, $startDate, $endDate);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Live GSC breakdown fetch failed for property {$propertyId}: " . $e->getMessage());
            }
        }

        // Check if there's a permission issue (has GSC URL but no data) - Trigger even if core GA4 traffic is 0
        $hasGscPermissionError = (bool) ($property?->gsc_permission_error ?? false);
        $hasGoogleTokenInvalid = (bool) ($property?->google_token_invalid ?? false);

        // 4. Final aggregation of breakdown data (fetch live if DB is empty)
        $breakdowns = [];
        if ($latestRecord) {
            $breakdowns = [
                'by_page' => $latestRecord->by_page ?? [],
                'by_page_title' => $latestRecord->by_page_title ?? [],
                'by_screen' => $latestRecord->by_screen ?? [],
                'by_source' => $latestRecord->by_source ?? [],
                'by_first_source' => $latestRecord->by_first_source ?? [],
                'by_medium' => $latestRecord->by_medium ?? [],
                'by_campaign' => $latestRecord->by_campaign ?? [],
                'by_device' => $latestRecord->by_device ?? [],
                'by_country' => $latestRecord->by_country ?? [],
                'by_city' => $latestRecord->by_city ?? [],
                'by_event' => $latestRecord->by_event ?? [],
                'by_audience' => $latestRecord->by_audience ?? [],
            ];
        } else {
            // Fetch live breakdowns directly from API as a fallback
            try {
                $breakdowns = $this->ga4Service->fetchBreakdowns($property, $startDate, $endDate) ?? [];
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Live breakdown fetch failed for property {$propertyId}: " . $e->getMessage());
                $breakdowns = [];
            }
            
            // Ensure all keys exist to avoid frontend errors
            reset($breakdowns);
            $breakdowns = array_merge([
                'by_page' => [], 'by_page_title' => [], 'by_screen' => [], 'by_source' => [], 
                'by_first_source' => [], 'by_medium' => [], 'by_campaign' => [], 'by_device' => [], 
                'by_country' => [], 'by_city' => [], 'by_event' => [], 'by_audience' => [],
            ], $breakdowns);
        }

        // Combine the aggregates with the latest breakdowns
        return array_merge($finalStats, $breakdowns, [
            'total_clicks' => (int) ($liveGscAggregates['clicks'] ?? $gscAggregates->total_clicks),
            'total_impressions' => (int) ($liveGscAggregates['impressions'] ?? $gscAggregates->total_impressions),
            'avg_ctr' => (float) ($liveGscAggregates['ctr'] ?? $gscAggregates->avg_ctr),
            'avg_position' => (float) ($liveGscAggregates['position'] ?? $gscAggregates->avg_position),
            'top_queries' => $latestGscBreakdowns['top_queries'] ?? ($aggregatedQueries ?: []),
            'top_pages_gsc' => $latestGscBreakdowns['top_pages'] ?? ($aggregatedPages ?: []),
            'sitemaps' => $latestGscRecord?->sitemaps ?? [],
            'gsc_permission_error' => $hasGscPermissionError,
            'google_token_invalid' => $hasGoogleTokenInvalid,
            'last_updated' => collect([
                $latestRecord?->updated_at?->toIso8601String(),
                $latestGscRecord?->updated_at?->toIso8601String()
            ])->filter()->max(),
        ]);
    }

    /**
     * Get trend data for a specific metric.
     */
    public function getTrendData($propertyId, $startDate, $endDate)
    {
        $trends = MetricSnapshot::where('metric_snapshots.analytics_property_id', $propertyId)
            ->whereBetween('metric_snapshots.snapshot_date', [$startDate, $endDate])
            ->leftJoin('search_console_metrics', function($join) {
                $join->on('metric_snapshots.analytics_property_id', '=', 'search_console_metrics.analytics_property_id')
                     ->on('metric_snapshots.snapshot_date', '=', 'search_console_metrics.snapshot_date');
            })
            ->select([
                'metric_snapshots.snapshot_date',
                'metric_snapshots.users',
                'metric_snapshots.sessions',
                'metric_snapshots.conversions',
                DB::raw('COALESCE(search_console_metrics.clicks, 0) as clicks'),
                DB::raw('COALESCE(search_console_metrics.impressions, 0) as impressions'),
            ])
            ->orderBy('metric_snapshots.snapshot_date', 'asc')
            ->get();

        if ($trends->isEmpty()) {
            $property = \App\Models\AnalyticsProperty::find($propertyId);
            if ($property) {
                try {
                    $liveDaily = $this->ga4Service->fetchDailyMetrics($property, $startDate, $endDate);
                    if ($liveDaily) {
                        return collect($liveDaily)->map(fn($day) => (object) [
                            'snapshot_date' => $day['date'],
                            'users' => $day['users'],
                            'sessions' => $day['sessions'],
                            'conversions' => $day['conversions'],
                            'clicks' => 0,
                            'impressions' => 0,
                        ]);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning("Live trend fetch failed for property {$propertyId}: " . $e->getMessage());
                }
            }
        }

        return $trends;
    }

    /**
     * Calculate delta (percentage change) between two periods.
     */
    public function calculateDelta($currentValue, $previousValue)
    {
        if ($previousValue == 0) {
            return $currentValue > 0 ? 100 : 0;
        }

        return (($currentValue - $previousValue) / $previousValue) * 100;
    }
}
