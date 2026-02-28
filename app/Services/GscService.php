<?php

namespace App\Services;

use Google\Auth\Credentials\UserRefreshCredentials;
use Google\Client;
use Google\Service\SearchConsole;
use Illuminate\Support\Facades\Log;

class GscService
{
    protected $client;

    public function __construct()
    {
        // Initialize dynamically
    }

    protected function initializeClient(\App\Models\AnalyticsProperty $property)
    {
        $credentials = [
            'client_id'     => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $property->refresh_token,
        ];

        $client = new Client();
        $client->setAuthConfig($credentials);
        $client->setAccessToken($property->access_token);

        if ($client->isAccessTokenExpired()) {
            $client->fetchAccessTokenWithRefreshToken($property->refresh_token);
            $token = $client->getAccessToken();
            $property->update([
                'access_token' => $token['access_token'],
                'token_expires_at' => now()->addSeconds($token['expires_in']),
            ]);
        }

        $this->client = new SearchConsole($client);
    }

    public function fetchPerformance(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        if (!$property->gsc_site_url) {
            return null;
        }

        $this->initializeClient($property);

        try {
            $request = new \Google\Service\SearchConsole\SearchAnalyticsQueryRequest();
            $request->setStartDate($startDate);
            $request->setEndDate($endDate);
            $request->setDimensions(['date']);
            $request->setRowLimit(1000);

            $response = $this->client->searchanalytics->query($property->gsc_site_url, $request);
            
            // Success! Reset permission error flag if it was set
            if ($property->gsc_permission_error) {
                $property->update(['gsc_permission_error' => false]);
            }

            return $this->parsePerformanceResponse($response);
        } catch (\Google\Service\Exception $e) {
            if ($this->isPermissionError($e)) {
                $property->update(['gsc_permission_error' => true]);
                Log::warning("GSC Permission Denied for Property {$property->id}. User needs to reconnect with Search Console permissions.");
            } else {
                Log::error("GSC Performance Fetch Failed for Property {$property->id}: " . $e->getMessage());
            }
            return null;
        } catch (\Exception $e) {
            Log::error("GSC Performance Fetch Failed for Property {$property->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Fetch aggregate performance metrics for a date range (no dimensions).
     */
    public function fetchAggregatePerformance(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        if (!$property->gsc_site_url) {
            return null;
        }

        $this->initializeClient($property);

        try {
            $request = new \Google\Service\SearchConsole\SearchAnalyticsQueryRequest();
            $request->setStartDate($startDate);
            $request->setEndDate($endDate);
            // No dimensions = aggregate total

            $response = $this->client->searchanalytics->query($property->gsc_site_url, $request);
            
            $rows = $response->getRows();
            if (empty($rows)) {
                return [
                    'clicks' => 0,
                    'impressions' => 0,
                    'ctr' => 0,
                    'position' => 0,
                ];
            }

            $data = $rows[0];
            return [
                'clicks' => $data->getClicks(),
                'impressions' => $data->getImpressions(),
                'ctr' => $data->getCtr(),
                'position' => $data->getPosition(),
            ];
        } catch (\Exception $e) {
            Log::error("GSC Aggregate Performance Fetch Failed for Property {$property->id}: " . $e->getMessage());
            return null;
        }
    }

    public function fetchBreakdowns(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        if (!$property->gsc_site_url) {
            return [];
        }

        $this->initializeClient($property);

        $breakdowns = [
            'top_queries' => $this->fetchDimensionBreakdown($property, $startDate, $endDate, 'query'),
            'top_pages' => $this->fetchDimensionBreakdown($property, $startDate, $endDate, 'page'),
        ];

        return $breakdowns;
    }

    protected function fetchDimensionBreakdown(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate, string $dimension)
    {
        try {
            $request = new \Google\Service\SearchConsole\SearchAnalyticsQueryRequest();
            $request->setStartDate($startDate);
            $request->setEndDate($endDate);
            $request->setDimensions([$dimension]);
            $request->setRowLimit(25);

            $response = $this->client->searchanalytics->query($property->gsc_site_url, $request);
            
            // Success reset
            if ($property->gsc_permission_error) {
                $property->update(['gsc_permission_error' => false]);
            }

            $results = [];
            foreach ($response->getRows() as $row) {
                $results[] = [
                    'name' => $row->getKeys()[0],
                    'clicks' => $row->getClicks(),
                    'impressions' => $row->getImpressions(),
                    'ctr' => $row->getCtr(),
                    'position' => $row->getPosition(),
                ];
            }

            return $results;
        } catch (\Google\Service\Exception $e) {
            if ($this->isPermissionError($e)) {
                $property->update(['gsc_permission_error' => true]);
                Log::warning("GSC Permission Denied for Property {$property->id} breakdown ({$dimension}).");
            } else {
                Log::error("GSC Breakdown Fetch Failed for Property {$property->id} ({$dimension}): " . $e->getMessage());
            }
            return [];
        } catch (\Exception $e) {
            Log::error("GSC Breakdown Fetch Failed for Property {$property->id} ({$dimension}): " . $e->getMessage());
            return [];
        }
    }

    public function fetchSitemaps(\App\Models\AnalyticsProperty $property)
    {
        if (!$property->gsc_site_url) {
            return [];
        }

        $this->initializeClient($property);

        try {
            $response = $this->client->sitemaps->listSitemaps($property->gsc_site_url);
            $sitemaps = $response->getSitemap();
            
            if (!$sitemaps) return [];

            $results = [];
            foreach ($sitemaps as $sitemap) {
                $results[] = [
                    'path' => $sitemap->getPath(),
                    'last_processed' => $sitemap->getLastSubmitted(),
                    'last_check' => $sitemap->getLastDownloaded(),
                    'errors' => $sitemap->getErrors(),
                    'warnings' => $sitemap->getWarnings(),
                    'contents' => $sitemap->getContents(), // contains counts
                ];
            }

            return $results;
        } catch (\Google\Service\Exception $e) {
            if ($this->isPermissionError($e)) {
                Log::warning("GSC Permission Denied for Property {$property->id} sitemaps.");
            } else {
                Log::error("GSC Sitemaps Fetch Failed for Property {$property->id}: " . $e->getMessage());
            }
            return [];
        } catch (\Exception $e) {
            Log::error("GSC Sitemaps Fetch Failed for Property {$property->id}: " . $e->getMessage());
            return [];
        }
    }

    public function inspectUrl(\App\Models\AnalyticsProperty $property, string $url)
    {
        if (!$property->gsc_site_url) {
            return null;
        }

        $this->initializeClient($property);

        try {
            $request = new \Google\Service\SearchConsole\InspectUrlIndexRequest();
            $request->setInspectionUrl($url);
            $request->setSiteUrl($property->gsc_site_url);

            $response = $this->client->urlInspection_index->inspect($request);
            return $response->getInspectionResult();
        } catch (\Exception $e) {
            Log::error("GSC URL Inspection Failed for URL {$url}: " . $e->getMessage());
            return null;
        }
    }

    protected function parsePerformanceResponse($response)
    {
        $data = [];
        foreach ($response->getRows() as $row) {
            $data[] = [
                'date' => $row->getKeys()[0],
                'clicks' => $row->getClicks(),
                'impressions' => $row->getImpressions(),
                'ctr' => $row->getCtr(),
                'position' => $row->getPosition(),
            ];
        }

        return $data;
    }

    /**
     * Fetch and save data for a property and date range.
     */
    public function syncData(\App\Models\AnalyticsProperty $property, string $startDate, string $endDate)
    {
        Log::info("Syncing GSC data for property {$property->id} from {$startDate} to {$endDate}");
        
        try {
            // 1. Fetch performance for the whole range (daily rows)
            $performanceData = $this->fetchPerformance($property, $startDate, $endDate);
            
            // 2. Fetch breakdowns for the whole range (aggregate)
            $breakdowns = $this->fetchBreakdowns($property, $startDate, $endDate);
            
            // 3. Fetch sitemaps
            $sitemaps = $this->fetchSitemaps($property);

            if ($performanceData) {
                foreach ($performanceData as $daily) {
                    $date = $daily['date'];
                    
                    $dataToSave = [
                        'clicks' => $daily['clicks'],
                        'impressions' => $daily['impressions'],
                        'ctr' => $daily['ctr'],
                        'position' => $daily['position'],
                    ];

                    // Attach breakdowns and sitemaps to the latest date in the range
                    if ($date === $endDate) {
                        $dataToSave['top_queries'] = $breakdowns['top_queries'] ?? [];
                        $dataToSave['top_pages'] = $breakdowns['top_pages'] ?? [];
                        $dataToSave['sitemaps'] = $sitemaps;
                    }

                    \App\Models\SearchConsoleMetric::updateOrCreate(
                        [
                            'analytics_property_id' => $property->id,
                            'snapshot_date' => $date,
                        ],
                        $dataToSave
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error("GSC Sync failed for property {$property->id}: " . $e->getMessage());
            return false;
        }

        if ($property->gsc_permission_error) {
            $property->update(['gsc_permission_error' => false]);
        }

        return true;
    }

    /**
     * Check if the exception is a permission error.
     */
    protected function isPermissionError(\Google\Service\Exception $e): bool
    {
        $errors = $e->getErrors();
        
        // Check for 403 status
        if ($e->getCode() === 403) {
            return true;
        }
        
        // Check for insufficient permissions in error details
        foreach ($errors as $error) {
            if (isset($error['reason']) && $error['reason'] === 'insufficientPermissions') {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get sitemap submission errors for the control engine.
     */
    public function getSitemapErrors(\App\Models\AnalyticsProperty $property): array
    {
        $sitemaps = $this->fetchSitemaps($property);
        $errors = [];

        foreach ($sitemaps as $sitemap) {
            if (($sitemap['errors'] ?? 0) > 0 || ($sitemap['warnings'] ?? 0) > 0) {
                $errors[] = [
                    'path' => $sitemap['path'],
                    'errors' => $sitemap['errors'] ?? 0,
                    'warnings' => $sitemap['warnings'] ?? 0,
                    'last_processed' => $sitemap['last_processed'] ?? null,
                ];
            }
        }

        return $errors;
    }

    /**
     * Get crawl errors from Search Console (placeholder implementation).
     * In a real implementation, this would use the URL Inspection API
     * or other GSC endpoints to detect crawl errors.
     */
    public function getCrawlErrors(\App\Models\AnalyticsProperty $property): array
    {
        // Placeholder - In production, implement URL Inspection API calls
        // to check for crawl errors on important URLs
        return [];
    }

    /**
     * Get index coverage issues (placeholder implementation).
     * In a real implementation, this would use the Index Coverage API
     * to detect pages that are excluded from indexing.
     */
    public function getIndexCoverage(\App\Models\AnalyticsProperty $property): array
    {
        // Placeholder - In production, implement Index Coverage API calls
        // to detect indexing issues
        return [];
    }
}
