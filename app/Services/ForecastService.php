<?php

namespace App\Services;

use App\Models\MetricSnapshot;
use App\Models\SearchConsoleMetric;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class ForecastService
{
    /**
     * Forecast metrics for the next X days based on historical data.
     * 
     * @param int $propertyId
     * @param int $lookbackDays How many days of history to analyze
     * @param int $forecastDays How many days into the future to project
     * @return array
     */
    public function forecast(int $propertyId, int $lookbackDays = 30, int $forecastDays = 14): array
    {
        $endDate = now()->yesterday()->format('Y-m-d');
        $startDate = now()->subDays($lookbackDays)->format('Y-m-d');

        // Fetch historical data
        $history = MetricSnapshot::where('analytics_property_id', $propertyId)
            ->whereBetween('snapshot_date', [$startDate, $endDate])
            ->leftJoin('search_console_metrics', function ($join) {
                $join->on('metric_snapshots.analytics_property_id', '=', 'search_console_metrics.analytics_property_id')
                    ->on('metric_snapshots.snapshot_date', '=', 'search_console_metrics.snapshot_date');
            })
            ->select([
                'metric_snapshots.snapshot_date',
                'metric_snapshots.users',
                'metric_snapshots.sessions',
                'metric_snapshots.conversions',
                \DB::raw('COALESCE(search_console_metrics.clicks, 0) as clicks'),
                \DB::raw('COALESCE(search_console_metrics.impressions, 0) as impressions'),
            ])
            ->orderBy('metric_snapshots.snapshot_date', 'asc')
            ->get();

        if ($history->count() < 7) {
            return []; // Not enough data for a reliable forecast
        }

        return [
            'users' => $this->projectMetric($history, 'users', $forecastDays),
            'sessions' => $this->projectMetric($history, 'sessions', $forecastDays),
            'clicks' => $this->projectMetric($history, 'clicks', $forecastDays),
            'impressions' => $this->projectMetric($history, 'impressions', $forecastDays),
            'metadata' => [
                'lookback_days' => $lookbackDays,
                'forecast_days' => $forecastDays,
                'confidence_score' => $this->calculateConfidence($history),
            ]
        ];
    }

    /**
     * Project a single metric using simple linear regression.
     */
    private function projectMetric(Collection $history, string $metric, int $forecastDays): array
    {
        $data = $history->pluck($metric)->toArray();
        $n = count($data);
        
        // Prepare X (time) and Y (metric value)
        $x = range(0, $n - 1);
        $y = $data;

        // Calculate Linear Regression: Y = a + bX
        $sumX = array_sum($x);
        $sumY = array_sum($y);
        $sumXY = 0;
        $sumXX = 0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += ($x[$i] * $y[$i]);
            $sumXX += ($x[$i] * $x[$i]);
        }

        $denominator = ($n * $sumXX - $sumX * $sumX);
        if ($denominator == 0) return [];

        $slope = ($n * $sumXY - $sumX * $sumY) / $denominator;
        $intercept = ($sumY - $slope * $sumX) / $n;

        // Generate projections
        $projections = [];
        $lastDate = Carbon::parse($history->last()->snapshot_date);

        for ($j = 1; $j <= $forecastDays; $j++) {
            $futureX = $n - 1 + $j;
            $predictedValue = $intercept + $slope * $futureX;
            
            $projections[] = [
                'date' => $lastDate->copy()->addDays($j)->format('Y-m-d'),
                'value' => max(0, round($predictedValue, 2)),
                'is_projection' => true
            ];
        }

        return $projections;
    }

    /**
     * Calculate a simple confidence score based on data volatility.
     */
    private function calculateConfidence(Collection $history): float
    {
        if ($history->count() < 14) return 0.5; // Lower confidence for small datasets
        
        // Simplified: use standard deviation of growth rates
        return 0.85; // Placeholder for now - stable growth gets higher score
    }
}
