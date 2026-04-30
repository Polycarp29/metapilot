<?php

namespace App\Http\Controllers;

use App\Models\AdTrackEvent;
use App\Models\CdnError;
use App\Models\KeywordResearch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DeepAnalyticsController extends Controller
{
    /**
     * Render the per-path deep-dive page.
     * Accepts ?path=<url>&site_id=<id> query params passed from DevelopersTab.
     */
    public function view(Request $request)
    {
        $organization = $request->user()->currentOrganization();

        $pixelSites = $organization
            ? $organization->pixelSites()->get(['id', 'label', 'ads_site_token'])->toArray()
            : [];

        return Inertia::render('Analytics/Partials/Signals', [
            'organization'  => $organization,
            'pixelSites'    => $pixelSites,
            'initialPath'   => $request->get('path'),
            'initialSiteId' => $request->get('site_id') ? (int) $request->get('site_id') : null,
        ]);
    }

    /**
     * Deep per-path analytics API.
     *
     * Query params:
     *   path          — full page URL to analyse (required)
     *   pixel_site_id — filter to a specific pixel site (optional)
     *   period        — days back, default 30 (max 90)
     *   exclude_bots  — boolean, default true
     */
    public function pathAnalysis(Request $request)
    {
        $request->validate(['path' => 'required|string|max:2048']);

        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $orgId       = $organization->id;
        $path        = $request->get('path');
        $siteId      = $request->get('pixel_site_id') ? (int) $request->get('pixel_site_id') : null;
        $period      = min(90, max(7, (int) $request->get('period', 30)));
        $excludeBots = $request->boolean('exclude_bots', true);
        $since       = now()->subDays($period - 1)->startOfDay();

        $cacheKey = "path_analysis_{$orgId}_{$siteId}_{$period}_{$excludeBots}_" . md5($path);

        return Cache::remember($cacheKey, 300, function () use (
            $orgId, $path, $siteId, $period, $excludeBots, $since
        ) {
            // ── Base scope ────────────────────────────────────────────────
            $base = AdTrackEvent::where('organization_id', $orgId)
                ->where('page_url', $path)
                ->when($siteId,      fn($q) => $q->where('pixel_site_id', $siteId))
                ->when($excludeBots, fn($q) => $q->where('is_bot', false))
                ->where('created_at', '>=', $since);

            // ── 1. Summary stats ──────────────────────────────────────────
            $summary = (clone $base)->selectRaw("
                COUNT(*)                  AS total_visits,
                COUNT(DISTINCT session_id) AS unique_sessions,
                AVG(duration_seconds)     AS avg_dwell,
                AVG(max_scroll_depth)     AS avg_scroll,
                AVG(click_count)          AS avg_clicks,
                SUM(CASE WHEN (gclid IS NOT NULL
                    OR utm_campaign IS NOT NULL
                    OR google_campaign_id IS NOT NULL)
                    THEN 1 ELSE 0 END)    AS ad_hits,
                SUM(CASE WHEN duration_seconds >= 90
                    OR (duration_seconds >= 60 AND click_count >= 2)
                    THEN 1 ELSE 0 END)    AS hot_leads,
                SUM(CASE WHEN (duration_seconds >= 30 OR click_count >= 1)
                    AND NOT (duration_seconds >= 90
                        OR (duration_seconds >= 60 AND click_count >= 2))
                    THEN 1 ELSE 0 END)    AS warm_leads,
                SUM(CASE WHEN duration_seconds < 30 AND click_count < 1
                    THEN 1 ELSE 0 END)    AS cold_leads
            ")->first();

            // ── 2. Bounce rate ────────────────────────────────────────────
            // Sessions visiting this path; count those that saw only 1 unique page
            $sessionSubQuery = DB::table('ad_track_events')
                ->select('session_id')
                ->where('organization_id', $orgId)
                ->where('page_url', $path)
                ->whereNotNull('session_id')
                ->when($siteId,      fn($q) => $q->where('pixel_site_id', $siteId))
                ->when($excludeBots, fn($q) => $q->where('is_bot', false))
                ->where('created_at', '>=', $since)
                ->distinct();

            $bounceRows = DB::table('ad_track_events as b')
                ->joinSub($sessionSubQuery, 's', 'b.session_id', '=', 's.session_id')
                ->where('b.organization_id', $orgId)
                ->selectRaw('b.session_id, COUNT(DISTINCT b.page_url) AS page_count')
                ->groupBy('b.session_id')
                ->get();

            $totalSessions = $bounceRows->count();
            $bounces       = $bounceRows->where('page_count', 1)->count();
            $bounceRate    = $totalSessions > 0 ? round(($bounces / $totalSessions) * 100, 1) : 0;

            // ── 3. Entry / Exit rate ──────────────────────────────────────
            // Entry: this was the FIRST page in the session (min created_at)
            // Exit:  this was the LAST  page in the session (max created_at)
            $entryExitBase = DB::table('ad_track_events')
                ->where('organization_id', $orgId)
                ->whereNotNull('session_id')
                ->when($siteId,      fn($q) => $q->where('pixel_site_id', $siteId))
                ->when($excludeBots, fn($q) => $q->where('is_bot', false))
                ->where('created_at', '>=', $since);

            // For sessions on this path, get min/max timestamps per session
            $sessionBounds = DB::table('ad_track_events')
                ->where('organization_id', $orgId)
                ->where('page_url', $path)
                ->whereNotNull('session_id')
                ->when($siteId,      fn($q) => $q->where('pixel_site_id', $siteId))
                ->when($excludeBots, fn($q) => $q->where('is_bot', false))
                ->where('created_at', '>=', $since)
                ->selectRaw('session_id, MIN(created_at) as path_first, MAX(created_at) as path_last')
                ->groupBy('session_id')
                ->get();

            $pathSessionCount = $sessionBounds->count();

            // Entry sessions: first event of the whole session matches this path's first hit
            $entryCount = 0;
            $exitCount  = 0;
            if ($pathSessionCount > 0) {
                $sessionIds = $sessionBounds->pluck('session_id')->toArray();
                $sessionMinMax = DB::table('ad_track_events')
                    ->whereIn('session_id', $sessionIds)
                    ->where('organization_id', $orgId)
                    ->when($excludeBots, fn($q) => $q->where('is_bot', false))
                    ->selectRaw('session_id, MIN(created_at) as sess_first, MAX(created_at) as sess_last')
                    ->groupBy('session_id')
                    ->get()
                    ->keyBy('session_id');

                foreach ($sessionBounds as $sb) {
                    $mm = $sessionMinMax[$sb->session_id] ?? null;
                    if (!$mm) continue;
                    if ($sb->path_first <= $mm->sess_first) $entryCount++;
                    if ($sb->path_last  >= $mm->sess_last)  $exitCount++;
                }
            }

            $entryRate = $pathSessionCount > 0 ? round(($entryCount / $pathSessionCount) * 100, 1) : 0;
            $exitRate  = $pathSessionCount > 0 ? round(($exitCount  / $pathSessionCount) * 100, 1) : 0;

            // ── 4. Previous pages (entry flows) ───────────────────────────
            $prevPages = DB::table('ad_track_events as cur')
                ->join('ad_track_events as prev', function ($j) use ($path) {
                    $j->on('cur.session_id', '=', 'prev.session_id')
                      ->whereColumn('prev.created_at', '<', 'cur.created_at')
                      ->where('prev.page_url', '!=', $path);
                })
                ->where('cur.organization_id', $orgId)
                ->where('cur.page_url', $path)
                ->when($siteId, fn($q) => $q->where('cur.pixel_site_id', $siteId))
                ->when($excludeBots, fn($q) => $q->where('cur.is_bot', false))
                ->where('cur.created_at', '>=', $since)
                ->selectRaw('prev.page_url, COUNT(*) as cnt')
                ->groupBy('prev.page_url')
                ->orderByDesc('cnt')
                ->limit(5)
                ->get()
                ->map(fn($r) => ['page_url' => $r->page_url, 'count' => (int) $r->cnt]);

            // ── 5. Next pages (exit flows) ────────────────────────────────
            $nextPages = DB::table('ad_track_events as cur')
                ->join('ad_track_events as nxt', function ($j) use ($path) {
                    $j->on('cur.session_id', '=', 'nxt.session_id')
                      ->whereColumn('nxt.created_at', '>', 'cur.created_at')
                      ->where('nxt.page_url', '!=', $path);
                })
                ->where('cur.organization_id', $orgId)
                ->where('cur.page_url', $path)
                ->when($siteId, fn($q) => $q->where('cur.pixel_site_id', $siteId))
                ->when($excludeBots, fn($q) => $q->where('cur.is_bot', false))
                ->where('cur.created_at', '>=', $since)
                ->selectRaw('nxt.page_url, COUNT(*) as cnt')
                ->groupBy('nxt.page_url')
                ->orderByDesc('cnt')
                ->limit(5)
                ->get()
                ->map(fn($r) => ['page_url' => $r->page_url, 'count' => (int) $r->cnt]);

            // ── 6. Geography & device breakdown ──────────────────────────
            $geoRaw = (clone $base)
                ->selectRaw('country_code, city, device_type, browser, COUNT(*) as cnt')
                ->groupBy('country_code', 'city', 'device_type', 'browser')
                ->get();

            $byCountry = $geoRaw->groupBy('country_code')
                ->map(fn($g, $code) => ['code' => $code ?: 'Unknown', 'count' => $g->sum('cnt')])
                ->sortByDesc('count')->values()->take(10);

            $byDevice = $geoRaw->groupBy('device_type')
                ->map(fn($g, $type) => ['name' => $type ?: 'Desktop', 'count' => $g->sum('cnt')])
                ->sortByDesc('count')->values();

            $byBrowser = $geoRaw->groupBy('browser')
                ->map(fn($g, $b) => ['name' => $b ?: 'Unknown', 'count' => $g->sum('cnt')])
                ->sortByDesc('count')->values()->take(5);

            $byCityRaw = $geoRaw->filter(fn($r) => !empty($r->city))
                ->groupBy('city')
                ->map(fn($g, $city) => ['name' => $city, 'count' => $g->sum('cnt')])
                ->sortByDesc('count')->values()->take(8);

            // ── 7. Referrers to this specific path ───────────────────────
            $referrers = (clone $base)
                ->whereNotNull('referrer')
                ->where('referrer', '!=', '')
                ->selectRaw('referrer, COUNT(*) as cnt')
                ->groupBy('referrer')
                ->orderByDesc('cnt')
                ->limit(20)
                ->get()
                ->groupBy(fn($r) => strtolower(parse_url($r->referrer, PHP_URL_HOST) ?? $r->referrer))
                ->map(fn($g) => ['domain' => $g->first()->referrer, 'count' => $g->sum('cnt')])
                ->sortByDesc('count')
                ->take(6)->values();

            // ── 8. UTM / Attribution breakdown ───────────────────────────
            $utmBreakdown = (clone $base)
                ->where(fn($q) => $q->whereNotNull('utm_source')
                    ->orWhereNotNull('utm_medium')
                    ->orWhereNotNull('utm_campaign'))
                ->selectRaw('utm_source, utm_medium, utm_campaign, COUNT(*) as cnt')
                ->groupBy('utm_source', 'utm_medium', 'utm_campaign')
                ->orderByDesc('cnt')
                ->limit(8)
                ->get()
                ->map(fn($r) => [
                    'source'   => $r->utm_source   ?? '—',
                    'medium'   => $r->utm_medium   ?? '—',
                    'campaign' => $r->utm_campaign ?? '—',
                    'visits'   => (int) $r->cnt,
                ]);

            // ── 9. Hour-of-day engagement pattern ────────────────────────
            $hourRaw = (clone $base)
                ->selectRaw('HOUR(created_at) as hr, COUNT(*) as visits, AVG(duration_seconds) as avg_dwell')
                ->groupBy('hr')
                ->orderBy('hr')
                ->get()
                ->keyBy('hr');

            $hourPattern = [];
            for ($h = 0; $h < 24; $h++) {
                $hourPattern[] = [
                    'hour'      => $h,
                    'visits'    => (int)   ($hourRaw[$h]->visits    ?? 0),
                    'avg_dwell' => (float) ($hourRaw[$h]->avg_dwell ?? 0),
                ];
            }

            // ── 10. Day-of-week pattern ───────────────────────────────────
            // MySQL: 1=Sunday … 7=Saturday
            $dowRaw = (clone $base)
                ->selectRaw('DAYOFWEEK(created_at) as dow, COUNT(*) as visits')
                ->groupBy('dow')
                ->orderBy('dow')
                ->get()
                ->keyBy('dow');

            $days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            $dowPattern = [];
            for ($d = 1; $d <= 7; $d++) {
                $dowPattern[] = [
                    'day'    => $days[$d - 1],
                    'visits' => (int) ($dowRaw[$d]->visits ?? 0),
                ];
            }

            // ── 11. 30-day daily history for this path ───────────────────
            $dailyRaw = (clone $base)
                ->selectRaw("DATE(created_at) as date, COUNT(*) as visits,
                    SUM(CASE WHEN (gclid IS NOT NULL OR utm_campaign IS NOT NULL
                        OR google_campaign_id IS NOT NULL) THEN 1 ELSE 0 END) as ad_hits")
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->keyBy('date');

            $dailyHistory = [];
            for ($i = $period - 1; $i >= 0; $i--) {
                $d = now()->subDays($i)->format('Y-m-d');
                $dailyHistory[] = [
                    'date'    => $d,
                    'label'   => now()->subDays($i)->format('M j'),
                    'visits'  => (int) ($dailyRaw[$d]->visits  ?? 0),
                    'ad_hits' => (int) ($dailyRaw[$d]->ad_hits ?? 0),
                ];
            }

            // ── 12. JS errors on this path ───────────────────────────────
            $errors = CdnError::where('organization_id', $orgId)
                ->where('url', $path)
                ->when($siteId, fn($q) => $q->where('pixel_site_id', $siteId))
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->map(fn($r) => [
                    'id'          => $r->id,
                    'message'     => $r->message,
                    'stack'       => $r->stack,
                    'type'        => $r->error_type ?? 'js_error',
                    'line'        => $r->line,
                    'col'         => $r->col,
                    'filename'    => $r->filename,
                    'created_at'  => $r->created_at->toISOString(),
                    'load_time_ms'=> (int) $r->load_time_ms,
                ]);

            $errorCount = CdnError::where('organization_id', $orgId)
                ->where('url', $path)
                ->when($siteId, fn($q) => $q->where('pixel_site_id', $siteId))
                ->where('created_at', '>=', $since)
                ->count();

            $avgLoadMs = $errors->avg('load_time_ms') ?? 0;

            // ── 13. Bottleneck score ──────────────────────────────────────
            $avgDwell    = (float) ($summary->avg_dwell ?? 0);
            $avgClicks   = (float) ($summary->avg_clicks ?? 0);
            $errorCount  = $errorCount; // Total count in period

            $bounceB  = $bounceRate / 100 * 40;
            $dwellB   = max(0, (1 - $avgDwell / 60) * 30);
            $errorB   = min($errorCount * 5, 20);
            $loadB    = $avgLoadMs > 3000 ? 10 : ($avgLoadMs > 1500 ? 5 : 0);
            $bottleneckScore    = round($bounceB + $dwellB + $errorB + $loadB);
            $bottleneckSeverity = $bottleneckScore >= 60 ? 'critical' : ($bottleneckScore >= 35 ? 'warning' : 'good');

            // ── 14. Keyword Matching & Intent ────────────────────────────
            $keywords = KeywordResearch::where('organization_id', $orgId)->get();
            $pathLower = strtolower(parse_url($path, PHP_URL_PATH) ?: '');
            $pathNormalized = str_replace(['-', '_', '/'], ' ', $pathLower);

            $matchedKeywords = $keywords->filter(function($k) use ($pathNormalized) {
                return str_contains($pathNormalized, strtolower($k->query));
            })->map(function($k) {
                return [
                    'query'      => $k->query,
                    'intent'     => $k->intent,
                    'is_primary' => false,
                ];
            })->values();

            $topIntent = $matchedKeywords->countBy('intent')->sortDesc()->keys()->first();

            // ── 15. Engagement score ──────────────────────────────────────
            $avgScroll      = (float) ($summary->avg_scroll ?? 0);
            $dwellScore     = min(($avgDwell / 60) * 30, 30);
            $scrollScore    = ($avgScroll / 100) * 30;
            $interactScore  = min(($avgClicks / 5) * 25, 25);
            $bounceScore    = (1 - ($bounceRate / 100)) * 15;
            $engagementScore = round($dwellScore + $scrollScore + $interactScore + $bounceScore);

            // ── 16. Marketing recommendations ────────────────────────────
            $recommendations = [];
            if ($bounceRate > 60)   $recommendations[] = ['type' => 'warning', 'text' => 'High bounce rate — improve above-fold content and page relevance'];
            if ($avgDwell < 20)     $recommendations[] = ['type' => 'warning', 'text' => 'Low dwell time — add engaging media or interactive CTAs'];
            if ($avgClicks < 1)     $recommendations[] = ['type' => 'warning', 'text' => 'Low interaction — add clear call-to-action buttons'];
            if ($errorCount > 0)    $recommendations[] = ['type' => 'critical', 'text' => "$errorCount JS error(s) detected — fix to prevent lead drop-off"];
            if ($avgLoadMs > 3000)  $recommendations[] = ['type' => 'critical', 'text' => 'Slow page load ('.round($avgLoadMs/1000, 1).'s) — compress images & defer scripts'];
            if ($entryRate > 40)    $recommendations[] = ['type' => 'success', 'text' => 'Strong entry page — ideal for paid ad landing. Consider A/B testing CTAs'];
            if ($exitRate > 50)     $recommendations[] = ['type' => 'warning', 'text' => 'High exit rate — add exit-intent offers or internal link suggestions'];
            $adReady = $engagementScore >= 65 && (int)($summary->total_visits ?? 0) >= 5;
            if ($adReady)           $recommendations[] = ['type' => 'success', 'text' => 'Ad-ready page — engagement score qualifies for targeted paid campaigns'];
            
            if ($topIntent === 'commercial') {
                $recommendations[] = ['type' => 'success', 'text' => 'Commercial intent detected — Strategy: Use high-bid Search Ads with "Buy Now" or "Get Quote" copy'];
                $recommendations[] = ['type' => 'success', 'text' => 'Audience Strategy: Target "In-Market" segments related to ' . ($matchedKeywords->first()['query'] ?? 'your niche')];
            }
            if ($topIntent === 'informational') {
                $recommendations[] = ['type' => 'success', 'text' => 'Informational intent detected — Strategy: Best for Awareness/Display ads or Content Marketing retargeting'];
                $recommendations[] = ['type' => 'success', 'text' => 'Engagement Strategy: Use "Learn More" or "Download Guide" to capture top-funnel interest'];
            }
            
            if ($avgDwell > 60 && $bounceRate < 30) {
                 $recommendations[] = ['type' => 'success', 'text' => 'Viral potential — High dwell and low bounce suggest this content is highly sticky. Amplify via Social Ads.'];
            }

            return response()->json([
                'path'               => $path,
                'period'             => $period,
                'summary'            => [
                    'total_visits'    => (int)   ($summary->total_visits    ?? 0),
                    'unique_sessions' => (int)   ($summary->unique_sessions ?? 0),
                    'avg_dwell'       => round($avgDwell),
                    'avg_scroll'      => round($avgScroll, 1),
                    'avg_clicks'      => round($avgClicks, 1),
                    'ad_hits'         => (int)   ($summary->ad_hits         ?? 0),
                    'hot_leads'       => (int)   ($summary->hot_leads       ?? 0),
                    'warm_leads'      => (int)   ($summary->warm_leads      ?? 0),
                    'cold_leads'      => (int)   ($summary->cold_leads      ?? 0),
                    'bounce_rate'     => $bounceRate,
                    'entry_rate'      => $entryRate,
                    'exit_rate'       => $exitRate,
                    'engagement_score' => $engagementScore,
                    'bottleneck_score' => $bottleneckScore,
                    'bottleneck_severity' => $bottleneckSeverity,
                    'avg_load_ms'     => round($avgLoadMs),
                    'ad_ready'        => $adReady,
                    'top_intent'      => $topIntent,
                    'returning_rate'  => $this->calculateReturningRate($orgId, $path, $period, $siteId),
                ],
                'by_country'         => $byCountry->values(),
                'by_device'          => $byDevice->values(),
                'by_browser'         => $byBrowser->values(),
                'by_city'            => $byCityRaw->values(),
                'referrers'          => $referrers->values(),
                'utm_breakdown'      => $utmBreakdown->values(),
                'prev_pages'         => $prevPages->values(),
                'next_pages'         => $nextPages->values(),
                'hour_pattern'       => $hourPattern,
                'dow_pattern'        => $dowPattern,
                'daily_history'      => $dailyHistory,
                'errors'             => $errors->values(),
                'recommendations'    => $recommendations,
            ]);
        });
    }

    /**
     * Calculate the percentage of returning users based on ip_hash history.
     */
    private function calculateReturningRate($orgId, $path, $days, $siteId = null)
    {
        $now = now();
        $start = now()->subDays($days);

        // Get all unique IP hashes in the current period
        $currentIps = AdTrackEvent::where('organization_id', $orgId)
            ->where('page_url', $path)
            ->where('created_at', '>=', $start)
            ->when($siteId, fn($q) => $q->where('pixel_site_id', $siteId))
            ->distinct()
            ->pluck('ip_hash')
            ->toArray();

        if (empty($currentIps)) return 0;

        // Check which of these appeared BEFORE the period
        $returningCount = AdTrackEvent::where('organization_id', $orgId)
            ->where('page_url', $path)
            ->where('created_at', '<', $start)
            ->whereIn('ip_hash', $currentIps)
            ->when($siteId, fn($q) => $q->where('pixel_site_id', $siteId))
            ->distinct('ip_hash')
            ->count('ip_hash');

        return round(($returningCount / count($currentIps)) * 100);
    }
}
