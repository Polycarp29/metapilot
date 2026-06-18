<?php

namespace App\Jobs;

use App\Models\Organization;
use App\Models\PixelSite;
use App\Services\CdnAnalyticsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * PrefetchCdnAnalyticsJob
 *
 * Runs in the background every 10 minutes to pre-warm the Redis cache
 * for every organization that has at least one verified CDN pixel.
 *
 * Flow:
 *   Scheduler (every 10 min)
 *     → dispatches PrefetchCdnAnalyticsJob per org
 *     → fetchDataForOrg() pulls SQL aggregates
 *     → CdnAnalyticsService::analyze() calls Python
 *     → result stored in Redis (TTL 65 min — always fresh before expiry)
 *
 * The dashboard controller reads exclusively from this pre-warmed cache.
 * If the cache is not yet populated (first ever load), it falls back to
 * on-demand computation.
 */
class PrefetchCdnAnalyticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Allow up to 3 automatic retries on failure.
     */
    public int $tries = 3;

    /**
     * Timeout per attempt (seconds). The Python engine has a 15s timeout
     * internally, plus SQL fetching — 120s is comfortable.
     */
    public int $timeout = 120;

    public function __construct(
        public int  $orgId,
        public ?int $pixelSiteId = null
    ) {}


    public function handle(CdnAnalyticsService $engine): void
    {
        $label = "org:{$this->orgId}" . ($this->pixelSiteId ? "/site:{$this->pixelSiteId}" : '');

        Log::info("[CDN Prefetch] Starting for {$label}");

        try {
            // ── Fetch SQL data ────────────────────────────────────────────────
            $payload = $engine->fetchDataForOrg(
                orgId:        $this->orgId,
                pixelSiteId:  $this->pixelSiteId,
                excludeBots:  false,
                pagesPage:    1,
                pagesPerPage: 10
            );

            // Campaign attribution is pure SQL — Python doesn't process it.
            // Extract before sending to Python, then re-merge after.
            $campaignAttribution = $payload['campaign_attribution'] ?? [];
            unset($payload['campaign_attribution']);

            // ── Call Python analytics engine ──────────────────────────────────
            $result = $engine->analyze($payload);
            $result['campaign_attribution'] = $campaignAttribution;

            // ── Store in Redis with a 65-min TTL ─────────────────────────────
            // 65 minutes > 10-minute re-schedule interval, so the cache is
            // always valid between prefetch cycles.
            $cacheKey = CdnAnalyticsService::cacheKey(
                $this->orgId,
                $this->pixelSiteId
            );

            Cache::put($cacheKey, $result, now()->addMinutes(65));

            Log::info(
                "[CDN Prefetch] Cached {$label} → key [{$cacheKey}] " .
                "({$result['path_intelligence']['raw_page_count']} raw → " .
                "{$result['path_intelligence']['canonical_page_count']} canonical pages)"
            );

        } catch (\Throwable $e) {
            // ── Graceful degradation for Python engine being down ─────────────
            // When the engine is simply unreachable (cURL error 7, connection
            // refused, etc.) we log a warning and return cleanly — no failed_jobs
            // entry. The scheduler dispatches a fresh job every 10 minutes, so
            // recovery is fully automatic once the engine comes back up.
            if ($this->isPythonEngineDown($e)) {
                Log::warning("[CDN Prefetch] Python engine unreachable for {$label} — skipping (auto-retries next cycle).", [
                    'error' => $e->getMessage(),
                ]);
                return;
            }

            // Unexpected errors (DB failures, code bugs) still go to failed_jobs
            // so they can be investigated.
            Log::error("[CDN Prefetch] Unexpected failure for {$label}: " . $e->getMessage());
            $this->fail($e);
        }
    }

    /**
     * Detect Python engine connectivity failures vs. real application errors.
     * cURL error 7 = "Failed to connect" (connection refused / server not up).
     */
    private function isPythonEngineDown(\Throwable $e): bool
    {
        $msg = strtolower($e->getMessage());

        return str_contains($msg, 'curl error 7')
            || str_contains($msg, 'failed to connect')
            || str_contains($msg, 'connection refused')
            || str_contains($msg, "couldn't connect to server")
            || str_contains($msg, 'analytics engine is unavailable')
            || str_contains($msg, 'analytics engine is currently busy');
    }
}
