<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsProperty;
use App\Models\AnalyticalForecast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AnalyticsWebhookController extends Controller
{
    /**
     * Handle callbacks from the Python Analytics Engine worker.
     */
    public function handle(Request $request)
    {
        // Simple security check (could be enhanced with a shared secret in .env)
        // $expectedSecret = config('services.python_engine.webhook_secret');
        // if ($expectedSecret && $request->header('X-Analytics-Secret') !== $expectedSecret) {
        //     return response()->json(['error' => 'Unauthorized'], 401);
        // }

        $payload = $request->all();
        $propertyId = $payload['property_id'] ?? null;
        $type = $payload['type'] ?? 'full';

        Log::info("Analytics Webhook received for Property: $propertyId, Type: $type");

        if (!$propertyId) {
            return response()->json(['error' => 'Missing property_id'], 400);
        }

        $property = AnalyticsProperty::find($propertyId);
        if (!$property) {
            Log::error("Property not found for analytics callback: $propertyId");
            return response()->json(['error' => 'Property not found'], 404);
        }

        try {
            if ($type === 'ad_performance') {
                AnalyticalForecast::updateOrCreate(
                    [
                        'analytics_property_id' => $property->id,
                        'forecast_type' => 'ad_performance',
                    ],
                    [
                        'forecast_data' => $payload['recommendations'] ?? [],
                        'confidence_score' => 0.90,
                        'valid_until' => now()->addDays(2),
                    ]
                );
            } else {
                $predictions = $payload['predictions'] ?? [];
                foreach ($predictions as $forecastType => $forecastData) {
                    AnalyticalForecast::updateOrCreate(
                        [
                            'analytics_property_id' => $property->id,
                            'forecast_type' => $forecastType,
                        ],
                        [
                            'forecast_data' => $forecastData,
                            'confidence_score' => 0.85,
                            'valid_until' => now()->addDays(1),
                        ]
                    );
                }
            }

            return response()->json(['status' => 'acknowledged']);

        } catch (\Exception $e) {
            Log::error("Failed to process analytics webhook: " . $e->getMessage());
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }
}
