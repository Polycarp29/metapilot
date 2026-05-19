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
            // 1. Get visited session IDs for this path
            $visitedSessions = DB::table('ad_track_events')
                ->where('organization_id', $orgId)
                ->where('page_url', $path)
                ->whereNotNull('session_id')
                ->when($siteId,      fn($q) => $q->where('pixel_site_id', $siteId))
                ->when($excludeBots, fn($q) => $q->where('is_bot', false))
                ->where('created_at', '>=', $since)
                ->distinct()
                ->pluck('session_id')
                ->toArray();

            // 2. Fetch all raw events in those sessions (capped to 15k rows for total safety)
            $events = [];
            if (!empty($visitedSessions)) {
                $events = DB::table('ad_track_events')
                    ->where('organization_id', $orgId)
                    ->whereIn('session_id', $visitedSessions)
                    ->when($excludeBots, fn($q) => $q->where('is_bot', false))
                    ->limit(15000)
                    ->get([
                        'session_id',
                        'page_url',
                        'created_at',
                        'duration_seconds',
                        'max_scroll_depth',
                        'click_count',
                        'country_code',
                        'city',
                        'device_type',
                        'browser',
                        'referrer',
                        'utm_source',
                        'utm_medium',
                        'utm_campaign',
                        'gclid',
                        'google_campaign_id',
                        'ip_hash'
                    ])
                    ->toArray();
            }

            // 3. Fetch last 20 errors on this path
            $errors = CdnError::where('organization_id', $orgId)
                ->where('url', $path)
                ->when($siteId, fn($q) => $q->where('pixel_site_id', $siteId))
                ->orderByDesc('created_at')
                ->limit(20)
                ->get([
                    'id',
                    'message',
                    'stack',
                    'error_type',
                    'line',
                    'col',
                    'filename',
                    'created_at',
                    'load_time_ms',
                ])
                ->map(fn($r) => [
                    'id'           => $r->id,
                    'message'      => $r->message,
                    'stack'        => $r->stack,
                    'error_type'   => $r->error_type ?? 'js_error',
                    'line'         => $r->line,
                    'col'          => $r->col,
                    'filename'     => $r->filename,
                    'created_at'   => $r->created_at->toISOString(),
                    'load_time_ms' => (int) $r->load_time_ms,
                ])
                ->toArray();

            // 4. Fetch keywords
            $keywords = KeywordResearch::where('organization_id', $orgId)
                ->get(['query', 'intent'])
                ->toArray();

            // 5. Calculate returning rate
            $returningRate = $this->calculateReturningRate($orgId, $path, $period, $siteId);

            // 6. Build optimized payload
            $payload = [
                'org_id'         => $orgId,
                'path'           => $path,
                'period'         => $period,
                'exclude_bots'   => $excludeBots,
                'events'         => $events,
                'errors'         => $errors,
                'keywords'       => $keywords,
                'returning_rate' => (float) $returningRate,
                'meta'           => [
                    'today'     => now()->format('Y-m-d'),
                    'yesterday' => now()->subDay()->format('Y-m-d'),
                ]
            ];

            // 7. Surgically offload calculations to Python
            $service = new \App\Services\CdnAnalyticsService();
            $result = $service->analyzePath($payload);

            return response()->json($result);
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
