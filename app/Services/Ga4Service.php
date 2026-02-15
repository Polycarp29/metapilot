<?php

namespace App\Services;

use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\RunReportRequest;
use Google\Auth\Credentials\UserRefreshCredentials;
use Illuminate\Support\Facades\Log;

class Ga4Service
{
    protected $client;

    public function __construct()
    {
        // We will initialize the client dynamically per request/property
    }

    /**
     * Initialize the GA4 client with OAuth tokens.
     */
    protected function initializeClient(\App\Models\AnalyticsProperty $property)
    {
        // Check if token needs refresh
        if ($property->token_expires_at && $property->token_expires_at->isPast()) {
            $this->refreshAccessToken($property);
        }

        $credentials = new UserRefreshCredentials(
            ['https://www.googleapis.com/auth/analytics.readonly'],
            [
                'client_id'     => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $property->refresh_token,
            ]
        );

        $this->client = new BetaAnalyticsDataClient([
            'credentials' => $credentials,
        ]);
    }

    /**
     * Refresh the OAuth access token.
     */
    protected function refreshAccessToken(\App\Models\AnalyticsProperty $property)
    {
        if (!$property->refresh_token) {
            Log::warning("No refresh token available for property: {$property->id}");
            return;
        }

        try {
            $response = \Illuminate\Support\Facades\Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'refresh_token',
                'refresh_token' => $property->refresh_token,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $property->update([
                    'access_token' => $data['access_token'],
                    'token_expires_at' => now()->addSeconds($data['expires_in']),
                ]);
                Log::info("Refreshed access token for property: {$property->id}");
            } else {
                Log::error("Token refresh failed for property {$property->id}: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("Token refresh exception for property {$property->id}: " . $e->getMessage());
        }
    }

    /**
     * Fetch core metrics for a single property and date range.
     */
    public function fetchDailyMetrics(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        $this->initializeClient($property);

        if (!$this->client) {
            return null;
        }

        try {
            $request = new RunReportRequest([
                'property' => 'properties/' . $property->property_id,
                'date_ranges' => [
                    new DateRange([
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ]),
                ],
                'dimensions' => [
                    new Dimension(['name' => 'date']),
                ],
                'metrics' => [
                    new Metric(['name' => 'activeUsers']),
                    new Metric(['name' => 'totalUsers']),
                    new Metric(['name' => 'newUsers']),
                    new Metric(['name' => 'sessions']),
                    new Metric(['name' => 'engagedSessions']),
                    new Metric(['name' => 'engagementRate']),
                    new Metric(['name' => 'averageSessionDuration']),
                    new Metric(['name' => 'conversions']),
                    new Metric(['name' => 'bounceRate']),
                ],
            ]);

            $response = $this->client->runReport($request);

            return $this->parseReportResponse($response);
        } catch (\Exception $e) {
            Log::error("GA4 Fetch Failed for Property {$property->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Fetch all relevant dimension breakdowns for a property and date range.
     */
    public function fetchBreakdowns(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        $dimensions = [
            'by_page' => ['dim' => 'pagePath', 'metrics' => ['activeUsers', 'bounceRate']],
            'by_source' => ['dim' => 'sessionSourceMedium', 'metrics' => ['activeUsers']],
            'by_medium' => ['dim' => 'sessionMedium', 'metrics' => ['activeUsers']],
            'by_campaign' => ['dim' => 'sessionCampaignName', 'metrics' => ['activeUsers']],
            'by_device' => ['dim' => 'deviceCategory', 'metrics' => ['activeUsers']],
            'by_country' => ['dim' => 'country', 'metrics' => ['activeUsers']],
            'by_city' => ['dim' => 'city', 'metrics' => ['activeUsers']],
        ];

        $breakdowns = [];
        foreach ($dimensions as $key => $config) {
            $breakdowns[$key] = $this->fetchDimensionBreakdown($property, $startDate, $endDate, $config['dim'], $config['metrics']);
        }

        return $breakdowns;
    }

    /**
     * Fetch top values for a specific dimension with optional metrics.
     */
    public function fetchDimensionBreakdown(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate, string $dimensionName, array $metricNames = ['activeUsers'], int $limit = 10)
    {
        $this->initializeClient($property);

        if (!$this->client) {
            return [];
        }

        try {
            $metrics = array_map(fn($name) => new Metric(['name' => $name]), $metricNames);

            $request = new RunReportRequest([
                'property' => 'properties/' . $property->property_id,
                'date_ranges' => [
                    new DateRange([
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ]),
                ],
                'dimensions' => [
                    new Dimension(['name' => $dimensionName]),
                ],
                'metrics' => $metrics,
                'limit' => $limit,
            ]);

            $response = $this->client->runReport($request);
            
            $results = [];
            foreach ($response->getRows() as $row) {
                $result = [
                    'name' => $row->getDimensionValues()[0]->getValue(),
                ];

                foreach ($metricNames as $index => $name) {
                    $val = $row->getMetricValues()[$index]->getValue();
                    // If it's a count-like metric, cast to int, otherwise float
                    $result[$name === 'activeUsers' ? 'value' : $name] = str_contains($name, 'Rate') || str_contains($name, 'Duration') ? (float) $val : (int) $val;
                }

                $results[] = $result;
            }

            return $results;
        } catch (\Exception $e) {
            Log::error("GA4 Breakdown Fetch Failed for Property {$property->id} ({$dimensionName}): " . $e->getMessage());
            return [];
        }
    }

    /**
     * Parse the GA4 report response into a structured array.
     */
    protected function parseReportResponse($response)
    {
        $data = [];
        foreach ($response->getRows() as $row) {
            $dimensionValues = $row->getDimensionValues();
            $metricValues = $row->getMetricValues();
            
            $data[] = [
                'date' => \Carbon\Carbon::createFromFormat('Ymd', $dimensionValues[0]->getValue())->format('Y-m-d'),
                'users' => (int) $metricValues[0]->getValue(),
                'total_users' => (int) $metricValues[1]->getValue(),
                'new_users' => (int) $metricValues[2]->getValue(),
                'sessions' => (int) $metricValues[3]->getValue(),
                'engaged_sessions' => (int) $metricValues[4]->getValue(),
                'engagement_rate' => (float) $metricValues[5]->getValue(),
                'avg_session_duration' => (float) $metricValues[6]->getValue(),
                'conversions' => (int) $metricValues[7]->getValue(),
                'bounce_rate' => (float) ($metricValues[8]?->getValue() ?? 0),
            ];
        }

        return $data;
    }

    /**
     * Fetch and save data for a property and date range.
     */
    public function syncData(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        Log::info("Syncing GA4 data for property {$property->id} from {$startDate} to {$endDate}");
        
        $metrics = $this->fetchDailyMetrics($property, $startDate, $endDate);
        $breakdowns = $this->fetchBreakdowns($property, $startDate, $endDate);

        if ($metrics) {
            foreach ($metrics as $dayData) {
                $dataToSave = $dayData;

                // Attach breakdowns to the latest date in the range for simplicity in reporting
                if ($dayData['date'] === $endDate) {
                    $dataToSave = array_merge($dayData, $breakdowns);
                }

                \App\Models\MetricSnapshot::updateOrCreate([
                    'analytics_property_id' => $property->id,
                    'snapshot_date' => $dayData['date'],
                ], $dataToSave);
            }
            return true;
        }

        return false;
    }
}
