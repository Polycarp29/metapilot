<?php

namespace App\Http\Middleware;

use App\Services\BotFirewallService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BotProtectionMiddleware
{
    public function __construct(protected BotFirewallService $firewall) {}

    /**
     * Advanced bot firewall with multi-signal fingerprint scoring.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ip        = $request->ip();
        $userAgent = (string) $request->header('User-Agent', '');

        // ── 1. Permanent IP blocklist check (fastest gate) ────────────────
        if ($this->firewall->isIpBlocked($ip)) {
            $this->firewall->recordBlock($request, 999, 'ip_blocklist');
            return $this->blocked('Your IP has been blocked due to policy violations.');
        }

        // ── 2. Allowlist: known good crawlers always pass ─────────────────
        if ($this->firewall->isAllowlisted($userAgent)) {
            return $next($request);
        }

        // ── 3. Fingerprint scoring ─────────────────────────────────────────
        $score     = $this->firewall->scoreRequest($request);
        $threshold = config('security.bot_score_threshold', 80);

        if ($score >= $threshold) {
            // Auto-block the IP for 60 minutes on repeated high scores
            $reason = $this->classifyReason($score, $userAgent, $request->path());
            $this->firewall->blockIp($ip, 60);
            $this->firewall->recordBlock($request, $score, $reason);

            return $this->blocked('Automated access is restricted.');
        }

        return $next($request);
    }

    /**
     * Return a standardised 403 response.
     */
    protected function blocked(string $message): Response
    {
        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json(['error' => $message], 403);
        }

        return response($message, 403);
    }

    /**
     * Classify the primary block reason for logging clarity.
     */
    protected function classifyReason(int $score, string $userAgent, string $path): string
    {
        if ($score >= 100) {
            return 'attack_tool_ua';
        }

        $probePaths = config('security.bot_probe_paths', []);
        foreach ($probePaths as $probe) {
            if (str_starts_with('/' . ltrim($path, '/'), $probe)) {
                return 'path_probe';
            }
        }

        if (empty($userAgent)) {
            return 'missing_user_agent';
        }

        return 'fingerprint_score';
    }
}
