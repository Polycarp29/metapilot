<?php

namespace App\Services\AI\Agent;

use App\Models\AdTrackEvent;
use App\Models\CdnError;
use App\Models\Organization;
use Illuminate\Support\Facades\DB;

/**
 * PixelIntelligenceService
 *
 * Dedicated to Pique AI only. Provides DB-aggregated pixel analytics
 * for context injection, system prompt rendering, and action dispatching.
 *
 *     Do NOT use this service from CdnTrackingController or any non-AI path.
 *     The analytics() endpoint in CdnTrackingController serves the Dev Tab UI.
 *     This service is the Pique-only intelligence bridge.
 */
class PixelIntelligenceService
{
    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * High-level traffic summary for the last N days.
     * Used by PiqueContextService to inject a quick snapshot into the system prompt.
     */
    public function getSummary(Organization $organization, int $days = 7, ?int $pixelSiteId = null): array
    {
        $now       = now();
        $start     = $now->copy()->subDays($days)->startOfDay();
        $prevStart = $now->copy()->subDays($days * 2)->startOfDay();

        $base = AdTrackEvent::where('organization_id', $organization->id)
            ->where('is_bot', false)
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId));

        // This period
        $currentStats = (clone $base)
            ->where('created_at', '>=', $start)
            ->selectRaw("
                COUNT(*) as total_hits,
                SUM(CASE WHEN duration_seconds >= 30 OR max_scroll_depth >= 50 THEN 1 ELSE 0 END) as engaged_hits,
                AVG(duration_seconds) as avg_dwell
            ")
            ->first();

        // Previous period (for delta)
        $prevHits = (clone $base)
            ->whereBetween('created_at', [$prevStart, $start])
            ->count();

        // Bounce rate: sessions with only 1 event in the period
        $sessionCounts = (clone $base)
            ->where('created_at', '>=', $start)
            ->select('session_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('session_id')
            ->get();

        $totalSessions  = $sessionCounts->count();
        $bounceSessions = $sessionCounts->where('cnt', 1)->count();
        $bounceRate     = $totalSessions > 0 ? round(($bounceSessions / $totalSessions) * 100, 1) : null;

        // Device split
        $deviceData = (clone $base)
            ->where('created_at', '>=', $start)
            ->select('device_type', DB::raw('COUNT(*) as cnt'))
            ->groupBy('device_type')
            ->get()
            ->keyBy('device_type');

        $totalForDevice = $deviceData->sum('cnt') ?: 1;
        $topDevice      = $deviceData->sortByDesc('cnt')->keys()->first() ?? 'Desktop';

        // Week delta
        $currentHits = (int) ($currentStats->total_hits ?? 0);
        $weekDelta   = $prevHits > 0
            ? round((($currentHits - $prevHits) / $prevHits) * 100, 1)
            : ($currentHits > 0 ? 100 : null);

        $engagementRate = $currentHits > 0
            ? round(($currentStats->engaged_hits / $currentHits) * 100, 1)
            : null;

        return [
            'period_days'      => $days,
            'total_hits'       => $currentHits,
            'prev_hits'        => $prevHits,
            'week_delta'       => $weekDelta,
            'engagement_rate'  => $engagementRate,
            'avg_dwell'        => round($currentStats->avg_dwell ?? 0),
            'bounce_rate'      => $bounceRate,
            'top_device'       => $topDevice,
            'device_pct'       => [
                'mobile'  => $totalForDevice > 0 ? round((($deviceData['Mobile']->cnt ?? 0) / $totalForDevice) * 100) : 0,
                'desktop' => $totalForDevice > 0 ? round((($deviceData['Desktop']->cnt ?? 0) / $totalForDevice) * 100) : 0,
                'tablet'  => $totalForDevice > 0 ? round((($deviceData['Tablet']->cnt ?? 0) / $totalForDevice) * 100) : 0,
            ],
        ];
    }

    /**
     * Top pages by traffic with engagement and bottleneck data.
     * Used by both the system prompt (top 5) and the page_journey action (top 10).
     */
    public function getTopPages(Organization $organization, int $limit = 5, int $days = 7, ?int $pixelSiteId = null): array
    {
        $start = now()->subDays($days)->startOfDay();
        $orgId = $organization->id;

        $rows = AdTrackEvent::where('organization_id', $orgId)
            ->where('is_bot', false)
            ->where('created_at', '>=', $start)
            ->whereNotNull('page_url')
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->selectRaw("
                page_url,
                COUNT(*) as total_hits,
                AVG(duration_seconds) as avg_dwell,
                AVG(max_scroll_depth) as avg_scroll,
                AVG(click_count) as avg_clicks
            ")
            ->groupBy('page_url')
            ->orderByDesc('total_hits')
            ->limit($limit)
            ->get();

        if ($rows->isEmpty()) return [];

        // Bounce rate per page
        $urls     = $rows->pluck('page_url')->toArray();
        $bounces  = AdTrackEvent::where('organization_id', $orgId)
            ->where('is_bot', false)
            ->where('created_at', '>=', $start)
            ->whereIn('page_url', $urls)
            ->select('page_url', 'session_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('page_url', 'session_id')
            ->get()
            ->groupBy('page_url')
            ->map(function ($sessions) {
                $total  = $sessions->count();
                $bounced = $sessions->where('cnt', 1)->count();
                return $total > 0 ? round(($bounced / $total) * 100, 1) : 0;
            });

        // Error counts per page
        $errors = CdnError::where('organization_id', $orgId)
            ->whereIn('url', $urls)
            ->select('url', DB::raw('COUNT(*) as error_count'), DB::raw('AVG(load_time_ms) as avg_load_ms'))
            ->groupBy('url')
            ->get()
            ->keyBy('url');

        return $rows->map(function ($row) use ($bounces, $errors) {
            $avgDwell    = (float) ($row->avg_dwell ?? 0);
            $avgScroll   = (float) ($row->avg_scroll ?? 0);
            $avgClicks   = (float) ($row->avg_clicks ?? 0);
            $bounceRate  = $bounces[$row->page_url] ?? 0;
            $errorCount  = (int) ($errors[$row->page_url]->error_count ?? 0);
            $avgLoadMs   = (int) ($errors[$row->page_url]->avg_load_ms ?? 0);

            // Engagement score (0–100)
            $dwellScore       = min(($avgDwell / 60) * 30, 30);
            $scrollScore      = ($avgScroll / 100) * 30;
            $interactionScore = min(($avgClicks / 5) * 25, 25);
            $bounceScore      = (1 - ($bounceRate / 100)) * 15;
            $engagementScore  = (int) round($dwellScore + $scrollScore + $interactionScore + $bounceScore);

            // Bottleneck score (0–100, higher = worse)
            $bottleneckScore = (int) round(
                ($bounceRate / 100 * 40) +
                (max(0, (1 - $avgDwell / 60)) * 30) +
                min($errorCount * 5, 20) +
                ($avgLoadMs > 3000 ? 10 : ($avgLoadMs > 1500 ? 5 : 0))
            );

            $recs = [];
            if ($bounceRate > 60)   $recs[] = 'High bounce rate — improve above-fold content';
            if ($avgDwell < 20)     $recs[] = 'Low dwell time — add engaging content or video';
            if ($avgClicks < 1)     $recs[] = 'Low interaction — add clear CTAs or internal links';
            if ($errorCount > 0)    $recs[] = "{$errorCount} JS error(s) — check browser console";
            if ($avgLoadMs > 3000)  $recs[] = 'Slow page load (' . round($avgLoadMs / 1000, 1) . 's) — optimise images & scripts';

            try {
                $path = parse_url($row->page_url, PHP_URL_PATH) ?: '/';
            } catch (\Throwable $e) {
                $path = $row->page_url;
            }

            return [
                'url'              => $row->page_url,
                'path'             => $path,
                'total_hits'       => (int) $row->total_hits,
                'avg_dwell'        => (int) $avgDwell,
                'avg_scroll'       => (int) $avgScroll,
                'bounce_rate'      => $bounceRate,
                'engagement_score' => $engagementScore,
                'bottleneck_score' => $bottleneckScore,
                'recommendations'  => $recs,
            ];
        })->toArray();
    }

    /**
     * Pages gaining and losing traffic (7d vs prior 7d).
     * Used by system prompt and traffic_velocity action.
     */
    public function getTrendVelocity(Organization $organization, ?int $pixelSiteId = null): array
    {
        $rows = AdTrackEvent::where('organization_id', $organization->id)
            ->where('is_bot', false)
            ->whereNotNull('page_url')
            ->where('created_at', '>=', now()->subDays(14)->startOfDay())
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->selectRaw("
                page_url,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) as last7,
                SUM(CASE WHEN created_at < NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) as prev7
            ")
            ->groupBy('page_url')
            ->having('last7', '>', 0)
            ->get()
            ->map(function ($r) {
                $delta = $r->prev7 > 0
                    ? round((($r->last7 - $r->prev7) / $r->prev7) * 100, 1)
                    : ($r->last7 > 0 ? 100.0 : 0.0);
                try {
                    $path = parse_url($r->page_url, PHP_URL_PATH) ?: '/';
                } catch (\Throwable $e) {
                    $path = $r->page_url;
                }
                return [
                    'url'       => $r->page_url,
                    'path'      => $path,
                    'last7'     => (int) $r->last7,
                    'prev7'     => (int) $r->prev7,
                    'delta_pct' => $delta,
                ];
            });

        return [
            'rising'  => $rows->filter(fn($r) => $r['delta_pct'] > 0)
                              ->sortByDesc('delta_pct')
                              ->take(5)
                              ->values()
                              ->toArray(),
            'falling' => $rows->filter(fn($r) => $r['delta_pct'] < 0)
                              ->sortBy('delta_pct')
                              ->take(5)
                              ->values()
                              ->toArray(),
        ];
    }

    /**
     * Most common multi-page session paths in the last 7 days.
     * Used by session_journey action in PiqueActionDispatcher.
     * Limited to top 500 sessions to keep PHP memory safe.
     */
    public function getJourneyFlows(Organization $organization, ?int $pixelSiteId = null): array
    {
        $sessions = AdTrackEvent::where('organization_id', $organization->id)
            ->where('is_bot', false)
            ->where('created_at', '>=', now()->subDays(7)->startOfDay())
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->select('session_id', 'page_url', 'created_at')
            ->orderBy('session_id')
            ->orderBy('created_at')
            ->limit(3000) // cap rows, not sessions
            ->get()
            ->groupBy('session_id')
            ->filter(fn($pages) => $pages->count() >= 2) // only multi-page sessions
            ->take(500);

        $transitions = [];
        foreach ($sessions as $pages) {
            $urls = $pages->pluck('page_url')->toArray();
            for ($i = 0; $i < count($urls) - 1; $i++) {
                try {
                    $from = parse_url($urls[$i], PHP_URL_PATH) ?: $urls[$i];
                    $to   = parse_url($urls[$i + 1], PHP_URL_PATH) ?: $urls[$i + 1];
                } catch (\Throwable $e) {
                    continue;
                }
                $key = "{$from} → {$to}";
                $transitions[$key] = ($transitions[$key] ?? 0) + 1;
            }
        }

        arsort($transitions);
        $top = array_slice($transitions, 0, 8, true);

        $flows = [];
        foreach ($top as $path => $count) {
            $flows[] = ['path' => $path, 'count' => $count];
        }

        return [
            'multi_page_sessions' => $sessions->count(),
            'top_flows'           => $flows,
        ];
    }

    /**
     * Device split percentages for the last 7 days.
     * Used by device_split action.
     */
    public function getDeviceSplit(Organization $organization, ?int $pixelSiteId = null): array
    {
        $rows = AdTrackEvent::where('organization_id', $organization->id)
            ->where('is_bot', false)
            ->where('created_at', '>=', now()->subDays(7)->startOfDay())
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->select('device_type', DB::raw('COUNT(*) as cnt'))
            ->groupBy('device_type')
            ->get()
            ->keyBy('device_type');

        $total = $rows->sum('cnt') ?: 1;

        return [
            'mobile'  => [
                'count' => (int) ($rows['Mobile']->cnt ?? 0),
                'pct'   => round((($rows['Mobile']->cnt ?? 0) / $total) * 100),
            ],
            'desktop' => [
                'count' => (int) ($rows['Desktop']->cnt ?? 0),
                'pct'   => round((($rows['Desktop']->cnt ?? 0) / $total) * 100),
            ],
            'tablet'  => [
                'count' => (int) ($rows['Tablet']->cnt ?? 0),
                'pct'   => round((($rows['Tablet']->cnt ?? 0) / $total) * 100),
            ],
            'total'   => (int) $total,
        ];
    }

    /**
     * Full detail for a single URL.
     * Used by page_detail action in PiqueActionDispatcher.
     */
    public function getPageDetail(Organization $organization, string $url, ?int $pixelSiteId = null): array
    {
        $start = now()->subDays(30)->startOfDay();

        $stats = AdTrackEvent::where('organization_id', $organization->id)
            ->where('page_url', $url)
            ->where('is_bot', false)
            ->where('created_at', '>=', $start)
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->selectRaw("
                COUNT(*) as total_hits,
                AVG(duration_seconds) as avg_dwell,
                AVG(max_scroll_depth) as avg_scroll,
                AVG(click_count) as avg_clicks,
                SUM(CASE WHEN duration_seconds >= 30 OR max_scroll_depth >= 50 THEN 1 ELSE 0 END) as engaged_hits
            ")
            ->first();

        $deviceRows = AdTrackEvent::where('organization_id', $organization->id)
            ->where('page_url', $url)
            ->where('is_bot', false)
            ->where('created_at', '>=', $start)
            ->select('device_type', DB::raw('COUNT(*) as cnt'))
            ->groupBy('device_type')
            ->get()
            ->keyBy('device_type');

        $countryRows = AdTrackEvent::where('organization_id', $organization->id)
            ->where('page_url', $url)
            ->where('is_bot', false)
            ->where('created_at', '>=', $start)
            ->select('country_code', DB::raw('COUNT(*) as cnt'))
            ->groupBy('country_code')
            ->orderByDesc('cnt')
            ->limit(5)
            ->get();

        $velocity = $this->getTrendVelocity($organization, $pixelSiteId);
        $risingMatch  = collect($velocity['rising'])->firstWhere('url', $url);
        $fallingMatch = collect($velocity['falling'])->firstWhere('url', $url);

        $errors = CdnError::where('organization_id', $organization->id)
            ->where('url', $url)
            ->selectRaw('COUNT(*) as count, AVG(load_time_ms) as avg_load_ms')
            ->first();

        $totalHits = (int) ($stats->total_hits ?? 0);

        return [
            'url'             => $url,
            'total_hits'      => $totalHits,
            'avg_dwell'       => (int) ($stats->avg_dwell ?? 0),
            'avg_scroll'      => (int) ($stats->avg_scroll ?? 0),
            'avg_clicks'      => round($stats->avg_clicks ?? 0, 1),
            'engagement_rate' => $totalHits > 0 ? round(($stats->engaged_hits / $totalHits) * 100, 1) : 0,
            'velocity'        => $risingMatch ? ['trend' => 'rising', 'delta_pct' => $risingMatch['delta_pct']]
                : ($fallingMatch ? ['trend' => 'falling', 'delta_pct' => $fallingMatch['delta_pct']]
                : ['trend' => 'stable', 'delta_pct' => 0]),
            'by_device'       => [
                'mobile'  => (int) ($deviceRows['Mobile']->cnt  ?? 0),
                'desktop' => (int) ($deviceRows['Desktop']->cnt ?? 0),
                'tablet'  => (int) ($deviceRows['Tablet']->cnt  ?? 0),
            ],
            'top_countries'   => $countryRows->map(fn($r) => ['code' => $r->country_code, 'hits' => (int) $r->cnt])->toArray(),
            'error_count'     => (int) ($errors->count ?? 0),
            'avg_load_ms'     => (int) ($errors->avg_load_ms ?? 0),
        ];
    }
}
