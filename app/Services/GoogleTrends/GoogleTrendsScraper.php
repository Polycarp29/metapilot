<?php

namespace App\Services\GoogleTrends;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleTrendsScraper
{
    protected array $userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ];

    /**
     * Fetch interest over time from Google Trends (Unofficial/Scraper).
     */
    public function fetchInterestOverTime(string $keyword, string $geo = 'US', string $timeframe = 'today 12-m'): ?array
    {
        $headers = [
            'User-Agent' => $this->userAgents[array_rand($this->userAgents)],
            'Accept' => 'application/json, text/plain, */*',
            'Accept-Language' => 'en-US,en;q=0.9',
            'Referer' => 'https://trends.google.com/trends/explore',
        ];

        try {
            // Add a small jitter to avoid bot pattern
            usleep(rand(100000, 300000));

            // 1. Get the token (cookie)
            $response = Http::withHeaders($headers)->get('https://trends.google.com/trends/api/explore', [
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
                ])
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
            $dataResponse = Http::withHeaders($headers)->get('https://trends.google.com/trends/api/widgetdata/multiline', [
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
