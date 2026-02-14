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
                DB::raw('COALESCE(SUM(new_users), 0) as total_new_users'),
                DB::raw('COALESCE(SUM(sessions), 0) as total_sessions'),
                DB::raw('COALESCE(SUM(conversions), 0) as total_conversions'),
                DB::raw('COALESCE(AVG(engagement_rate), 0) as avg_engagement_rate'),
                DB::raw('COALESCE(AVG(avg_session_duration), 0) as avg_duration'),
                DB::raw('COALESCE(AVG(bounce_rate), 0) as avg_bounce_rate'),
            ])
            ->first();

        if (!$latestRecord || $aggregates->total_users == 0) {
            return [
                'total_users' => 0,
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
                'by_source' => [],
                'by_medium' => [],
                'by_campaign' => [],
                'by_device' => [],
                'by_country' => [],
                'by_city' => [],
                'top_queries' => [],
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

        // 4. Get the latest Search Console breakdown (queries)
        $latestGscRecord = \App\Models\SearchConsoleMetric::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate, $endDate])
            ->orderBy('snapshot_date', 'desc')
            ->first();

        // Combine the aggregates with the latest breakdowns
        return [
            'total_users' => (int) $aggregates->total_users,
            'total_new_users' => (int) $aggregates->total_new_users,
            'total_sessions' => (int) $aggregates->total_sessions,
            'total_conversions' => (int) $aggregates->total_conversions,
            'total_clicks' => (int) ($gscAggregates?->total_clicks ?? 0),
            'total_impressions' => (int) ($gscAggregates?->total_impressions ?? 0),
            'avg_ctr' => (float) ($gscAggregates?->avg_ctr ?? 0),
            'avg_position' => (float) ($gscAggregates?->avg_position ?? 0),
            'avg_engagement_rate' => (float) $aggregates->avg_engagement_rate,
            'avg_duration' => (float) $aggregates->avg_duration,
            'avg_bounce_rate' => (float) $aggregates->avg_bounce_rate,
            'by_page' => $latestRecord->by_page,
            'by_source' => $latestRecord->by_source,
            'by_medium' => $latestRecord->by_medium,
            'by_campaign' => $latestRecord->by_campaign,
            'by_device' => $latestRecord->by_device,
            'by_country' => $latestRecord->by_country,
            'by_city' => $latestRecord->by_city,
            'top_queries' => $latestGscRecord?->top_queries ?? [],
        ];
    }

    /**
     * Get trend data for a specific metric.
     */
    public function getTrendData($propertyId, $startDate, $endDate)
    {
        return MetricSnapshot::where('metric_snapshots.analytics_property_id', $propertyId)
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
