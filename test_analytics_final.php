<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\AnalyticsProperty;
use App\Services\PythonEngineService;

$propertyId = 7;
$property = AnalyticsProperty::find($propertyId);

if (!$property) {
    die("Property {$propertyId} not found.\n");
}

echo "--- Rerunning Analytics for Property {$propertyId} ({$property->name}) ---\n";

$service = app(PythonEngineService::class);
try {
    echo "Running Strategic Analysis...\n";
    $result = $service->processProperty($property);
    echo "Strategic Analysis: " . ($result ? "Success" : "Failed") . "\n";
    
    echo "Running Ad Performance Analysis...\n";
    $resultAd = $service->processAdPerformance($property);
    echo "Ad Performance Analysis: " . ($resultAd ? "Success" : "Failed") . "\n";
    
    // Check the saved forecast
    $forecast = \App\Models\AnalyticalForecast::where('analytics_property_id', $propertyId)
        ->where('forecast_type', 'ad_performance')
        ->first();
        
    if ($forecast) {
        echo "Ad Performance Forecast Data:\n";
        print_r($forecast->forecast_data);
    } else {
        echo "No ad_performance forecast found.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
