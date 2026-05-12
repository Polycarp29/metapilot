<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class BotFirewallReportCommand extends Command
{
    protected $signature = 'bot:report
                            {--hours=24 : Hours of logs to analyse (default: last 24h)}
                            {--top=10   : Number of top entries to show}';

    protected $description = 'Parse the security log and emit a bot block summary report';

    public function handle(): int
    {
        $hours  = (int) $this->option('hours');
        $top    = (int) $this->option('top');
        $logFile = storage_path('logs/security.log');

        $this->info("🔍 Bot Firewall Report — last {$hours} hour(s)");
        $this->line(str_repeat('─', 60));

        if (!file_exists($logFile)) {
            $this->warn("No security log found at: {$logFile}");
            $this->line("The firewall hasn't blocked anything yet, or logs haven't rotated.");
            return self::SUCCESS;
        }

        $cutoff    = now()->subHours($hours);
        $stats     = $this->parseLog($logFile, $cutoff);

        if ($stats['total'] === 0) {
            $this->info("✅ No blocks recorded in the last {$hours} hour(s).");
            return self::SUCCESS;
        }

        $this->info("📊 Total blocks: {$stats['total']}");
        $this->newLine();

        // Top IPs
        $this->line("🌐 Top {$top} Blocked IPs:");
        $this->printTable($stats['ips'], $top, 'IP Address', 'Blocks');

        // Top User-Agents
        $this->line("🤖 Top {$top} Blocked User-Agents:");
        $this->printTable($stats['agents'], $top, 'User-Agent', 'Blocks');

        // Top Probed Paths
        $this->line("🔎 Top {$top} Probed Paths:");
        $this->printTable($stats['paths'], $top, 'Path', 'Blocks');

        // Reasons breakdown
        $this->line("⚠️  Block Reasons:");
        arsort($stats['reasons']);
        foreach ($stats['reasons'] as $reason => $count) {
            $this->line("   {$count}x  {$reason}");
        }

        $this->newLine();
        $this->line(str_repeat('─', 60));

        // Write summary to log
        Log::channel('security')->info('Daily bot report', [
            'period_hours' => $hours,
            'total_blocks' => $stats['total'],
            'top_ip'       => array_key_first($stats['ips']) ?? 'N/A',
            'top_agent'    => array_key_first($stats['agents']) ?? 'N/A',
            'top_path'     => array_key_first($stats['paths']) ?? 'N/A',
        ]);

        return self::SUCCESS;
    }

    /**
     * Parse the security log file and aggregate block statistics.
     */
    protected function parseLog(string $logFile, \Carbon\Carbon $cutoff): array
    {
        $stats = [
            'total'   => 0,
            'ips'     => [],
            'agents'  => [],
            'paths'   => [],
            'reasons' => [],
        ];

        $handle = fopen($logFile, 'r');
        if (!$handle) {
            return $stats;
        }

        while (($line = fgets($handle)) !== false) {
            // Laravel log format: [YYYY-MM-DD HH:MM:SS] local.WARNING: Bot blocked ...
            if (!str_contains($line, 'Bot blocked')) {
                continue;
            }

            // Extract timestamp
            if (preg_match('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $line, $m)) {
                try {
                    $logTime = \Carbon\Carbon::parse($m[1]);
                    if ($logTime->lt($cutoff)) {
                        continue;
                    }
                } catch (\Exception) {
                    continue;
                }
            }

            $stats['total']++;

            // Extract JSON context
            if (preg_match('/\{.*\}$/', $line, $jsonMatch)) {
                $ctx = json_decode($jsonMatch[0], true);
                if (is_array($ctx)) {
                    $ip     = $ctx['ip'] ?? 'unknown';
                    $agent  = substr($ctx['user_agent'] ?? 'unknown', 0, 80);
                    $path   = $ctx['path'] ?? 'unknown';
                    $reason = $ctx['reason'] ?? 'unknown';

                    $stats['ips'][$ip]       = ($stats['ips'][$ip] ?? 0) + 1;
                    $stats['agents'][$agent] = ($stats['agents'][$agent] ?? 0) + 1;
                    $stats['paths'][$path]   = ($stats['paths'][$path] ?? 0) + 1;
                    $stats['reasons'][$reason] = ($stats['reasons'][$reason] ?? 0) + 1;
                }
            }
        }

        fclose($handle);

        arsort($stats['ips']);
        arsort($stats['agents']);
        arsort($stats['paths']);

        return $stats;
    }

    /**
     * Print a ranked top-N table.
     */
    protected function printTable(array $data, int $top, string $labelHeader, string $countHeader): void
    {
        $rows = array_slice($data, 0, $top, preserve_keys: true);

        if (empty($rows)) {
            $this->line("   (none)");
            $this->newLine();
            return;
        }

        $rank = 1;
        foreach ($rows as $label => $count) {
            $this->line(sprintf("   %2d. %-60s %d", $rank++, $label, $count));
        }
        $this->newLine();
    }
}
