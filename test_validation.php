<?php

use App\Services\SchemaValidationService;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = new SchemaValidationService();

// Test Case 1: Valid Organization (should have no errors)
$validOrg = [
    '@context' => 'https://schema.org',
    '@type' => 'Organization',
    'name' => 'Metapilot',
    'url' => 'https://metapilot.dev'
];
$result1 = $service->validateSchema($validOrg);
echo "Test 1 (Valid Org): " . ($result1['isValid'] ? 'PASS' : 'FAIL') . "\n";
print_r($result1);

// Test Case 2: Invalid Organization (missing name)
$invalidOrg = [
    '@context' => 'https://schema.org',
    '@type' => 'Organization',
    'url' => 'https://metapilot.dev'
];
$result2 = $service->validateSchema($invalidOrg);
echo "\nTest 2 (Invalid Org - Missing Name): " . (!$result2['isValid'] ? 'PASS' : 'FAIL') . "\n";
print_r($result2);

// Test Case 3: Invalid Type (missing rules)
$unknownType = [
    '@context' => 'https://schema.org',
    '@type' => 'NonExistentType'
];
$result3 = $service->validateSchema($unknownType);
echo "\nTest 3 (Unknown Type): " . ($result3['isValid'] ? 'PASS' : 'FAIL') . "\n"; // Should be valid but warn
print_r($result3);
