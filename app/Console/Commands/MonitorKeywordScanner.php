<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\TrendingKeyword;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MonitorKeywordScanner extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scanner:status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor the health and status of the Keyword Intelligence scanner';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->header("Keyword Intelligence Scanner Status");

        // 1. Organization Run Times
        $this->section("Organization Discovery Status");
        $organizations = Organization::all(['id', 'name', 'last_keyword_discovery_at']);
        
        $data = $organizations->map(function ($org) {
            return [
                'ID' => $org->id,
                'Name' => $org->name,
                'Last Run' => $org->last_keyword_discovery_at ? $org->last_keyword_discovery_at->diffForHumans() : 'Never',
            ];
        });

        $this->table(['ID', 'Name', 'Last Run'], $data);

        // 1b. Analytics Properties Status
        $this->section("Analytics Properties Status");
        $properties = \App\Models\AnalyticsProperty::all(['id', 'name', 'last_sync_at']);
        
        $propData = $properties->map(function ($prop) {
            return [
                'ID' => $prop->id,
                'Name' => $prop->name,
                'Last Sync' => $prop->last_sync_at ? $prop->last_sync_at->diffForHumans() : 'Never',
            ];
        });

        $this->table(['ID', 'Name', 'Last Sync'], $propData);

        // 2. Discovery Stats
        $this->section("Discovery Stats (Last 24 Hours)");
        $count = TrendingKeyword::where('created_at', '>=', now()->subDay())->count();
        $this->info("Keywords discovered in last 24h: {$count}");

        // 3. Log Check
        $this->section("Recent Log Entries");
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            $this->line("<fg=gray>Checking keyword discovery logs...</>");
            $keywordLogs = $this->getRecentLogs($logPath, "Trending keywords discovery", 3);
            foreach ($keywordLogs as $log) {
                $this->line("- " . trim($log));
            }

            $this->newLine();
            $this->line("<fg=gray>Checking automated analytics logs...</>");
            $analyticsLogs = $this->getRecentLogs($logPath, "automated analytics processing", 3);
            foreach ($analyticsLogs as $log) {
                $this->line("- " . trim($log));
            }

            if (empty($keywordLogs) && empty($analyticsLogs)) {
                $this->warn("No recent discovery or analytics logs found in laravel.log");
            }
        } else {
            $this->error("Log file not found at: {$logPath}");
        }

        return 0;
    }

    protected function header($text)
    {
        $this->newLine();
        $this->line("<options=bold;fg=cyan>========================================</>");
        $this->line("<options=bold;fg=cyan> {$text} </>");
        $this->line("<options=bold;fg=cyan>========================================</>");
    }

    protected function section($text)
    {
        $this->newLine();
        $this->line("<options=bold;fg=yellow>## {$text}</>");
    }

    protected function getRecentLogs($path, $pattern, $limit)
    {
        // Simple way to get last N matching lines without loading entire file
        $command = "grep " . escapeshellarg($pattern) . " " . escapeshellarg($path) . " | tail -n " . (int)$limit;
        exec($command, $output);
        return $output;
    }
}
