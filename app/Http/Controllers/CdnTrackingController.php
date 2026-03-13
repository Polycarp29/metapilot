<?php

namespace App\Http\Controllers;

use App\Models\AdTrackEvent;
use App\Models\CdnPageSchema;
use App\Models\Organization;
use App\Models\PixelSite;
use App\Models\Schema;
use App\Models\SitemapLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CdnTrackingController extends Controller
{
    /**
     * Standard CORS headers for all CDN responses.
     * This allows the tracker script to be used from any external domain.
     */
    private function corsHeaders(): array
    {
        return [
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type',
        ];
    }

    /**
     * Handle CORS preflight (OPTIONS) requests.
     */
    public function preflight()
    {
        return response('', 204, $this->corsHeaders());
    }

    /**
     * Serve the tracking JS script via CDN.
     */
    public function serveScript()
    {
        $path = public_path('js/ads-tracker.js');
        if (!File::exists($path)) {
            return response()->json(['error' => 'Script not found'], 404)
                ->withHeaders($this->corsHeaders());
        }

        return response()->file($path, array_merge([
            'Content-Type'  => 'application/javascript',
            'Cache-Control' => 'public, max-age=86400', // 24h cache (shorter so updates propagate)
        ], $this->corsHeaders()));
    }

    /**
     * Handle a pixel tracking hit from an external site.
     *
     * Security checks performed (in order):
     * 1. Required fields validation
     * 2. Valid organization token
     * 3. Domain pinning — Origin/Referer must match allowed_domain if set
     * 4. HMAC-SHA256 signature validation with 5-minute replay window
     */
    public function trackHit(Request $request)
    {
        $request->validate([
            'token'        => 'required|uuid',
            'page_view_id' => 'required|string|max:50',
            'page_url'     => 'nullable|url',
            '_ts'          => 'required|integer',
            '_sig'         => 'required|string',
        ]);

        $pixelSite = PixelSite::where('ads_site_token', $request->token)->first();
        if (!$pixelSite) {
            return response()->json(['error' => 'Invalid token'], 403)
                ->withHeaders($this->corsHeaders());
        }

        $organization = $pixelSite->organization;

        // --- Security: Domain Pinning ---
        if ($pixelSite->allowed_domain) {
            $origin  = $request->header('Origin', '');
            $referer = $request->header('Referer', '');
            $allowed = strtolower(trim($pixelSite->allowed_domain, '/'));

            $originHost  = strtolower(parse_url($origin,  PHP_URL_HOST) ?? '');
            $refererHost = strtolower(parse_url($referer, PHP_URL_HOST) ?? '');

            // Strip www. for comparison
            $normalise = fn($h) => preg_replace('/^www\./', '', $h);
            $cleanAllowed = $normalise($allowed);

            $checkDomain = function($host) use ($cleanAllowed, $normalise) {
                if (!$host) return false;
                $host = $normalise($host);
                return $host === $cleanAllowed || str_ends_with($host, '.' . $cleanAllowed);
            };

            if (!$checkDomain($originHost) && !$checkDomain($refererHost)) {
                Log::warning('Pixel domain pinning violation', [
                    'expected' => $allowed,
                    'origin'   => $originHost,
                    'referer'  => $refererHost,
                ]);
                return response()->json(['error' => 'Domain not authorised'], 403)
                    ->withHeaders($this->corsHeaders());
            }
        }

        // --- Security: HMAC Replay Attack Prevention ---
        $ts        = (int) $request->_ts;
        $signature = $request->_sig;
        $now       = time();

        if (abs($now - $ts) > 300) {
            return response()->json(['error' => 'Request expired'], 403)
                ->withHeaders($this->corsHeaders());
        }

        $expected = hash_hmac(
            'sha256',
            $request->token . $request->page_view_id . $ts,
            $pixelSite->ads_site_token
        );

        if (!hash_equals($expected, $signature)) {
            Log::warning('Pixel HMAC validation failed', [
                'pixel_site_id' => $pixelSite->id,
                'page_view_id'  => $request->page_view_id,
            ]);
            return response()->json(['error' => 'Invalid signature'], 403)
                ->withHeaders($this->corsHeaders());
        }

        // --- Parse UA and Geo ---
        $ua         = $request->header('User-Agent');
        $deviceData = $this->parseUserAgent($ua);
        $geo        = $this->getGeoData($request->ip());

        // Normalize URL for consistent hashing
        $rawUrl = $request->page_url;
        if ($rawUrl) {
            $parsed = parse_url($rawUrl);
            $normalizedUrl = ($parsed['host'] ?? '') . ($parsed['path'] ?? '');
            $normalizedUrl = strtolower(rtrim($normalizedUrl, '/'));
            $urlHash = hash('sha256', $normalizedUrl);
        } else {
            $urlHash = null;
        }

        // --- Upsert the hit ---
        $hit = AdTrackEvent::updateOrCreate(
            ['page_view_id' => $request->page_view_id],
            [
                'organization_id'    => $organization->id,
                'pixel_site_id'      => $pixelSite->id,
                'site_token'         => $request->token,
                'country_code'       => $geo['country_code'] ?? $request->header('CF-IPCountry'),
                'city'               => $geo['city']         ?? null,
                'browser'            => $deviceData['browser'],
                'platform'           => $deviceData['platform'],
                'device_type'        => $deviceData['device_type'],
                'screen_resolution'  => $request->screen_resolution,
                'duration_seconds'   => $request->duration_seconds ?? 0,
                'click_count'        => $request->click_count      ?? 0,
                'google_campaign_id' => $request->campaign_id,
                'page_url'           => $request->page_url,
                'referrer'           => $request->referrer,
                'session_id'         => $request->session_id,
                'gclid'              => $request->gclid,
                'utm_source'         => $request->utm_source,
                'utm_medium'         => $request->utm_medium,
                'utm_campaign'       => $request->utm_campaign,
                'ip_hash'            => hash('sha256', $request->ip()),
                'metadata'           => $request->metadata, // Casted to JSON in model? Need to check.
            ]
        );

        // --- Intelligence Platform Integration ---
        if ($urlHash) {
            // 1. Link to SitemapLink
            $sitemapLink = SitemapLink::whereHas('sitemap', function($q) use ($organization) {
                $q->where('organization_id', $organization->id);
            })->where('url_hash', $urlHash)->first();

            if ($sitemapLink) {
                $sitemapLink->increment('cdn_hit_count');
                $sitemapLink->update([
                    'cdn_active' => true,
                    'cdn_last_seen_at' => now(),
                ]);
            }

            // 2. Auto-Generate Schema if requested and missing
            $modules = $request->input('modules', []);
            if (is_string($modules)) $modules = explode(',', $modules);

            if (in_array('schema', $modules) && $request->metadata) {
                $exists = CdnPageSchema::where('pixel_site_id', $pixelSite->id)
                    ->where('url_hash', $urlHash)
                    ->exists();
                
                if (!$exists) {
                    $this->generateSchemaForPage($pixelSite, $request->page_url, $request->metadata);
                }
            }
        }

        // --- Mark pixel as verified on first domain-confirmed hit ---
        if (!$pixelSite->pixel_verified_at) {
            $pixelSite->update(['pixel_verified_at' => now()]);
        }

        return response()->json(null, 204)->withHeaders($this->corsHeaders());
    }

    /**
     * Two-way connection handshake.
     *
     * The tracker script calls this on first page load with a random nonce.
     * We validate the token and echo the challenge back in a signed response,
     * giving the external site proof that it has successfully connected to our server.
     */
    public function verifyConnection(Request $request)
    {
        $request->validate([
            'token'     => 'required|uuid',
            'challenge' => 'required|string|max:64',
        ]);

        $pixelSite = PixelSite::where('ads_site_token', $request->token)->first();

        if (!$pixelSite) {
            return response()->json(['ok' => false, 'error' => 'Invalid token'], 403)
                ->withHeaders($this->corsHeaders());
        }

        // Check if the calling domain matches the allowed_domain
        $domainVerified = false;
        if ($pixelSite->allowed_domain) {
            $origin     = strtolower(parse_url($request->header('Origin', ''), PHP_URL_HOST) ?? '');
            $referer    = strtolower(parse_url($request->header('Referer', ''), PHP_URL_HOST) ?? '');
            $allowed    = strtolower($pixelSite->allowed_domain);
            $normalise  = fn($h) => preg_replace('/^www\./', '', $h);
            $cleanAllowed = $normalise($allowed);

            $checkDomain = function($host) use ($cleanAllowed, $normalise) {
                if (!$host) return false;
                $host = $normalise($host);
                return $host === $cleanAllowed || str_ends_with($host, '.' . $cleanAllowed);
            };

            $domainVerified = $checkDomain($origin) || $checkDomain($referer);
        }

        // --- Intelligence Platform Modules ---
        $modules = $request->input('modules', []);
        if (is_string($modules)) {
            $modules = explode(',', $modules);
        }

        $schemaJson = null;
        if (in_array('schema', $modules)) {
            $url = $request->header('Referer');
            if ($url) {
                $parsed = parse_url($url);
                $normalizedUrl = ($parsed['host'] ?? '') . ($parsed['path'] ?? '');
                $normalizedUrl = strtolower(rtrim($normalizedUrl, '/'));
                $urlHash = hash('sha256', $normalizedUrl);

                $cachedSchema = CdnPageSchema::where('pixel_site_id', $pixelSite->id)
                    ->where('url_hash', $urlHash)
                    ->first();
                
                if ($cachedSchema) {
                    $schemaJson = $cachedSchema->schema_json;
                    $cachedSchema->increment('injected_count');
                    $cachedSchema->update(['last_injected_at' => now()]);
                }
            }
        }

        return response()->json([
            'ok'              => true,
            'echo'            => $request->challenge,
            'server_time'     => now()->toIso8601String(),
            'domain_verified' => $domainVerified,
            'schema_json'     => $schemaJson,
            'modules_active'  => $modules,
        ])->withHeaders($this->corsHeaders());
    }

    /**
     * Get paginated track events for the authenticated organization with advanced filtering.
     */
    public function events(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $query = AdTrackEvent::where('organization_id', $organization->id);

        if ($request->filled('pixel_site_id')) {
            $query->where('pixel_site_id', $request->pixel_site_id);
        }

        // Filter by Campaign ID (Agency Isolation)
        if ($request->filled('campaign_id') && $request->campaign_id !== 'all') {
            $query->where('google_campaign_id', $request->campaign_id);
        }

        // Filter by Traffic Type
        if ($request->filled('type')) {
            if ($request->type === 'ads') {
                $query->where(function($q) {
                    $q->whereNotNull('gclid')
                      ->orWhereNotNull('utm_campaign')
                      ->orWhereNotNull('google_campaign_id');
                });
            } elseif ($request->type === 'organic') {
                $query->whereNull('gclid')
                      ->whereNull('utm_campaign')
                      ->whereNull('google_campaign_id');
            }
        }

        // Filter by Device
        if ($request->filled('device') && $request->device !== 'all') {
            $query->where('device_type', $request->device);
        }

        // Filter by Country
        if ($request->filled('country') && $request->country !== 'all') {
            $query->where('country_code', $request->country);
        }

        // Date Range
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search (URL, Session, City)
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('session_id', 'like', "%$s%")
                  ->orWhere('page_url', 'like', "%$s%")
                  ->orWhere('city', 'like', "%$s%");
            });
        }

        $perPage = $request->input('per_page', 25);
        $events = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($events);
    }

    /**
     * Export filtered events to CSV.
     */
    public function downloadCsv(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) return abort(404);

        $query = AdTrackEvent::where('organization_id', $organization->id);

        if ($request->filled('pixel_site_id')) {
            $query->where('pixel_site_id', $request->pixel_site_id);
        }

        // Apply same filters as events()
        if ($request->filled('campaign_id') && $request->campaign_id !== 'all') $query->where('google_campaign_id', $request->campaign_id);
        if ($request->filled('type') && $request->type === 'ads') $query->whereNotNull('gclid');
        if ($request->filled('device') && $request->device !== 'all') $query->where('device_type', $request->device);
        if ($request->filled('country') && $request->country !== 'all') $query->where('country_code', $request->country);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('session_id', 'like', "%$s%")->orWhere('page_url', 'like', "%$s%");
        }

        $events = $query->orderBy('created_at', 'desc')->limit(5000)->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=intelligence_log_".now()->format('Y-m-d').".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'Date', 'Session', 'Campaign', 'GCLID', 'URL', 'Device', 'Location', 'Clicks', 'Dwell(s)'];

        $callback = function() use($events, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($events as $e) {
                fputcsv($file, [
                    $e->id,
                    $e->created_at,
                    $e->session_id,
                    $e->google_campaign_id,
                    $e->gclid,
                    $e->page_url,
                    $e->device_type,
                    $e->city . ', ' . $e->country_code,
                    $e->click_count,
                    $e->duration_seconds
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Rich pixel connection health status for the authenticated Developer Tab UI.
     */
    public function connectionStatus(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $pixelSites = $organization->pixelSites()->get()->map(function ($site) {
            $totalHits    = AdTrackEvent::where('pixel_site_id', $site->id)->count();
            $hitsLast24h  = AdTrackEvent::where('pixel_site_id', $site->id)
                ->where('created_at', '>=', now()->subHours(24))
                ->count();

            $lastEvent = AdTrackEvent::where('pixel_site_id', $site->id)
                ->orderBy('created_at', 'desc')
                ->first(['created_at', 'page_url']);

            $lastHitDomain = $lastEvent?->page_url ? parse_url($lastEvent->page_url, PHP_URL_HOST) : null;

            $pixelVerified = (bool) $site->pixel_verified_at;
            $recentlyActive = $hitsLast24h > 0;

            if ($pixelVerified && $recentlyActive) {
                $status = 'verified_active';
            } elseif ($totalHits > 0) {
                $status = 'connected_inactive';
            } else {
                $status = 'not_detected';
            }

            return [
                'id'                => $site->id,
                'label'             => $site->label,
                'ads_site_token'    => $site->ads_site_token,
                'connected'         => $totalHits > 0,
                'pixel_verified'    => $pixelVerified,
                'pixel_verified_at' => $site->pixel_verified_at?->toIso8601String(),
                'allowed_domain'    => $site->allowed_domain,
                'last_hit_at'       => $lastEvent?->created_at?->toIso8601String(),
                'last_hit_domain'   => $lastHitDomain,
                'total_hits'        => $totalHits,
                'hits_last_24h'     => $hitsLast24h,
                'status'            => $status,
            ];
        });

        return response()->json([
            'pixel_sites' => $pixelSites,
        ]);
    }

    /**
     * Save the allowed domain for a specific pixel site.
     */
    public function saveAllowedDomain(Request $request)
    {
        $request->validate([
            'pixel_site_id'  => 'required|integer|exists:pixel_sites,id',
            'allowed_domain' => 'nullable|string|max:255|regex:/^([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})$/',
        ]);

        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $pixelSite = $organization->pixelSites()->findOrFail($request->pixel_site_id);

        // Reset pixel_verified_at when domain changes (needs re-verification)
        $domainChanged = $pixelSite->allowed_domain !== $request->allowed_domain;

        $pixelSite->update([
            'allowed_domain'    => $request->allowed_domain ?: null,
            'pixel_verified_at' => $domainChanged ? null : $pixelSite->pixel_verified_at,
        ]);

        return response()->json([
            'allowed_domain' => $pixelSite->allowed_domain,
            'message'        => $domainChanged
                ? 'Domain updated. Pixel verification reset — the tracker must fire from the new domain to re-verify.'
                : 'Domain saved.',
        ]);
    }

    /**
     * Rich analytics payload for the Developer Tools "Path Intelligence" UI.
     *
     * Returns:
     *  - daily_history  : 30-day array of {date, total, ad_hits}
     *  - top_pages      : top 10 pages with delta%, sparkline (14d), avg dwell, avg clicks
     *  - top_referrers  : top 8 referrer domains with count
     *  - summary        : today vs yesterday, 7d vs prev-7d growth %
     */
    public function analytics(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $orgId = $organization->id;

        $thirtyDaysAgo = now()->subDays(29)->startOfDay();

        $rawDaily = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("DATE(created_at) as date, COUNT(*) as total,
                SUM(CASE WHEN (gclid IS NOT NULL OR utm_campaign IS NOT NULL OR google_campaign_id IS NOT NULL) THEN 1 ELSE 0 END) as ad_hits")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // Fill every day in the 30-day window (even days with zero hits)
        $dailyHistory = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = now()->subDays($i)->format('Y-m-d');
            $dailyHistory[] = [
                'date'    => $d,
                'label'   => now()->subDays($i)->format('M j'),
                'total'   => (int) ($rawDaily[$d]->total   ?? 0),
                'ad_hits' => (int) ($rawDaily[$d]->ad_hits ?? 0),
            ];
        }

        // ── 2. Summary: today vs yesterday, 7d vs prev-7d ───────────────────
        $todayStr     = now()->format('Y-m-d');
        $yesterdayStr = now()->subDay()->format('Y-m-d');
        $todayHits     = (int) ($rawDaily[$todayStr]->total     ?? 0);
        $yesterdayHits = (int) ($rawDaily[$yesterdayStr]->total ?? 0);

        $last7  = array_sum(array_column(array_slice($dailyHistory, -7),  'total'));
        $prev7  = array_sum(array_column(array_slice($dailyHistory, -14, 7), 'total'));
        $weekDelta = $prev7 > 0 ? round((($last7 - $prev7) / $prev7) * 100, 1) : null;

        $todayDelta = $yesterdayHits > 0
            ? round((($todayHits - $yesterdayHits) / $yesterdayHits) * 100, 1)
            : null;

        // ── 3. Top pages with 14-day sparkline & delta ───────────────────────
        $topPageRows = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereNotNull('page_url')
            ->selectRaw("page_url,
                COUNT(*) as total_hits,
                AVG(duration_seconds) as avg_duration,
                AVG(click_count) as avg_clicks,
                SUM(CASE WHEN (gclid IS NOT NULL OR utm_campaign IS NOT NULL OR google_campaign_id IS NOT NULL) THEN 1 ELSE 0 END) as ad_hits,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count,
                SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN 1 ELSE 0 END) as yesterday_count")
            ->groupBy('page_url')
            ->orderByDesc('total_hits')
            ->limit(10)
            ->get();

        // 14-day sparkline per top page
        $fourteenDaysAgo = now()->subDays(13)->startOfDay();
        $topPageUrls = $topPageRows->pluck('page_url')->toArray();

        $sparklineRaw = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereIn('page_url', $topPageUrls)
            ->where('created_at', '>=', $fourteenDaysAgo)
            ->selectRaw("page_url, DATE(created_at) as date, COUNT(*) as cnt")
            ->groupBy('page_url', 'date')
            ->get()
            ->groupBy('page_url');

        // ── 4. Keyword ↔ Page Intent Linkage ──────────────────────────────
        $keywords = KeywordResearch::where('organization_id', $orgId)->get();

        $topPages = $topPageRows->map(function ($row) use ($sparklineRaw, $keywords) {
            $todayC     = (int) $row->today_count;
            $yesterdayC = (int) $row->yesterday_count;
            $deltaPct   = $yesterdayC > 0
                ? round((($todayC - $yesterdayC) / $yesterdayC) * 100, 1)
                : ($todayC > 0 ? 100 : null);

            // ── Engagement Scoring (0-100) ──
            $avgDuration = $row->avg_duration ?? 0;
            $avgClicks   = $row->avg_clicks ?? 0;
            
            // Dwell factor (0-50): 60s+ = max
            $dwellScore = min(($avgDuration / 60) * 50, 50);
            // Interaction factor (0-50): 5+ clicks = max
            $interactionScore = min(($avgClicks / 5) * 50, 50);
            
            $engagementScore = round($dwellScore + $interactionScore);
            
            // Ad Ready if score >= 70 and has decent traffic
            $isAdReady = $engagementScore >= 70 && $row->total_hits >= 5;

            // Build 14-day series (fill gaps with 0)
            $seriesMap = collect($sparklineRaw->get($row->page_url, []))->keyBy('date');
            $series = [];
            for ($i = 13; $i >= 0; $i--) {
                $d = now()->subDays($i)->format('Y-m-d');
                $series[] = (int) ($seriesMap[$d]->cnt ?? 0);
            }

            // Keyword Matching logic
            $path = strtolower(parse_url($row->page_url, PHP_URL_PATH) ?: '');
            $pathNormalized = str_replace(['-', '_', '/'], ' ', $path);
            
            $matchedKeywords = $keywords->filter(function($k) use ($pathNormalized) {
                return str_contains($pathNormalized, strtolower($k->query));
            })->map(function($k) {
                return [
                    'query' => $k->query,
                    'intent' => $k->intent,
                    'is_primary' => false 
                ];
            })->values();

            // Detect top intent
            $topIntent = $matchedKeywords->countBy('intent')->sortDesc()->keys()->first();

            return [
                'page_url'         => $row->page_url,
                'total_hits'       => (int) $row->total_hits,
                'ad_hits'          => (int) $row->ad_hits,
                'avg_duration'     => round($avgDuration),
                'avg_clicks'       => round($avgClicks, 1),
                'engagement_score' => $engagementScore,
                'is_ad_ready'      => $isAdReady,
                'today_count'      => $todayC,
                'yesterday_count'  => $yesterdayC,
                'delta_pct'        => $deltaPct,
                'sparkline'        => $series,
                'matched_keywords' => $matchedKeywords,
                'top_intent'       => $topIntent,
            ];
        })->values();

        // ── 4. Top referrers ─────────────────────────────────────────────────
        $topReferrers = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->selectRaw("referrer, COUNT(*) as count")
            ->groupBy('referrer')
            ->orderByDesc('count')
            ->limit(50) // fetch more so we can group by domain below
            ->get()
            ->groupBy(fn($r) => strtolower(parse_url($r->referrer, PHP_URL_HOST) ?? $r->referrer))
            ->map(fn($group) => ['domain' => $group->first()->referrer, 'count' => $group->sum('count')])
            ->sortByDesc('count')
            ->take(8)
            ->values();

        // ── 5. Trend velocity (fastest rising and falling over last 7d vs prev-7d per page) ─
        $velocityRows = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereNotNull('page_url')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw("page_url,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) as last7,
                SUM(CASE WHEN created_at < NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) as prev7")
            ->groupBy('page_url')
            ->having('last7', '>', 0)
            ->get()
            ->map(function ($r) {
                $delta = $r->prev7 > 0
                    ? round((($r->last7 - $r->prev7) / $r->prev7) * 100, 1)
                    : ($r->last7 > 0 ? 100 : 0);
                return ['page_url' => $r->page_url, 'last7' => (int)$r->last7, 'prev7' => (int)$r->prev7, 'delta_pct' => $delta];
            })
            ->sortByDesc('delta_pct')
            ->values();

        $rising  = $velocityRows->filter(fn($r) => $r['delta_pct'] > 0)->take(3)->values();
        $falling = $velocityRows->filter(fn($r) => $r['delta_pct'] < 0)->sortBy('delta_pct')->take(3)->values();

        return response()->json([
            'daily_history'  => $dailyHistory,
            'top_pages'      => $topPages,
            'top_referrers'  => $topReferrers,
            'trend_velocity' => ['rising' => $rising, 'falling' => $falling],
            'summary'        => [
                'today_hits'     => $todayHits,
                'yesterday_hits' => $yesterdayHits,
                'today_delta'    => $todayDelta,
                'last7_hits'     => $last7,
                'prev7_hits'     => $prev7,
                'week_delta'     => $weekDelta,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    protected function parseUserAgent($ua): array
    {
        $browser  = 'Unknown';
        $platform = 'Unknown';
        $device   = 'Desktop';

        if (stripos($ua, 'Mobile') !== false || stripos($ua, 'Android') !== false) {
            $device = 'Mobile';
        } elseif (stripos($ua, 'Tablet') !== false || stripos($ua, 'iPad') !== false) {
            $device = 'Tablet';
        }

        if (stripos($ua, 'Firefox') !== false) $browser = 'Firefox';
        elseif (stripos($ua, 'Edg')    !== false) $browser = 'Edge';
        elseif (stripos($ua, 'Chrome') !== false) $browser = 'Chrome';
        elseif (stripos($ua, 'Safari') !== false) $browser = 'Safari';
        elseif (stripos($ua, 'MSIE')   !== false || stripos($ua, 'Trident') !== false) $browser = 'IE';

        if (stripos($ua, 'Windows') !== false)  $platform = 'Windows';
        elseif (stripos($ua, 'Macintosh') !== false) $platform = 'macOS';
        elseif (stripos($ua, 'Linux')    !== false)  $platform = 'Linux';
        elseif (stripos($ua, 'Android') !== false)  $platform = 'Android';
        elseif (stripos($ua, 'iPhone')  !== false || stripos($ua, 'iPad') !== false) $platform = 'iOS';

        return ['browser' => $browser, 'platform' => $platform, 'device_type' => $device];
    }

    protected function getGeoData($ip): ?array
    {
        if ($ip === '127.0.0.1' || $ip === '::1') return null;

        return Cache::remember("geoip_{$ip}", 86400, function () use ($ip) {
            try {
                $response = Http::timeout(2)
                    ->get("http://ip-api.com/json/{$ip}?fields=status,countryCode,city");

                if ($response->successful() && $response->json('status') === 'success') {
                    return [
                        'country_code' => $response->json('countryCode'),
                        'city'         => $response->json('city'),
                    ];
                }
            } catch (\Exception $e) {
                // Silently fail — geo is non-critical
            }
            return null;
        });
    }

    /**
     * Generate and cache a JSON-LD schema for a specific page hit.
     */
    private function generateSchemaForPage(PixelSite $site, string $url, array $metadata)
    {
        $urlHash = hash('sha256', $url);
        
        // Detect schema type from metadata or URL
        $type = $metadata['content_type'] ?? 'website';
        if ($type === 'article') {
            $schema = [
                '@context' => 'https://schema.org',
                '@type' => 'Article',
                'headline' => $metadata['title'] ?? $metadata['h1'],
                'description' => $metadata['description'],
                'url' => $url,
                'image' => $metadata['og_image'],
                'author' => [
                    '@type' => 'Organization',
                    'name' => $site->label
                ]
            ];
        } else {
            $schema = [
                '@context' => 'https://schema.org',
                '@type' => 'WebPage',
                'name' => $metadata['title'] ?? $metadata['h1'],
                'description' => $metadata['description'],
                'url' => $url,
                'primaryImageOfPage' => $metadata['og_image']
            ];
        }

        return CdnPageSchema::updateOrCreate(
            ['pixel_site_id' => $site->id, 'url_hash' => $urlHash],
            [
                'url' => $url,
                'schema_type' => $type,
                'schema_json' => $schema,
                'is_auto_generated' => true,
                'last_injected_at' => now()
            ]
        );
    }
}
