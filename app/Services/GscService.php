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
            
            return $this->parsePerformanceResponse($response);
        } catch (\Exception $e) {
            Log::error("GSC Performance Fetch Failed for Property {$property->id}: " . $e->getMessage());
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
            $request->setRowLimit(10);

            $response = $this->client->searchanalytics->query($property->gsc_site_url, $request);
            
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
        } catch (\Exception $e) {
            Log::error("GSC Breakdown Fetch Failed for Property {$property->id} ({$dimension}): " . $e->getMessage());
            return [];
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
}
