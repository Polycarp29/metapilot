<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BotFirewallService
{
    /**
     * Compute a threat score for the incoming request.
     * Score >= config('security.bot_score_threshold') → block.
     */
    public function scoreRequest(Request $request): int
    {
        $score     = 0;
        $userAgent = (string) $request->header('User-Agent', '');
        $ip        = $request->ip();
        $path      = $request->path();

        // ── Known attack tool: immediate maximum score ────────────────────
        $attackTools = config('security.bot_attack_tools', []);
        foreach ($attackTools as $tool) {
            if (stripos($userAgent, $tool) !== false) {
                return 100; // instant block, no further checks needed
            }
        }

        // ── Missing User-Agent ─────────────────────────────────────────────
        if (empty($userAgent)) {
            $score += 50;
        }

        // ── Missing Accept header (all real browsers send this) ────────────
        if (!$request->hasHeader('Accept')) {
            $score += 20;
        }

        // ── Missing Accept-Language ────────────────────────────────────────
        if (!$request->hasHeader('Accept-Language')) {
            $score += 10;
        }

        // ── Sensitive path probing ─────────────────────────────────────────
        $probePaths = config('security.bot_probe_paths', []);
        foreach ($probePaths as $probe) {
            if (str_starts_with('/' . ltrim($path, '/'), $probe)) {
                $score += 80;
                break;
            }
        }

        // ── Rate limit check ───────────────────────────────────────────────
        $rpm   = $this->getRequestRate($ip);
        $limit = config('security.bot_rate_limit_rpm', 60);

        if ($rpm > $limit) {
            $score += 60;
        } elseif ($rpm > ($limit * 0.5)) {
            // Warning zone: over 50% of limit
            $score += 30;
        }

        return $score;
    }

    /**
     * Return true if the User-Agent matches a known good bot.
     */
    public function isAllowlisted(string $userAgent): bool
    {
        if (empty($userAgent)) {
            return false;
        }

        $allowlist = config('security.bot_allowlist', []);
        foreach ($allowlist as $allowed) {
            if (stripos($userAgent, $allowed) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Return true if the IP is on the permanent blocklist.
     */
    public function isIpBlocked(string $ip): bool
    {
        return (bool) Cache::get("security:blocked_ip:{$ip}", false);
    }

    /**
     * Add an IP to the blocklist.
     *
     * @param  int  $ttlMinutes  0 = block forever
     */
    public function blockIp(string $ip, int $ttlMinutes = 0): void
    {
        if ($ttlMinutes === 0) {
            Cache::forever("security:blocked_ip:{$ip}", true);
        } else {
            Cache::put("security:blocked_ip:{$ip}", true, now()->addMinutes($ttlMinutes));
        }
    }

    /**
     * Remove an IP from the blocklist.
     */
    public function unblockIp(string $ip): void
    {
        Cache::forget("security:blocked_ip:{$ip}");
    }

    /**
     * Log a blocked request to the security channel.
     */
    public function recordBlock(Request $request, int $score, string $reason): void
    {
        Log::channel('security')->warning('Bot blocked', [
            'reason'     => $reason,
            'score'      => $score,
            'ip'         => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'method'     => $request->method(),
            'path'       => $request->path(),
            'referer'    => $request->header('Referer'),
            'timestamp'  => now()->toIso8601String(),
        ]);
    }

    /**
     * Track and return the request rate for a given IP (requests per minute).
     */
    public function getRequestRate(string $ip): int
    {
        $key   = "security:rate:{$ip}";
        $count = (int) Cache::get($key, 0);

        if ($count === 0) {
            // First request this minute: set with 60-second TTL
            Cache::put($key, 1, 60);
        } else {
            Cache::increment($key);
        }

        return $count + 1;
    }

    // =========================================================================
    // CDN-specific guards
    // =========================================================================

    public function checkTokenRateLimit(string $token): bool
    {
        $key   = 'security:token_rate:' . substr($token, 0, 8);
        $count = (int) Cache::get($key, 0);

        if ($count === 0) {
            Cache::put($key, 1, 60);
        } else {
            Cache::increment($key);
        }

        $limit = config('security.cdn_token_rate_limit_rpm', 300);
        return ($count + 1) > $limit;
    }

    public function checkDailyHitCap(int $pixelSiteId): bool
    {
        $key   = 'cdn:daily_hits:' . $pixelSiteId . ':' . now()->format('Y-m-d');
        $count = (int) Cache::get($key, 0);
        $cap   = config('security.cdn_max_daily_hits_per_site', 1000000);

        return $count >= $cap;
    }

    public function incrementDailyHitCounter(int $pixelSiteId): void
    {
        $key    = 'cdn:daily_hits:' . $pixelSiteId . ':' . now()->format('Y-m-d');
        $ttlSec = now()->secondsUntilEndOfDay() + 1;

        if (!Cache::has($key)) {
            Cache::put($key, 1, $ttlSec);
        } else {
            Cache::increment($key);
        }
    }

    // =========================================================================
    // Per-IP CDN guards — prevents single-IP flooding attacks
    // =========================================================================

    /**
     * 10-second burst window.
     * Returns true if the IP exceeds the burst threshold (default 20 req/10s).
     */
    public function checkIpBurst(string $ip): bool
    {
        $key   = 'cdn:ip_burst:' . hash('crc32b', $ip);
        $count = (int) Cache::get($key, 0);

        if ($count === 0) {
            Cache::put($key, 1, 10); // 10-second TTL
        } else {
            Cache::increment($key);
        }

        $limit = config('security.cdn_ip_burst_limit', 20);
        return ($count + 1) > $limit;
    }

    /**
     * 60-second sliding window per IP.
     * Returns true if the IP exceeds the per-minute threshold (default 60 req/min).
     */
    public function checkIpRateLimit(string $ip): bool
    {
        $key   = 'cdn:ip_rate:' . hash('crc32b', $ip);
        $count = (int) Cache::get($key, 0);

        if ($count === 0) {
            Cache::put($key, 1, 60); // 60-second TTL
        } else {
            Cache::increment($key);
        }

        $limit = config('security.cdn_ip_rate_limit_rpm', 60);
        return ($count + 1) > $limit;
    }

    /**
     * Record a rate-limit violation for escalating bans.
     * Violations are tracked with a 24-hour rolling window.
     *
     * @return int  Current violation count for this IP.
     */
    public function recordIpViolation(string $ip): int
    {
        $key   = 'cdn:ip_violations:' . hash('crc32b', $ip);
        $count = (int) Cache::get($key, 0);

        if ($count === 0) {
            Cache::put($key, 1, 86400); // 24-hour TTL
        } else {
            Cache::increment($key);
        }

        Log::channel('security')->warning('CDN IP violation', [
            'ip'         => $ip,
            'ip_hash'    => hash('crc32b', $ip),
            'violations' => $count + 1,
            'timestamp'  => now()->toIso8601String(),
        ]);

        return $count + 1;
    }

    /**
     * Apply an escalating temporary ban based on violation count.
     *
     * Schedule:
     *   1 violation  →  5 minutes
     *   2 violations → 30 minutes
     *   3 violations →  3 hours
     *   4 violations → 24 hours
     *   5+ violations → 7 days
     */
    public function autoBlockIpOnViolation(string $ip, int $violations): void
    {
        $schedule = [
            1 => 5,          // 5 minutes
            2 => 30,         // 30 minutes
            3 => 180,        // 3 hours
            4 => 1440,       // 24 hours
        ];

        $ttlMinutes = $schedule[$violations] ?? 10080; // 7 days for 5+

        $this->blockIp($ip, $ttlMinutes);

        Log::channel('security')->warning('CDN IP auto-blocked', [
            'ip'          => $ip,
            'ip_hash'     => hash('crc32b', $ip),
            'violations'  => $violations,
            'blocked_for' => $ttlMinutes . ' minutes',
            'timestamp'   => now()->toIso8601String(),
        ]);
    }

    /**
     * Get the current violation count for an IP (used by the ip-guard command).
     */
    public function getIpViolationCount(string $ip): int
    {
        return (int) Cache::get('cdn:ip_violations:' . hash('crc32b', $ip), 0);
    }

}
