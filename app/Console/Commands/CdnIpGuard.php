<?php

namespace App\Console\Commands;

use App\Services\BotFirewallService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class CdnIpGuard extends Command
{
    protected $signature = 'cdn:ip-guard
        {--list          : Show all currently blocked IPs}
        {--violations    : Show IPs with active violations (not yet permanently blocked)}
        {--block=        : Manually perma-block an IP address}
        {--unblock=      : Manually unblock an IP address}
        {--status=       : Check the current status of a specific IP}';

    protected $description = 'Manage the CDN IP safety guard — view blocked IPs, check violations, block/unblock manually.';

    public function handle(BotFirewallService $firewall): int
    {
        // ── Manual block ─────────────────────────────────────────────────────
        if ($ip = $this->option('block')) {
            $firewall->blockIp($ip, 0); // permanent
            $this->info("✅  IP <fg=yellow>{$ip}</> has been permanently blocked.");
            $this->line("   To unblock: <fg=cyan>php artisan cdn:ip-guard --unblock={$ip}</>");
            return self::SUCCESS;
        }

        // ── Manual unblock ───────────────────────────────────────────────────
        if ($ip = $this->option('unblock')) {
            $firewall->unblockIp($ip);
            // Also clear violation counter so the IP gets a fresh start
            Cache::forget('cdn:ip_violations:' . hash('crc32b', $ip));
            $this->info("✅  IP <fg=yellow>{$ip}</> has been unblocked and violations reset.");
            return self::SUCCESS;
        }

        // ── Status check for a specific IP ───────────────────────────────────
        if ($ip = $this->option('status')) {
            $blocked    = $firewall->isIpBlocked($ip);
            $violations = $firewall->getIpViolationCount($ip);
            $burstKey   = 'cdn:ip_burst:' . hash('crc32b', $ip);
            $rateKey    = 'cdn:ip_rate:' . hash('crc32b', $ip);
            $burstCount = (int) Cache::get($burstKey, 0);
            $rateCount  = (int) Cache::get($rateKey, 0);

            $this->newLine();
            $this->line("  <fg=white;options=bold>IP Status Report:</> <fg=yellow>{$ip}</>");
            $this->line("  ─────────────────────────────────────────");
            $this->line("  Blocked:          " . ($blocked ? '<fg=red;options=bold>YES</>' : '<fg=green>No</>'));
            $this->line("  Violations (24h): <fg=yellow>{$violations}</>");
            $this->line("  Burst (10s):      <fg=cyan>{$burstCount}</> / " . config('security.cdn_ip_burst_limit', 20));
            $this->line("  Rate (60s):       <fg=cyan>{$rateCount}</> / " . config('security.cdn_ip_rate_limit_rpm', 60));
            $this->line("  IP Hash:          " . hash('crc32b', $ip));
            $this->newLine();

            if ($violations >= 3) {
                $this->warn("  ⚠  This IP has {$violations} violations and may be auto-blocked soon.");
            }

            return self::SUCCESS;
        }

        // ── List blocked IPs ─────────────────────────────────────────────────
        if ($this->option('list')) {
            $this->info('🔒  Scanning for blocked IPs...');
            $this->newLine();

            $blockedIps = $this->scanCacheKeys('security:blocked_ip:*');

            if (empty($blockedIps)) {
                $this->line('  <fg=green>No IPs are currently blocked.</>');
            } else {
                $rows = [];
                foreach ($blockedIps as $key) {
                    $ip = str_replace('security:blocked_ip:', '', $key);
                    $violations = $firewall->getIpViolationCount($ip);
                    $rows[] = [$ip, $violations, '🔴 Blocked'];
                }
                $this->table(['IP Address', 'Violations (24h)', 'Status'], $rows);
                $this->info('  Total blocked: ' . count($rows));
            }

            $this->newLine();
            return self::SUCCESS;
        }

        // ── List IPs with violations ─────────────────────────────────────────
        if ($this->option('violations')) {
            $this->info('⚠  Scanning for IPs with active violations...');
            $this->newLine();

            $violationKeys = $this->scanCacheKeys('cdn:ip_violations:*');

            if (empty($violationKeys)) {
                $this->line('  <fg=green>No IPs have active violations.</>');
            } else {
                $rows = [];
                foreach ($violationKeys as $key) {
                    $hash  = str_replace('cdn:ip_violations:', '', $key);
                    $count = (int) Cache::get($key, 0);
                    if ($count > 0) {
                        $status = $count >= 5 ? '🔴 Critical' : ($count >= 3 ? '🟡 Warning' : '🟢 Low');
                        $rows[] = [$hash, $count, $status];
                    }
                }

                usort($rows, fn($a, $b) => $b[1] <=> $a[1]); // sort by violations desc

                $this->table(['IP Hash', 'Violations (24h)', 'Severity'], $rows);
                $this->info('  Total IPs with violations: ' . count($rows));
            }

            $this->newLine();
            return self::SUCCESS;
        }

        // ── Default: show summary ────────────────────────────────────────────
        $this->newLine();
        $this->line('  <fg=white;options=bold>CDN IP Safety Guard — Status</>');
        $this->line('  ═══════════════════════════════════════════════');
        $this->newLine();

        $blockedCount    = count($this->scanCacheKeys('security:blocked_ip:*'));
        $violationCount  = count($this->scanCacheKeys('cdn:ip_violations:*'));

        $this->line("  Blocked IPs:          <fg=yellow>{$blockedCount}</>");
        $this->line("  IPs with violations:  <fg=yellow>{$violationCount}</>");
        $this->line("  Rate limit (per-IP):  <fg=cyan>" . config('security.cdn_ip_rate_limit_rpm', 60) . " req/min</>");
        $this->line("  Burst limit (per-IP): <fg=cyan>" . config('security.cdn_ip_burst_limit', 20) . " req/10s</>");
        $this->line("  Token rate limit:     <fg=cyan>" . config('security.cdn_token_rate_limit_rpm', 300) . " req/min</>");
        $this->line("  Daily site cap:       <fg=cyan>" . number_format(config('security.cdn_max_daily_hits_per_site', 1000000)) . " hits</>");

        $this->newLine();
        $this->line('  <fg=gray>Usage:</>');
        $this->line('    php artisan cdn:ip-guard --list');
        $this->line('    php artisan cdn:ip-guard --violations');
        $this->line('    php artisan cdn:ip-guard --status=1.2.3.4');
        $this->line('    php artisan cdn:ip-guard --block=1.2.3.4');
        $this->line('    php artisan cdn:ip-guard --unblock=1.2.3.4');
        $this->newLine();

        return self::SUCCESS;
    }

    /**
     * Scan Redis for cache keys matching a pattern.
     * Falls back to an empty array for non-Redis drivers.
     */
    protected function scanCacheKeys(string $pattern): array
    {
        $driver = config('cache.default');

        if ($driver === 'redis') {
            try {
                $prefix = config('cache.prefix', config('database.redis.options.prefix', ''));
                $keys   = [];
                $cursor = 0;

                do {
                    [$cursor, $results] = Redis::scan($cursor, 'MATCH', $prefix . $pattern, 'COUNT', 100);
                    foreach ($results as $key) {
                        $keys[] = str_replace($prefix, '', $key);
                    }
                } while ($cursor != 0);

                return array_unique($keys);
            } catch (\Throwable $e) {
                $this->warn("  Redis scan failed: {$e->getMessage()}");
                return [];
            }
        }

        // For file/array/database drivers, we can't scan — inform the user
        if ($this->option('list') || $this->option('violations')) {
            $this->warn("  Cache driver '{$driver}' does not support key scanning. Use --status=<IP> for individual lookups.");
        }

        return [];
    }
}
