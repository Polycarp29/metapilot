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
        return MetricSnapshot::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate, $endDate])
            ->select([
                DB::raw('SUM(users) as total_users'),
                DB::raw('SUM(sessions) as total_sessions'),
                DB::raw('SUM(conversions) as total_conversions'),
                DB::raw('AVG(engagement_rate) as avg_engagement_rate'),
                DB::raw('AVG(avg_session_duration) as avg_duration'),
            ])
            ->first();
    }

    /**
     * Get trend data for a specific metric.
     */
    public function getTrendData($propertyId, $metric, $days = 30)
    {
        $endDate = now()->yesterday();
        $startDate = now()->subDays($days);

        return MetricSnapshot::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->orderBy('snapshot_date')
            ->get(['snapshot_date', $metric]);
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
