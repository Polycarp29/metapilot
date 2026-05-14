<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\DB;
use App\Models\AdTrackEvent;

class CdnStatus extends Command
{
    protected $signature = 'cdn:status';
    protected $description = 'Check the health and lag of the CDN ingestion pipeline';

    public function handle()
    {
        $this->info('--- CDN Ingestion Pipeline Status ---');

        // 1. Queue Lag
        $queueSize = Queue::size('cdn-ingestion');
        $this->line("Queue [cdn-ingestion] size: " . ($queueSize > 0 ? "<fg=red>$queueSize</>" : "<fg=green>0</>") . " pending hits");

        // 2. Recent Throughput (last 10 mins)
        $recentHits = AdTrackEvent::where('created_at', '>=', now()->subMinutes(10))->count();
        $this->line("Throughput (last 10 mins): <fg=cyan>$recentHits</> hits processed (" . round($recentHits / 10, 1) . " hits/min)");

        // 3. Bot Ratio
        $totalRecent = max(1, $recentHits);
        $botHits = AdTrackEvent::where('created_at', '>=', now()->subMinutes(10))->where('is_bot', true)->count();
        $botRatio = round(($botHits / $totalRecent) * 100, 1);
        $this->line("Bot Ratio (last 10 mins): " . ($botRatio > 50 ? "<fg=yellow>$botRatio%</>" : "<fg=green>$botRatio%</>"));

        if ($queueSize > 1000) {
            $this->warn('WARNING: High queue lag detected. Consider adding more workers: php artisan queue:work --queue=cdn-ingestion');
        }

        return 0;
    }
}
