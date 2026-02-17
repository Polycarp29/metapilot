<?php

namespace App\Services\GoogleTrends;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleTrendsScraper
{
    /**
     * Fetch interest over time from Google Trends (Unofficial/Scraper).
     * 
     * @param string $keyword
     * @param string $geo
     * @param string $timeframe
     * @return array|null
     */
    public function fetchInterestOverTime(string $keyword, string $geo = 'US', string $timeframe = 'today 12-m'): ?array
    {
        try {
            // 1. Get the token (cookie)
            $response = Http::get('https://trends.google.com/trends/api/explore', [
                'hl' => 'en-US',
                'tz' => '-180',
                'req' => json_encode([
                    'comparisonItem' => [
                        [
                            'keyword' => $keyword,
                            'geo' => $geo,
                            'time' => $timeframe
                        ]
                    ],
                    'category' => 0,
                    'property' => ''
                ]),
                'tz' => '-180'
            ]);

            if (!$response->successful()) {
                Log::warning("Google Trends Scraper: Failed to fetch token", ['status' => $response->status()]);
                return null;
            }

            // Extract the token from the response (it starts with ")]}',")
            $content = substr($response->body(), 5);
            $json = json_decode($content, true);
            
            if (!isset($json['widgets'])) {
                return null;
            }

            $token = null;
            $request = null;

            foreach ($json['widgets'] as $widget) {
                if ($widget['id'] === 'TIMESERIES') {
                    $token = $widget['token'];
                    $request = $widget['request'];
                    break;
                }
            }

            if (!$token) {
                return null;
            }

            // 2. Fetch the actual data
            $dataResponse = Http::get('https://trends.google.com/trends/api/widgetdata/multiline', [
                'req' => json_encode($request),
                'token' => $token,
                'tz' => '-180'
            ]);

            if (!$dataResponse->successful()) {
                return null;
            }

            $dataContent = substr($dataResponse->body(), 5);
            $dataJson = json_decode($dataContent, true);

            if (!isset($dataJson['default']['timelineData'])) {
                return null;
            }

            // Parse into standardized format
            $timeline = [];
            foreach ($dataJson['default']['timelineData'] as $point) {
                $timeline[] = [
                    'date' => $point['formattedTime'],
                    'value' => $point['value'][0] ?? 0,
                    'isPartial' => $point['isPartial'] ?? false
                ];
            }

            return [
                'interest_over_time' => $timeline,
                'related_queries' => [], // Related queries require a separate call
                'rising_queries' => []
            ];

        } catch (\Exception $e) {
            Log::error("Google Trends Scraper Exception: " . $e->getMessage());
            return null;
        }
    }
}
