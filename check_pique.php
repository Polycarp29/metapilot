<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Use full namespace to avoid constant errors
$builderClass = \App\Services\AI\Agent\PiqueSystemPromptBuilder::class;
$dispatcherClass = \App\Services\AI\Agent\PiqueActionDispatcher::class;

echo "Verifying Pique Classes...\n";
if (class_exists($builderClass)) {
    echo "✓ PiqueSystemPromptBuilder is available.\n";
} else {
    echo "✗ PiqueSystemPromptBuilder NOT found.\n";
}

if (class_exists($dispatcherClass)) {
    echo "✓ PiqueActionDispatcher is available.\n";
} else {
    echo "✗ PiqueActionDispatcher NOT found.\n";
}

echo "\nVerifying Intent Detection...\n";
$org = \App\Models\Organization::first();
$user = \App\Models\User::first();
$dispatcher = app($dispatcherClass);

$testPrompts = [
    "How is my site doing?",
    "Schedule a daily crawl",
    "Show me a device breakdown"
];

foreach ($testPrompts as $p) {
    $res = $dispatcher->dispatch($p, $org, $user);
    $action = $res['action'] ?? 'none';
    echo "Prompt: '$p' -> Action: $action\n";
}

echo "\nDone.\n";
