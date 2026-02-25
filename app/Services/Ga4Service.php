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
        // If the token is already known invalid, skip initialization entirely
        if ($property->google_token_invalid) {
            Log::warning("GA4 client init skipped — token marked invalid for property: {$property->id}. User must re-authorize.");
            return;
        }

        if (!$property->refresh_token) {
            Log::warning("GA4 client init skipped — no refresh token for property: {$property->id}");
            return;
        }

        // UserRefreshCredentials handles token refresh automatically on each request
        // We do NOT manually pre-refresh here to avoid double 401 storms.
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
            'transport'   => 'rest', // Force REST transport because grpc extension might be missing in production
        ]);
    }

    /**
     * Refresh the OAuth access token manually (only called explicitly, not on every request).
     * Marks the property as token-invalid if Google rejects the credentials.
     */
    protected function refreshAccessToken(\App\Models\AnalyticsProperty $property)
    {
        if (!$property->refresh_token) {
            Log::warning("No refresh token available for property: {$property->id}");
            return;
        }

        try {
            $response = \Illuminate\Support\Facades\Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $property->refresh_token,
                'client_id'     => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $property->update([
                    'access_token'        => $data['access_token'],
                    'token_expires_at'    => now()->addSeconds($data['expires_in']),
                    'google_token_invalid' => false,
                ]);
                Log::info("Refreshed access token for property: {$property->id}");
            } else {
                $errorData = $response->json();
                $errorCode = $errorData['error'] ?? '';

                // Permanent credential failures — user must re-authorize via OAuth
                if (in_array($errorCode, ['invalid_client', 'invalid_grant'])) {
                    Log::error("Token permanently invalid for property {$property->id} (error: {$errorCode}). Marking as invalid — user must reconnect Google.");
                    $property->update(['google_token_invalid' => true]);
                } else {
                    Log::error("Token refresh failed for property {$property->id}: " . $response->body());
                }
            }
        } catch (\Exception $e) {
            Log::error("Token refresh exception for property {$property->id}: " . $e->getMessage());
        }
    }

    /**
     * Handle GA4 API exceptions and detect if they are due to invalid credentials.
     */
    protected function handleApiException(\Exception $e, \App\Models\AnalyticsProperty $property)
    {
        $message = $e->getMessage();
        
        // Detect 'invalid_grant' or 'invalid_client' in the exception message/body
        // The Google SDK often embeds the raw JSON error in the exception message
        if (str_contains($message, 'invalid_grant') || str_contains($message, 'invalid_client')) {
            Log::error("GA4 Permanent Auth Error for Property {$property->id}: {$message}. Marking token as invalid.");
            $property->update(['google_token_invalid' => true]);
        } else {
            Log::error("GA4 API Error for Property {$property->id}: " . $message);
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
                    new Metric(['name' => 'returningUsers']),
                    new Metric(['name' => 'sessions']),
                    new Metric(['name' => 'engagedSessions']),
                    new Metric(['name' => 'engagementRate']),
                    new Metric(['name' => 'averageSessionDuration']),
                    new Metric(['name' => 'conversions']),
                    new Metric(['name' => 'bounceRate']),
                ],
            ]);

            Log::debug("GA4 Request (Daily) for Property ID: {$property->property_id}", [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);

            $response = $this->client->runReport($request);
            
            Log::debug("GA4 Response (Daily) for Property ID: {$property->property_id}", [
                'row_count' => $response->getRowCount()
            ]);

            return $this->parseReportResponse($response);
        } catch (\Exception $e) {
            $this->handleApiException($e, $property);
            return null;
        }
    }

    /**
     * Fetch aggregate totals for a property and date range (100% accurate totals).
     */
    public function fetchAggregateMetrics(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
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
                // No dimensions = aggregate total
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

            Log::debug("GA4 Request (Aggregate) for Property ID: {$property->property_id}");

            $response = $this->client->runReport($request);

            Log::debug("GA4 Response (Aggregate) for Property ID: {$property->property_id}", [
                'row_count' => $response->getRowCount()
            ]);

            if ($response->getRowCount() > 0) {
                $metricValues = $response->getRows()[0]->getMetricValues();
                
                return [
                    'active_users' => (int) $metricValues[0]->getValue(),
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
            
            return null;
        } catch (\Exception $e) {
            $this->handleApiException($e, $property);
            return null;
        }
    }

    /**
     * Fetch all relevant dimension breakdowns for a property and date range.
     */
    public function fetchBreakdowns(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        $dimensions = [
            'by_page' => ['dim' => 'pagePath', 'metrics' => ['activeUsers', 'bounceRate', 'averageSessionDuration', 'engagedSessions']],
            'by_page_title' => ['dim' => 'pageTitle', 'metrics' => ['activeUsers', 'screenPageViews']],
            'by_source' => ['dim' => 'sessionSourceMedium', 'metrics' => ['activeUsers']],
            'by_first_source' => ['dim' => 'firstUserSource', 'metrics' => ['activeUsers']],
            'by_medium' => ['dim' => 'sessionMedium', 'metrics' => ['activeUsers']],
            'by_device' => ['dim' => 'deviceCategory', 'metrics' => ['activeUsers', 'bounceRate']],
            'by_country' => ['dim' => 'country', 'metrics' => ['activeUsers']],
            'by_city' => ['dim' => 'city', 'metrics' => ['activeUsers']],
            'by_screen' => ['dim' => 'unifiedPageScreen', 'metrics' => ['activeUsers', 'screenPageViews']],
            'by_event' => ['dim' => 'eventName', 'metrics' => ['activeUsers', 'eventCount', 'conversions']],
            'by_audience' => ['dim' => 'audienceName', 'metrics' => ['activeUsers']],
            'first_user_channel_group' => ['dim' => 'firstUserDefaultChannelGroup', 'metrics' => ['activeUsers']],
            'manual_source_sessions' => ['dim' => 'sessionSource', 'metrics' => ['sessions']],
        ];

        $breakdowns = [];
        foreach ($dimensions as $key => $config) {
            $breakdowns[$key] = $this->fetchDimensionBreakdown($property, $startDate, $endDate, $config['dim'], $config['metrics']);
        }

        // Enriched Campaign Data (Includes Ads Metrics)
        $breakdowns['by_campaign'] = $this->fetchCampaigns($property, $startDate, $endDate);

        return $breakdowns;
    }

    /**
     * Fetch campaign and acquisition data (Session Scope).
     */
    public function fetchCampaigns(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate, int $limit = 20)
    {
        $this->initializeClient($property);

        if (!$this->client) {
            return [];
        }

        try {
            // 1. Fetch Session Data (Traffic)
            $trafficRequest = new RunReportRequest([
                'property' => 'properties/' . $property->property_id,
                'date_ranges' => [
                    new DateRange(['start_date' => $startDate, 'end_date' => $endDate]),
                ],
                'dimensions' => [
                    new Dimension(['name' => 'sessionSourceMedium']),
                    new Dimension(['name' => 'sessionCampaignName']),
                    new Dimension(['name' => 'sessionGoogleAdsCampaignName']), // Keep for identification if possible, or remove if causing issues. The error said REMOVE IT.
                ],
                'metrics' => [
                    new Metric(['name' => 'sessions']),
                    new Metric(['name' => 'totalUsers']),
                    new Metric(['name' => 'conversions']),
                    new Metric(['name' => 'engagementRate']),
                ],
                'limit' => $limit,
                'order_bys' => [
                    new \Google\Analytics\Data\V1beta\OrderBy([
                        'desc' => true,
                        'metric' => new \Google\Analytics\Data\V1beta\OrderBy\MetricOrderBy([
                            'metric_name' => 'sessions',
                        ]),
                    ]),
                ],
            ]);

            // Fix: remove forbidden dimension from Traffic Request too if it was the culprit? 
            // The error "Please remove sessionGoogleAdsCampaignName" implies it was incompatible with the AD METRICS I added.
            // With just traffic metrics, it SHOULD be fine. But let's be safe and remove it if not strictly needed OR assume it works with session metrics.
            // Actually, sessionGoogleAdsCampaignName IS compatible with session metrics. It was checking against ad_cost etc. 
            // So I will KEEP it here for context, but if it fails again I'll remove it.
            
            Log::debug("GA4 Request (Campaign Traffic) for Property ID: {$property->property_id}");
            $trafficResponse = $this->client->runReport($trafficRequest);
            Log::debug("GA4 Response (Campaign Traffic) for Property ID: {$property->property_id}", [
                'row_count' => $trafficResponse->getRowCount()
            ]);

            $campaigns = [];
            $campaignNames = [];

            foreach ($trafficResponse->getRows() as $row) {
                $dimValues = $row->getDimensionValues();
                $metricValues = $row->getMetricValues();
                
                $campaignName = $dimValues[1]->getValue();
                $campaignNames[] = $campaignName;

                $campaigns[$campaignName] = [
                    'source_medium' => $dimValues[0]->getValue(),
                    'campaign' => $campaignName,
                    'google_ads_campaign' => $dimValues[2]->getValue(),
                    'sessions' => (int) $metricValues[0]->getValue(),
                    'users' => (int) $metricValues[1]->getValue(),
                    'conversions' => (int) $metricValues[2]->getValue(),
                    'engagement_rate' => (float) $metricValues[3]->getValue(),
                    // Defaults
                    'ad_clicks' => 0,
                    'ad_cost' => 0,
                    'ad_impressions' => 0,
                    'roas' => 0,
                ];
            }

            // 2. Fetch Ad Metrics & Keywords for these campaigns
            if (!empty($campaignNames)) {
                
                // Build Filter Expression
                $filterExpression = new \Google\Analytics\Data\V1beta\FilterExpression();
                $orGroup = new \Google\Analytics\Data\V1beta\FilterExpressionList();
                $expressions = [];

                // Chunking to avoid filter limits (optional but good practice)
                // For top 20, one batch is usually fine.
                foreach ($campaignNames as $name) {
                    if ($name === '(direct)' || $name === '(not set)') continue;

                    $filter = new \Google\Analytics\Data\V1beta\FilterExpression();
                    $f = new \Google\Analytics\Data\V1beta\Filter();
                    $f->setFieldName('googleAdsCampaignName'); // Event-scoped dimension compatible with Ads metrics
                    $stringFilter = new \Google\Analytics\Data\V1beta\Filter\StringFilter();
                    $stringFilter->setValue($name);
                    $f->setStringFilter($stringFilter);
                    $filter->setFilter($f);
                    $expressions[] = $filter;
                }

                if (!empty($expressions)) {
                    $orGroup->setExpressions($expressions);
                    $filterExpression->setOrGroup($orGroup);

                    // 2a. Fetch Ad Metrics
                    $adRequest = new RunReportRequest([
                        'property' => 'properties/' . $property->property_id,
                        'date_ranges' => [
                            new DateRange(['start_date' => $startDate, 'end_date' => $endDate]),
                        ],
                        'dimensions' => [
                            new Dimension(['name' => 'googleAdsCampaignName']),
                        ],
                        'metrics' => [
                            new Metric(['name' => 'advertiserAdClicks']),
                            new Metric(['name' => 'advertiserAdCost']),
                            new Metric(['name' => 'advertiserAdImpressions']),
                            new Metric(['name' => 'returnOnAdSpend']),
                        ],
                        'dimension_filter' => $filterExpression,
                    ]);

                    try {
                        Log::debug("GA4 Request (Campaign Ads) for Property ID: {$property->property_id}");
                        $adResponse = $this->client->runReport($adRequest);
                        Log::debug("GA4 Response (Campaign Ads) for Property ID: {$property->property_id}", [
                            'row_count' => $adResponse->getRowCount()
                        ]);

                        foreach ($adResponse->getRows() as $row) {
                            $name = $row->getDimensionValues()[0]->getValue();
                            $metrics = $row->getMetricValues();

                            if (isset($campaigns[$name])) {
                                $campaigns[$name]['ad_clicks'] = (int) $metrics[0]->getValue();
                                $campaigns[$name]['ad_cost'] = (float) $metrics[1]->getValue();
                                $campaigns[$name]['ad_impressions'] = (int) $metrics[2]->getValue();
                                $campaigns[$name]['roas'] = (float) $metrics[3]->getValue();
                            }
                        }
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning("GA4 Ad Metric Fetch Warning: " . $e->getMessage());
                    }

                    // 2b. Fetch Keywords
                    // We pull keywords for the same set of filtered campaigns
                    try {
                        $keywordRequest = new RunReportRequest([
                            'property' => 'properties/' . $property->property_id,
                            'date_ranges' => [
                                new DateRange(['start_date' => $startDate, 'end_date' => $endDate]),
                            ],
                            'dimensions' => [
                                new Dimension(['name' => 'googleAdsCampaignName']),
                                new Dimension(['name' => 'googleAdsKeyword']),
                            ],
                            'metrics' => [
                                new Metric(['name' => 'advertiserAdClicks']),
                                new Metric(['name' => 'advertiserAdCost']),
                            ],
                            'dimension_filter' => $filterExpression,
                            'limit' => 200, // Fetch enough to cover top keywords for the displayed campaigns
                            'order_bys' => [
                                new \Google\Analytics\Data\V1beta\OrderBy([
                                    'desc' => true,
                                    'metric' => new \Google\Analytics\Data\V1beta\OrderBy\MetricOrderBy([
                                        'metric_name' => 'advertiserAdCost',
                                    ]),
                                ]),
                            ],
                        ]);

                        $keywordResponse = $this->client->runReport($keywordRequest);

                        foreach ($keywordResponse->getRows() as $row) {
                            $campaignName = $row->getDimensionValues()[0]->getValue();
                            $keyword = $row->getDimensionValues()[1]->getValue();
                            $clicks = (int) $row->getMetricValues()[0]->getValue();
                            $cost = (float) $row->getMetricValues()[1]->getValue();

                            if (isset($campaigns[$campaignName])) {
                                if (!isset($campaigns[$campaignName]['keywords'])) {
                                    $campaigns[$campaignName]['keywords'] = [];
                                }
                                
                                // Limit to top 5 per campaign
                                if (count($campaigns[$campaignName]['keywords']) < 5) {
                                    $campaigns[$campaignName]['keywords'][] = [
                                        'keyword' => $keyword,
                                        'clicks' => $clicks,
                                        'cost' => $cost,
                                    ];
                                }
                            }
                        }

                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning("GA4 Keyword Fetch Warning: " . $e->getMessage());
                    }
                }
            }

            return array_values($campaigns);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("GA4 Campaign Fetch Failed for Property {$property->id} (ID: {$property->property_id}): " . $e->getMessage());
            return [];
        }
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

            Log::debug("GA4 Response (Breakdown: {$dimensionName}) for Property ID: {$property->property_id}", [
                'row_count' => $response->getRowCount()
            ]);
            
            $results = [];
            foreach ($response->getRows() as $row) {
                $result = [
                    'name' => $row->getDimensionValues()[0]->getValue(),
                ];

                foreach ($metricNames as $index => $name) {
                    $val = $row->getMetricValues()[$index]->getValue();
                    // If it's a count-like metric, cast to int, otherwise float
                    $result[$name] = str_contains($name, 'Rate') || str_contains($name, 'Duration') ? (float) $val : (int) $val;
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
                'returning_users' => (int) $metricValues[3]->getValue(),
                'sessions' => (int) $metricValues[4]->getValue(),
                'engaged_sessions' => (int) $metricValues[5]->getValue(),
                'engagement_rate' => (float) $metricValues[6]->getValue(),
                'avg_session_duration' => (float) $metricValues[7]->getValue(),
                'conversions' => (int) $metricValues[8]->getValue(),
                'bounce_rate' => (float) ($metricValues[9]?->getValue() ?? 0),
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

    /**
     * Get acquisition time series data for pattern learning.
     * Returns array of dates => user count for the specified time period.
     */
    public function getAcquisitionTimeSeries(\App\Models\AnalyticsProperty $property, int $days = 30): array
    {
        $snapshots = \App\Models\MetricSnapshot::where('analytics_property_id', $property->id)
            ->whereBetween('snapshot_date', [now()->subDays($days), now()])
            ->orderBy('snapshot_date')
            ->get();

        $timeSeries = [];
        foreach ($snapshots as $snapshot) {
            $timeSeries[$snapshot->snapshot_date->format('Y-m-d')] = $snapshot->users ?? 0;
        }

        return $timeSeries;
    }

    /**
     * Get engagement time series data for pattern learning.
     * Returns array of dates => engagement rate for the specified time period.
     */
    public function getEngagementTimeSeries(\App\Models\AnalyticsProperty $property, int $days = 30): array
    {
        $snapshots = \App\Models\MetricSnapshot::where('analytics_property_id', $property->id)
            ->whereBetween('snapshot_date', [now()->subDays($days), now()])
            ->orderBy('snapshot_date')
            ->get();

        $timeSeries = [];
        foreach ($snapshots as $snapshot) {
            $timeSeries[$snapshot->snapshot_date->format('Y-m-d')] = $snapshot->engagement_rate ?? 0;
        }

        return $timeSeries;
    }

    /**
     * Get conversion time series data for pattern learning.
     * Returns array of dates => conversions for the specified time period.
     */
    public function getConversionTimeSeries(\App\Models\AnalyticsProperty $property, int $days = 30): array
    {
        $snapshots = \App\Models\MetricSnapshot::where('analytics_property_id', $property->id)
            ->whereBetween('snapshot_date', [now()->subDays($days), now()])
            ->orderBy('snapshot_date')
            ->get();

        $timeSeries = [];
        foreach ($snapshots as $snapshot) {
            $timeSeries[$snapshot->snapshot_date->format('Y-m-d')] = $snapshot->conversions ?? 0;
        }

        return $timeSeries;
    }
}
