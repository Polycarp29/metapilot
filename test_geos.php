<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$geos = ['US', 'KE', 'NL', 'NO'];
$baseUrl = "http://127.0.0.1:8001";

foreach ($geos as $geo) {
    echo "Testing Geo: $geo\n";
    $response = Http::timeout(30)->post("$baseUrl/trends/global", [
        'geo' => $geo,
        'niches' => ['betting']
    ]);

    if ($response->successful()) {
        $data = $response->json();
        echo "Count: " . ($data['count'] ?? 0) . "\n";
        if (!empty($data['trends'])) {
            echo "First 5 keywords: " . implode(', ', array_map(fn($t) => $t['keyword'], array_slice($data['trends'], 0, 5))) . "\n";
        }
    } else {
        echo "Failed: " . $response->status() . " " . $response->body() . "\n";
    }
    echo "-------------------\n";
}
