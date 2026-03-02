<?php

namespace App\Services;

use App\Models\AnalyticsProperty;
use App\Models\AdCampaign;
use App\Models\Organization;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GoogleAdsReportService
{
    /**
     * Fetch campaigns and metrics from Google Ads API.
     */
    public function fetchCampaigns(AnalyticsProperty $property, string $customerId, string $dateRange = 'LAST_30_DAYS'): array
    {
        $customerId = str_replace('-', '', $customerId);
        $accessToken = $this->ensureValidToken($property);

        if (!$accessToken) {
            return [];
        }

        $query = "
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.advertising_channel_type,
                metrics.clicks,
                metrics.impressions,
                metrics.cost_micros,
                metrics.conversions,
                campaign_budget.amount_micros
            FROM campaign
            WHERE segments.date DURING {$dateRange}
        ";

        try {
            $response = Http::withToken($accessToken)
                ->withHeaders([
                    // Developer token is technically required for GA REST API too, 
                    // but some accounts/projects can bypass it if they are correctly configured 
                    // for 'internal' or 'reporting only'. 
                    // However, standard Google Ads API ALWAYS requires a developer_token.
                    // The user asked "can it be monitored by using oauth authentication?".
                    // In many cases, OAuth is the AUTH, but you still need a DEV TOKEN for the APP.
                    // If the user hasn't provided one, we might hit a 403.
                    'developer-token' => config('services.google.ads_developer_token'),
                ])
                ->post("https://googleads.googleapis.com/v17/customers/{$customerId}/googleAds:searchStream", [
                    'query' => $query
                ]);

            if ($response->successful()) {
                // searchStream returns a stream of JSON objects in an array
                $results = $response->json();
                return $this->parseResponse($results);
            }

            Log::error("Google Ads API Error for Customer {$customerId}: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Google Ads API Exception: " . $e->getMessage());
        }

        return [];
    }

    /**
     * Parse the stream response into a flat array of campaign data.
     */
    protected function parseResponse(array $streamResults): array
    {
        $campaigns = [];
        foreach ($streamResults as $batch) {
            $results = $batch['results'] ?? [];
            foreach ($results as $row) {
                $campaign = $row['campaign'];
                $metrics = $row['metrics'] ?? [];
                $budget = $row['campaignBudget'] ?? [];

                $campaigns[] = [
                    'google_campaign_id' => $campaign['id'],
                    'name' => $campaign['name'],
                    'status' => $campaign['status'],
                    'campaign_type' => $campaign['advertisingChannelType'],
                    'budget_micros' => (int) ($budget['amountMicros'] ?? 0),
                    'metrics' => [
                        'clicks' => (int) ($metrics['clicks'] ?? 0),
                        'impressions' => (int) ($metrics['impressions'] ?? 0),
                        'cost_micros' => (int) ($metrics['costMicros'] ?? 0),
                        'conversions' => (float) ($metrics['conversions'] ?? 0),
                        'ctr' => (float) ($metrics['ctr'] ?? 0),
                        'average_cpc' => (float) (($metrics['averageCpc'] ?? 0) / 1000000),
                    ],
                ];
            }
        }
        return $campaigns;
    }

    /**
     * Sync fetched campaigns to the database.
     */
    public function syncToDb(Organization $org, array $campaigns, string $dateRange): void
    {
        $property = $org->analyticsProperties()->first(); // Or iterate if multiple
        if (!$property) return;

        foreach ($campaigns as $data) {
            AdCampaign::updateOrCreate(
                [
                    'organization_id' => $org->id,
                    'google_campaign_id' => $data['google_campaign_id'],
                    'date_range' => $dateRange,
                ],
                [
                    'analytics_property_id' => $property->id,
                    'google_ads_customer_id' => $org->ads_customer_id,
                    'name' => $data['name'],
                    'status' => $data['status'],
                    'campaign_type' => $data['campaign_type'],
                    'budget_micros' => $data['budget_micros'],
                    'metrics' => $data['metrics'],
                    'synced_at' => now(),
                ]
            );
        }
    }

    /**
     * Ensure the access token is valid, refreshing if necessary.
     */
    protected function ensureValidToken(AnalyticsProperty $property): ?string
    {
        if ($property->token_expires_at && $property->token_expires_at->isFuture()) {
            return $property->access_token;
        }

        // Refresh token
        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $property->refresh_token,
                'client_id'     => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $property->update([
                    'access_token' => $data['access_token'],
                    'token_expires_at' => now()->addSeconds($data['expires_in']),
                ]);
                return $data['access_token'];
            }

            Log::error("Failed to refresh Google token for property {$property->id}: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Token refresh exception: " . $e->getMessage());
        }

        return null;
    }
}
