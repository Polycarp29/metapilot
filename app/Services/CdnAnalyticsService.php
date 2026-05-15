<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * CdnAnalyticsService
 *
 * HTTP client wrapper for the Python analytics-engine microservice.
 * Responsible for:
 *   1. Sending pre-aggregated CDN data to POST /analyze/cdn
 *   2. Handling timeouts, retries, and fallback to stale cache
 *   3. Keeping all microservice coupling out of the controller
 */
class CdnAnalyticsService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.python_engine.url', 'http://localhost:8001'), '/');
    }

    /**
     * Send pre-aggregated CDN data to Python and return the enriched payload.
     *
     * @param  array  $payload  Keys: org_id, site_id, daily_summary, page_stats,
     *                          session_counts, sparkline_raw, velocity_raw, geo_raw,
     *                          referrers, errors, keywords, meta
     * @param  string $cacheKey  Used only for stale-cache fallback on failure
     * @return array
     *
     * @throws \RuntimeException  If Python is unavailable AND no stale cache exists
     */
    public function analyze(array $payload, string $cacheKey = ''): array
    {
        try {
            $response = Http::timeout(15)
                ->retry(2, 200, fn($e) => !($e instanceof \Illuminate\Http\Client\ConnectionException))
                ->post("{$this->baseUrl}/analyze/cdn", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('CDN analytics engine returned non-200', [
                'status' => $response->status(),
                'body'   => substr($response->body(), 0, 500),
            ]);

            throw new \RuntimeException("Engine returned HTTP {$response->status()}");

        } catch (\Throwable $e) {
            Log::error('CDN analytics engine unavailable', ['error' => $e->getMessage()]);

            // ── Stale cache fallback ─────────────────────────────────────────
            // If the engine is temporarily down, serve the previous result
            // rather than crashing the dashboard.
            if ($cacheKey && Cache::has($cacheKey)) {
                Log::info("CDN analytics: serving stale cache for key [{$cacheKey}]");
                return Cache::get($cacheKey);
            }

            throw new \RuntimeException(
                'CDN analytics engine is unavailable and no cached result exists.',
                0,
                $e
            );
        }
    }

    /**
     * Fetch all pre-aggregated CDN data from the database for a given org.
     *
     * Extracted from the controller so the prefetch job can call it
     * without needing a Request object. Returns the raw payload array
     * ready to be POSTed to Python's /analyze/cdn.
     *
     * @param  int       $orgId
     * @param  int|null  $pixelSiteId   null = all sites for the org
     * @param  bool      $excludeBots
     * @param  int       $pagesPage
     * @param  int       $pagesPerPage
     * @return array
     */
    public function fetchDataForOrg(
        int  $orgId,
        ?int $pixelSiteId   = null,
        bool $excludeBots   = false,
        int  $pagesPage     = 1,
        int  $pagesPerPage  = 10
    ): array {
        $thirtyDaysAgo   = now()->subDays(29)->startOfDay();
        $fourteenDaysAgo = now()->subDays(13)->startOfDay();
        $pagesOffset     = ($pagesPage - 1) * $pagesPerPage;

        $base = \App\Models\AdTrackEvent::where('organization_id', $orgId)
            ->when($pixelSiteId, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->where('created_at', '>=', $thirtyDaysAgo);

        if ($excludeBots) $base->where('is_bot', false);

        // 1. Daily summary
        $dailySummary = (clone $base)
            ->selectRaw("SUBSTRING(created_at, 1, 10) as date, COUNT(*) as total,
                SUM(CASE WHEN (gclid IS NOT NULL OR utm_campaign IS NOT NULL OR google_campaign_id IS NOT NULL) THEN 1 ELSE 0 END) as ad_hits")
            ->groupByRaw("SUBSTRING(created_at, 1, 10)")
            ->orderByRaw("SUBSTRING(created_at, 1, 10)")
            ->get()->toArray();

        // 2. Top page stats
        $pagesTotal = (clone $base)->whereNotNull('page_url')->distinct()->count('page_url');

        $pageStats = (clone $base)
            ->whereNotNull('page_url')
            ->selectRaw("page_url,
                COUNT(*) as total_hits,
                AVG(duration_seconds) as avg_duration,
                AVG(max_scroll_depth) as avg_scroll,
                AVG(click_count) as avg_clicks,
                SUM(CASE WHEN (gclid IS NOT NULL OR utm_campaign IS NOT NULL OR google_campaign_id IS NOT NULL) THEN 1 ELSE 0 END) as ad_hits,
                SUM(CASE WHEN created_at >= CURDATE() THEN 1 ELSE 0 END) as today_count,
                SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND created_at < CURDATE() THEN 1 ELSE 0 END) as yesterday_count")
            ->groupBy('page_url')
            ->orderByDesc('total_hits')
            ->offset($pagesOffset)
            ->limit($pagesPerPage)
            ->get()->toArray();

        $topPageUrls = array_column($pageStats, 'page_url');

        // 3. Session counts (for bounce rate)
        $sessionCounts = [];
        if (!empty($topPageUrls)) {
            $sessionCounts = \Illuminate\Support\Facades\DB::table('ad_track_events')
                ->selectRaw('page_url, session_id, COUNT(*) as hit_count')
                ->where('organization_id', $orgId)
                ->whereNotNull('page_url')
                ->whereIn('page_url', $topPageUrls)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
                ->when($excludeBots,  fn($q) => $q->where('is_bot', false))
                ->groupBy('page_url', 'session_id')
                ->get()->toArray();
        }

        // 4. Sparkline (14-day per page)
        $sparklineRaw = [];
        if (!empty($topPageUrls)) {
            $sparklineRaw = \App\Models\AdTrackEvent::where('organization_id', $orgId)
                ->when($pixelSiteId, fn($q, $id) => $q->where('pixel_site_id', $id))
                ->whereIn('page_url', $topPageUrls)
                ->where('created_at', '>=', $fourteenDaysAgo)
                ->selectRaw("page_url, DATE(created_at) as date, COUNT(*) as cnt")
                ->groupBy('page_url', 'date')
                ->get()->toArray();
        }

        // 5. Velocity
        $velocityRaw = \App\Models\AdTrackEvent::where('organization_id', $orgId)
            ->when($pixelSiteId, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereNotNull('page_url')
            ->where('created_at', '>=', $fourteenDaysAgo)
            ->selectRaw("page_url,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) as last7,
                SUM(CASE WHEN created_at < NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) as prev7")
            ->groupBy('page_url')
            ->having('last7', '>', 0)
            ->get()->toArray();

        // 6. Geo
        $geoRaw = \App\Models\AdTrackEvent::where('organization_id', $orgId)
            ->when($pixelSiteId, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("country_code, city, device_type, COUNT(*) as count")
            ->groupBy('country_code', 'city', 'device_type')
            ->get()->toArray();

        // 7. Referrers
        $referrers = \App\Models\AdTrackEvent::where('organization_id', $orgId)
            ->when($pixelSiteId, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereNotNull('referrer')->where('referrer', '!=', '')
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("referrer, COUNT(*) as count")
            ->groupBy('referrer')
            ->orderByDesc('count')
            ->limit(50)
            ->get()->toArray();

        // 8. Errors
        $errors = \App\Models\CdnError::where('organization_id', $orgId)
            ->when($pixelSiteId, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->select(['url', 'error_type', 'load_time_ms', 'created_at'])
            ->get()->toArray();

        // 9. Keywords
        $keywords = \App\Models\KeywordResearch::where('organization_id', $orgId)
            ->select(['query', 'intent'])
            ->get()->toArray();

        return [
            'org_id'         => $orgId,
            'site_id'        => $pixelSiteId,
            'daily_summary'  => $dailySummary,
            'page_stats'     => $pageStats,
            'session_counts' => array_map(fn($r) => (array) $r, $sessionCounts),
            'sparkline_raw'  => $sparklineRaw,
            'velocity_raw'   => $velocityRaw,
            'geo_raw'        => $geoRaw,
            'referrers'      => $referrers,
            'errors'         => $errors,
            'keywords'       => $keywords,
            'meta'           => [
                'today'          => now()->format('Y-m-d'),
                'yesterday'      => now()->subDay()->format('Y-m-d'),
                'pages_page'     => $pagesPage,
                'pages_per_page' => $pagesPerPage,
                'pages_total'    => $pagesTotal,
                'normalize_ids'  => false,
            ],
        ];
    }

    /**
     * Build the standard cache key for an org/site combination.
     * Shared between the controller, the prefetch job, and the service.
     */
    public static function cacheKey(
        int  $orgId,
        ?int $siteId      = null,
        bool $excludeBots = false,
        int  $page        = 1,
        int  $perPage     = 10
    ): string {
        return "cdn_analytics_v4_{$orgId}_site_" . ($siteId ?? 'all') . '_' .
               ($excludeBots ? 'nobots' : 'all') . "_p{$page}_pp{$perPage}";
    }

    /**
     * Ping the Python engine health endpoint.
     */
    public function isHealthy(): bool
    {
        try {
            return Http::timeout(3)
                ->get("{$this->baseUrl}/health/cdn")
                ->successful();
        } catch (\Throwable) {
            return false;
        }
    }
}
