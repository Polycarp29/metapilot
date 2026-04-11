<?php

// verify_pique_fixes.php

use App\Models\Organization;
use App\Models\User;
use App\Services\AI\Agent\PiqueActionDispatcher;
use App\Services\AI\Agent\PiqueSchedulingService;
use App\Services\AI\Agent\PiqueSystemPromptBuilder;
use Illuminate\Support\Facades\Artisan;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// 1. Resolve dependencies
$dispatcher = app(PiqueActionDispatcher::class);
$scheduler  = app(PiqueSchedulingService::class);
$promptBuf  = app(PiqueSystemPromptBuilder::class);

$org = Organization::first();
$user = User::first();

if (!$org || !$user) {
    echo "Error: Need at least one organization and user to test.\n";
    exit(1);
}

echo "--- Testing Pique Visualization Catching ---\n";
$intents = [
    'How are people visiting my site?' => 'device_split',
    'Show me where my traffic is coming from' => 'attribution_analysis',
    'Is my bounce rate improving?' => 'engagement_trend',
    'Tell me how my site is doing' => 'analytics_insight'
];

foreach ($intents as $prompt => $expectedAction) {
    $result = $dispatcher->dispatch($prompt, $org, $user);
    $action = $result['action'] ?? 'none';
    $hasChart = isset($result['chart']) ? 'YES' : 'NO';
    echo "Prompt: [{$prompt}] -> Action: [{$action}] | Chart: [{$hasChart}]\n";
}

echo "\n--- Testing Pique Scheduling Intent ---\n";
$schedulePrompt = "Schedule a weekly crawl for every Monday at 8 AM";
$schedResult = $dispatcher->dispatch($schedulePrompt, $org, $user);

echo "Prompt: [{$schedulePrompt}]\n";
echo "Action: [" . ($schedResult['action'] ?? 'none') . "]\n";
echo "Label: [" . ($schedResult['label'] ?? 'none') . "]\n";

if (($schedResult['action'] ?? '') === 'schedule_task') {
    echo "SUCCESS: Scheduling intent captured.\n";
} else {
    echo "FAILURE: Scheduling intent NOT captured.\n";
}

echo "\n--- Verifying Artisan Commands ---\n";
$commands = Artisan::all();
if (isset($commands['pique:run-scheduled'])) {
    echo "SUCCESS: pique:run-scheduled command registered.\n";
} else {
    echo "FAILURE: pique:run-scheduled command NOT found.\n";
}

echo "\nVerification Complete.\n";
