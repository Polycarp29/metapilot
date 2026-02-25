<?php

namespace App\Services;

use App\Models\AnalyticsProperty;
use App\Models\MetricSnapshot;
use App\Models\AnalyticalForecast;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class PythonEngineService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.python_engine.url', 'http://localhost:8001');
    }

    /**
     * Send analytics data to Python Engine for processing.
     */
    public function processProperty(AnalyticsProperty $property, int $lookbackDays = 30, bool $forceSync = false): bool
    {
        $snapshots = MetricSnapshot::where('analytics_property_id', $property->id)
            ->where('snapshot_date', '>=', now()->subDays($lookbackDays))
            ->orderBy('snapshot_date', 'asc')
            ->get();

        if ($snapshots->count() < 7) {
            Log::warning("Insufficient data to process property {$property->id}. Found {$snapshots->count()} snapshots.");
            return false;
        }

        $payload = [
            'property_id' => (string) $property->id,
            'historical_data' => $snapshots->map(function ($snapshot) {
                // Transform channel group array to dictionary: { "Organic Search": { "users": 10, "conversions": 2 }, ... }
                $channels = [];
                foreach (($snapshot->first_user_channel_group ?: []) as $channel) {
                    $name = $channel['name'] ?? 'Unknown';
                    $channels[$name] = [
                        'users' => (int) ($channel['activeUsers'] ?? 0),
                        'conversions' => (int) ($channel['conversions'] ?? 0)
                    ];
                }

                // Transform sources array to simple dictionary: { "google": 100, "(direct)": 50, ... }
                $sources = [];
                foreach (($snapshot->manual_source_sessions ?: []) as $source) {
                    $name = $source['name'] ?? 'Unknown';
                    $sources[$name] = (int) ($source['sessions'] ?? 0);
                }

                return [
                    'date' => $snapshot->snapshot_date->format('Y-m-d'),
                    'returning_users' => (int) $snapshot->returning_users,
                    'sessions' => (int) $snapshot->sessions,
                    'conversions' => (int) $snapshot->conversions,
                    'channels' => (object) $channels,
                    'sources'  => (object) $sources,
                ];
            })->toArray(),
            'google_ads_data' => [], // Placeholder for future GAds integration
            'config' => [
                'forecast_days' => 14,
                'propensity_threshold' => 0.75
            ]
        ];

        // Large datasets or background requests go to Redis for the Worker
        if (!$forceSync && $snapshots->count() > 60) {
            return $this->dispatchToRedis('full', $payload);
        }

        try {
            Log::info("Sending data to Python Engine API for property {$property->id}", [
                'endpoint' => '/predict/full',
                'payload_size' => strlen(json_encode($payload))
            ]);
            
            // Log full payload in debug mode or for troubleshooting
            Log::debug("Python Engine Payload for property {$property->id}:", $payload);

            $response = Http::timeout(60)->post("{$this->baseUrl}/predict/full", $payload);

            if ($response->successful()) {
                $data = $response->json();
                $this->saveForecasts($property, $data);
                return true;
            }

            Log::error("Python Engine API returned error for property {$property->id}", [
                'status' => $response->status(),
                'body' => $response->body(),
                'headers' => $response->headers()
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to communicate with Python Engine API: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
        }

        return false;
    }

    /**
     * Process ad performance specifically.
     */
    public function processAdPerformance(AnalyticsProperty $property, bool $forceSync = false): bool
    {
        $snapshots = MetricSnapshot::where('analytics_property_id', $property->id)
            ->where('snapshot_date', '>=', now()->subDays(30))
            ->orderBy('snapshot_date', 'asc')
            ->get();

        if ($snapshots->isEmpty()) {
            return false;
        }

        // 1. Extract Campaign Data
        $campaignData = [];
        foreach ($snapshots as $snapshot) {
            $byCampaign = $snapshot->by_campaign ?: [];
            foreach ($byCampaign as $campaignName => $data) {
                if (!isset($data['ad_cost']) || $data['ad_cost'] == 0) continue;
                
                $campaignData[] = [
                    'date' => $snapshot->snapshot_date->format('Y-m-d'),
                    'campaign_name' => $campaignName,
                    'clicks' => (int) ($data['ad_clicks'] ?? 0),
                    'conversions' => (int) ($data['conversions'] ?? 0),
                    'cost' => (float) ($data['ad_cost'] ?? 0),
                    'impressions' => (int) ($data['ad_impressions'] ?? 0),
                ];
            }
        }

        // 2. Extract Keyword Trends
        $keywordTrends = \App\Models\TrendingKeyword::where('organization_id', $property->organization_id)
            ->where('created_at', '>=', now()->subDays(7))
            ->get()
            ->map(function ($kw) {
                return [
                    'keyword' => $kw->keyword,
                    'trend_score' => (float) $kw->growth_rate
                ];
            })->toArray();

        $payload = [
            'property_id' => (string) $property->id,
            'type' => 'ad_performance',
            'campaign_data' => $campaignData,
            'keyword_trends' => $keywordTrends
        ];

        if (!$forceSync && count($campaignData) > 50) {
            return $this->dispatchToRedis('ad_performance', $payload);
        }

        try {
            Log::info("Sending Ad Performance data to Python Engine for property {$property->id}");
            Log::debug("Ad Performance Payload:", $payload);

            $response = Http::timeout(60)->post("{$this->baseUrl}/predict/ad-performance", $payload);

            if ($response->successful()) {
                $data = $response->json();
                
                AnalyticalForecast::updateOrCreate(
                    [
                        'analytics_property_id' => $property->id,
                        'forecast_type' => 'ad_performance',
                    ],
                    [
                        'forecast_data' => $data['recommendations'],
                        'confidence_score' => 0.90,
                        'valid_until' => now()->addDays(2),
                    ]
                );
                return true;
            } else {
                Log::error("Ad Performance prediction API failed for property {$property->id}", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Ad Performance prediction failed: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
        }

        return false;
    }

    /**
     * Dispatch job to Redis for background processing by the Python Worker.
     */
    protected function dispatchToRedis(string $type, array $payload): bool
    {
        try {
            $payload['type'] = $type;
            $queueName = "analytics:jobs";
            
            Log::info("Dispatching analytics job to Redis: $queueName", ['type' => $type]);
            
            Redis::lpush($queueName, json_encode($payload));
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to dispatch analytics job to Redis: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Save forecasts into the database.
     */
    protected function saveForecasts(AnalyticsProperty $property, array $data): void
    {
        $predictions = $data['predictions'] ?? [];
        $validUntil = $data['valid_until'] ?? now()->addDay();

        foreach ($predictions as $type => $forecastData) {
            AnalyticalForecast::updateOrCreate(
                [
                    'analytics_property_id' => $property->id,
                    'forecast_type' => $type,
                ],
                [
                    'forecast_data' => $forecastData,
                    'confidence_score' => 0.85,
                    'valid_until' => $validUntil,
                ]
            );
        }
    }
}
