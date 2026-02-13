<?php

namespace App\Services;

use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Illuminate\Support\Facades\Log;

class Ga4Service
{
    protected $client;

    public function __construct()
    {
        $credentialsPath = config('analytics.credentials_path');

        if ($credentialsPath && file_exists($credentialsPath)) {
            try {
                $this->client = new BetaAnalyticsDataClient([
                    'credentials' => $credentialsPath,
                ]);
            } catch (\Exception $e) {
                Log::error('GA4 Service Initialization Failed: ' . $e->getMessage());
            }
        } else {
            Log::warning('GA4 Credentials file not found at: ' . $credentialsPath);
        }
    }

    /**
     * Fetch core metrics for a single property and date range.
     */
    public function fetchDailyMetrics(string $propertyId, string $startDate, string $endDate)
    {
        if (!$this->client) {
            return null;
        }

        try {
            $response = $this->client->runReport([
                'property' => 'properties/' . $propertyId,
                'dateRanges' => [
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
                    new Metric(['name' => 'newUsers']),
                    new Metric(['name' => 'sessions']),
                    new Metric(['name' => 'engagedSessions']),
                    new Metric(['name' => 'engagementRate']),
                    new Metric(['name' => 'averageSessionDuration']),
                    new Metric(['name' => 'conversions']),
                ],
            ]);

            return $this->parseReportResponse($response);
        } catch (\Exception $e) {
            Log::error("GA4 Fetch Failed for Property {$propertyId}: " . $e->getMessage());
            return null;
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
                'date' => $dimensionValues[0]->getValue(),
                'users' => (int) $metricValues[0]->getValue(),
                'new_users' => (int) $metricValues[1]->getValue(),
                'sessions' => (int) $metricValues[2]->getValue(),
                'engaged_sessions' => (int) $metricValues[3]->getValue(),
                'engagement_rate' => (float) $metricValues[4]->getValue(),
                'avg_session_duration' => (float) $metricValues[5]->getValue(),
                'conversions' => (int) $metricValues[6]->getValue(),
            ];
        }

        return $data;
    }
}
