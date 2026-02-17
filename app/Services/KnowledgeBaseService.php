<?php

namespace App\Services;

use App\Models\TrendPattern;
use App\Models\Organization;
use App\Models\MetricSnapshot;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class KnowledgeBaseService
{
    /**
     * Learn a pattern from historical data and store it.
     */
    public function learnPattern(
        string $type,
        Collection $snapshots,
        Organization $organization,
        ?string $niche = null
    ): TrendPattern {
        $data = $this->extractFeatures($snapshots, $type);
        $pattern = $this->analyzePattern($data);
        
        return TrendPattern::create([
            'organization_id' => $organization->id,
            'pattern_type' => $type,
            'niche' => $niche,
            'pattern_data' => $pattern,
            'triggers' => $this->extractTriggers($pattern),
            'confidence_score' => $this->calculateInitialConfidence($data),
            'occurrence_count' => 1,
        ]);
    }

    /**
     * Match current data against stored patterns.
     */
    public function matchPattern(array $currentData, string $type, Organization $organization): ?TrendPattern
    {
        $patterns = TrendPattern::where('organization_id', $organization->id)
            ->where('pattern_type', $type)
            ->orderBy('confidence_score', 'desc')
            ->get();

        $bestMatch = null;
        $highestSimilarity = 0;

        foreach ($patterns as $pattern) {
            $similarity = $this->calculateSimilarity($currentData, $pattern->pattern_data);
            
            if ($similarity > $highestSimilarity && $similarity > 0.7) {
                $highestSimilarity = $similarity;
                $bestMatch = $pattern;
            }
        }

        if ($bestMatch) {
            $this->updatePatternConfidence($bestMatch->id, true);
        }

        return $bestMatch;
    }

    /**
     * Update pattern confidence based on match success.
     */
    public function updatePatternConfidence(int $patternId, bool $matched): void
    {
        $pattern = TrendPattern::find($patternId);
        
        if (!$pattern) {
            return;
        }

        $pattern->increment('occurrence_count');
        
        // Adjust confidence: increase if matched, decrease slightly if not
        if ($matched) {
            $pattern->confidence_score = min(100, $pattern->confidence_score + 2);
            $pattern->last_matched_at = now();
        } else {
            $pattern->confidence_score = max(0, $pattern->confidence_score - 1);
        }
        
        $pattern->save();
    }

    /**
     * Get patterns by type for an organization.
     */
    public function getPatternsByType(string $type, Organization $organization): Collection
    {
        return TrendPattern::where('organization_id', $organization->id)
            ->where('pattern_type', $type)
            ->where('confidence_score', '>', 50)
            ->orderBy('confidence_score', 'desc')
            ->get();
    }

    /**
     * Detect anomalies using statistical analysis.
     */
    public function detectAnomalies(array $timeSeries, int $windowDays = 30): array
    {
        if (count($timeSeries) < $windowDays) {
            Log::warning("Insufficient data for anomaly detection", [
                'data_points' => count($timeSeries),
                'required' => $windowDays
            ]);
            return [];
        }

        $mean = $this->calculateRollingMean($timeSeries, $windowDays);
        $std = $this->calculateRollingStd($timeSeries, $windowDays, $mean);
        
        $anomalies = [];
        foreach ($timeSeries as $date => $value) {
            if (!isset($mean[$date]) || !isset($std[$date]) || $std[$date] == 0) {
                continue;
            }

            $zScore = ($value - $mean[$date]) / $std[$date];
            
            if (abs($zScore) > 2) {
                $anomalies[] = [
                    'date' => $date,
                    'value' => $value,
                    'expected' => $mean[$date],
                    'z_score' => $zScore,
                    'severity' => $this->classifySeverity($zScore),
                ];
            }
        }
        
        return $anomalies;
    }

    /**
     * Extract features from snapshots based on pattern type.
     */
    protected function extractFeatures(Collection $snapshots, string $type): array
    {
        $data = [];

        foreach ($snapshots as $snapshot) {
            $date = $snapshot->snapshot_date->format('Y-m-d');

            switch ($type) {
                case 'acquisition':
                    $data[$date] = $snapshot->users ?? 0;
                    break;
                case 'engagement':
                    $data[$date] = $snapshot->engagement_rate ?? 0;
                    break;
                case 'conversion':
                    $data[$date] = $snapshot->conversions ?? 0;
                    break;
                default:
                    $data[$date] = $snapshot->sessions ?? 0;
            }
        }

        return $data;
    }

    /**
     * Analyze pattern characteristics.
     */
    protected function analyzePattern(array $data): array
    {
        $values = array_values($data);
        
        return [
            'mean' => $this->mean($values),
            'std' => $this->standardDeviation($values),
            'trend' => $this->calculateTrend($values),
            'volatility' => $this->calculateVolatility($values),
            'seasonality' => $this->detectSeasonality($data),
        ];
    }

    /**
     * Extract trigger conditions from pattern.
     */
    protected function extractTriggers(array $pattern): array
    {
        return [
            'mean_threshold' => $pattern['mean'] * 0.8,
            'std_threshold' => $pattern['std'] * 1.5,
            'trend_direction' => $pattern['trend'] > 0 ? 'up' : 'down',
        ];
    }

    /**
     * Calculate initial confidence score.
     */
    protected function calculateInitialConfidence(array $data): float
    {
        // Higher confidence for more data points
        $dataPoints = count($data);
        $baseConfidence = min(90, ($dataPoints / 90) * 90);
        
        return round($baseConfidence, 2);
    }

    /**
     * Calculate similarity between current data and stored pattern.
     */
    protected function calculateSimilarity(array $currentData, array $patternData): float
    {
        // Cosine similarity approach
        $currentFeatures = [
            $currentData['mean'] ?? 0,
            $currentData['std'] ?? 0,
            $currentData['trend'] ?? 0,
            $currentData['volatility'] ?? 0,
        ];

        $patternFeatures = [
            $patternData['mean'] ?? 0,
            $patternData['std'] ?? 0,
            $patternData['trend'] ?? 0,
            $patternData['volatility'] ?? 0,
        ];

        $dotProduct = 0;
        $currentMagnitude = 0;
        $patternMagnitude = 0;

        for ($i = 0; $i < count($currentFeatures); $i++) {
            $dotProduct += $currentFeatures[$i] * $patternFeatures[$i];
            $currentMagnitude += $currentFeatures[$i] ** 2;
            $patternMagnitude += $patternFeatures[$i] ** 2;
        }

        $currentMagnitude = sqrt($currentMagnitude);
        $patternMagnitude = sqrt($patternMagnitude);

        if ($currentMagnitude == 0 || $patternMagnitude == 0) {
            return 0;
        }

        return $dotProduct / ($currentMagnitude * $patternMagnitude);
    }

    /**
     * Calculate rolling mean.
     */
    protected function calculateRollingMean(array $timeSeries, int $window): array
    {
        $mean = [];
        $values = array_values($timeSeries);
        $dates = array_keys($timeSeries);
        
        for ($i = $window - 1; $i < count($values); $i++) {
            $windowValues = array_slice($values, $i - $window + 1, $window);
            $mean[$dates[$i]] = $this->mean($windowValues);
        }
        
        return $mean;
    }

    /**
     * Calculate rolling standard deviation.
     */
    protected function calculateRollingStd(array $timeSeries, int $window, array $means): array
    {
        $std = [];
        $values = array_values($timeSeries);
        $dates = array_keys($timeSeries);
        
        for ($i = $window - 1; $i < count($values); $i++) {
            $windowValues = array_slice($values, $i - $window + 1, $window);
            $std[$dates[$i]] = $this->standardDeviation($windowValues);
        }
        
        return $std;
    }

    /**
     * Classify anomaly severity based on z-score.
     */
    protected function classifySeverity(float $zScore): string
    {
        $absZScore = abs($zScore);
        
        if ($absZScore > 4) {
            return 'critical';
        } elseif ($absZScore > 3) {
            return 'high';
        } elseif ($absZScore > 2.5) {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Calculate mean of values.
     */
    protected function mean(array $values): float
    {
        if (empty($values)) {
            return 0;
        }
        return array_sum($values) / count($values);
    }

    /**
     * Calculate standard deviation.
     */
    protected function standardDeviation(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }

        $mean = $this->mean($values);
        $variance = array_sum(array_map(function ($x) use ($mean) {
            return pow($x - $mean, 2);
        }, $values)) / (count($values) - 1);
        
        return sqrt($variance);
    }

    /**
     * Calculate trend (linear regression slope).
     */
    protected function calculateTrend(array $values): float
    {
        $n = count($values);
        if ($n < 2) {
            return 0;
        }

        $x = range(0, $n - 1);
        $xMean = $this->mean($x);
        $yMean = $this->mean($values);

        $numerator = 0;
        $denominator = 0;

        for ($i = 0; $i < $n; $i++) {
            $numerator += ($x[$i] - $xMean) * ($values[$i] - $yMean);
            $denominator += pow($x[$i] - $xMean, 2);
        }

        return $denominator == 0 ? 0 : $numerator / $denominator;
    }

    /**
     * Calculate volatility (coefficient of variation).
     */
    protected function calculateVolatility(array $values): float
    {
        $mean = $this->mean($values);
        if ($mean == 0) {
            return 0;
        }

        $std = $this->standardDeviation($values);
        return ($std / $mean) * 100;
    }

    /**
     * Detect seasonality (simplified weekly pattern detection).
     */
    protected function detectSeasonality(array $data): ?array
    {
        if (count($data) < 14) {
            return null;
        }

        // Simple weekly pattern detection
        // This is a placeholder for more sophisticated seasonality detection
        return [
            'period' => 'weekly',
            'detected' => false,
        ];
    }
}
