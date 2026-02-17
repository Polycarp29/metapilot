<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SerperService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://google.serper.dev/search';

    public function __construct()
    {
        $this->apiKey = config('services.serper.api_key') ?? '';
    }

    /**
     * Search Google using Serper.dev
     * 
     * @param string $query
     * @param string $gl Country code (e.g., 'us')
     * @param string $hl Language code (e.g., 'en')
     * @return array|null
     */
    public function search(string $query, string $gl = 'us', string $hl = 'en'): ?array
    {
        if (empty($this->apiKey)) {
            Log::error('Serper API key is missing.');
            return null;
        }

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, [
                'q' => $query,
                'gl' => $gl,
                'hl' => $hl,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Serper API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'query' => $query
            ]);

        } catch (\Exception $e) {
            Log::error('Serper API exception', [
                'message' => $e->getMessage(),
                'query' => $query
            ]);
        }

        return null;
    }
}
