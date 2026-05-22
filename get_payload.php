<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = app(\App\Services\CdnAnalyticsService::class);
$payload = $service->fetchDataForOrg(1, null, false, 1, 10);
file_put_contents('/tmp/payload.json', json_encode($payload));
