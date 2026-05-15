<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateCdnSchemaJob;
use App\Jobs\RecordCdnDiscoveryJob;
use App\Models\AdCampaign;
use App\Models\AdTrackEvent;
use App\Models\CdnError;
use App\Models\CdnPageSchema;
use App\Models\KeywordResearch;
use App\Models\Organization;
use App\Models\PixelSite;
use App\Models\Schema;
use App\Models\Sitemap;
use App\Models\SitemapLink;
use App\Services\CdnAnalyticsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'token'            => 'required|uuid',
            'page_view_id'     => 'required|string|max:50',
            'page_url'         => 'nullable|url',
            'duration_seconds' => 'nullable|integer',
            'max_scroll_depth' => 'nullable|integer',
            '_ts'              => 'required|integer',
            '_sig'             => 'required|string',
        ]);

        $pixelSite = PixelSite::where('ads_site_token', $request->token)->first();
        if (!$pixelSite) {
            return response()->json(['error' => 'Invalid token'], 403)->withHeaders($this->corsHeaders());
        }

        if (!$pixelSite->isTrackingActive()) {
            return response()->json(null, 204)->withHeaders($this->corsHeaders());
        }

        /** @var \App\Services\BotFirewallService $firewall */
        $firewall = app(\App\Services\BotFirewallService::class);
        if ($firewall->checkTokenRateLimit($request->token)) {
            return response()->json(['error' => 'Too many requests'], 429)->withHeaders($this->corsHeaders());
        }

        if ($firewall->checkDailyHitCap($pixelSite->id)) {
            return response()->json(null, 204)->withHeaders($this->corsHeaders());
        }

        \App\Jobs\ProcessCdnHitJob::dispatch(
            $request->all(),
            array_change_key_case($request->headers->all(), CASE_LOWER),
            (string) $request->ip(),
            (string) $request->header('User-Agent', '')
        )->onQueue('cdn-ingestion');

        $firewall->incrementDailyHitCounter($pixelSite->id);

        // Heartbeat: Log 1% of incoming traffic to web logs for health monitoring
        if (rand(1, 100) === 1) {
            Log::info("CDN Hit Buffered", ['site' => $pixelSite->id, 'ip_hash' => substr(hash('sha256', $request->ip()), 0, 8)]);
        }

        return response()->json(null, 204)->withHeaders($this->corsHeaders());
    }

    public function logError(Request $request)
    {
        $request->validate([
            'token'        => 'required|uuid',
            'page_view_id' => 'required|string|max:50',
            '_ts'          => 'required|integer',
            '_sig'         => 'required|string',
        ]);

        $pixelSite = PixelSite::where('ads_site_token', $request->token)->first();
        if (!$pixelSite) {
            return response()->json(['error' => 'Invalid token'], 403)->withHeaders($this->corsHeaders());
        }

        if (!$pixelSite->isTrackingActive()) {
            return response()->json(null, 204)->withHeaders($this->corsHeaders());
        }

        \App\Jobs\ProcessCdnErrorJob::dispatch(
            $request->all(),
            $request->ip(),
            (string) $request->header('User-Agent', '')
        )->onQueue('cdn-ingestion');

        return response(null, 204)->withHeaders($this->corsHeaders());
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

        // ── Tracking toggle gate ──────────────────────────────────────────
        // If the site owner has paused tracking, report it to the JS client
        // so the tracker knows not to fire any further hits.
        if (!$pixelSite->isTrackingActive()) {
            return response()->json([
                'ok'             => false,
                'tracking_paused' => true,
                'error'          => 'Tracking is currently disabled for this site.',
            ], 200)->withHeaders($this->corsHeaders());
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

    // Validate modules against site's enabled_modules
    $enabledModules = $pixelSite->enabled_modules ?? ['click', 'schema'];
    $modules = array_values(array_intersect($modules, $enabledModules));

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

        // Bot Filtering
        if ($request->boolean('exclude_bots')) {
            $query->where('is_bot', false);
        }

        // Attribution Filtering
        if ($request->filled('utm_source'))   $query->where('utm_source', 'like', '%' . $request->utm_source . '%');
        if ($request->filled('utm_medium'))   $query->where('utm_medium', 'like', '%' . $request->utm_medium . '%');
        if ($request->filled('utm_campaign')) $query->where('utm_campaign', 'like', '%' . $request->utm_campaign . '%');
        if ($request->filled('gclid'))        $query->where('gclid', $request->gclid);

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

        // Filter by Conversion
        if ($request->boolean('only_conversions')) {
            $query->where('click_count', '>', 0);
        }

        // Filter by Device
        if ($request->filled('device') && $request->device !== 'all') {
            $query->where('device_type', $request->device);
        }

        // Filter by Country
        if ($request->filled('country') && $request->country !== 'all') {
            $query->where('country_code', $request->country);
        }

        // Date Range (Optimized for Index Usage: avoiding whereDate)
        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date . ' 00:00:00');
        }
        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
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

        // FIX 2: Bulk check for returning users to avoid N+1 queries
        $ipHashes = $events->pluck('ip_hash')->unique()->toArray();
        $earliestDate = $events->min('created_at');
        
        $returningHashes = AdTrackEvent::whereIn('ip_hash', $ipHashes)
            ->where('organization_id', $organization->id)
            ->where('created_at', '<', $earliestDate)
            ->distinct()
            ->pluck('ip_hash')
            ->flip()
            ->toArray();

        $events->getCollection()->transform(function($event) use ($returningHashes) {
            $event->is_returning = isset($returningHashes[$event->ip_hash]);
            return $event;
        });

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

    if ($request->filled('device') && $request->device !== 'all') $query->where('device_type', $request->device);
    if ($request->filled('country') && $request->country !== 'all') $query->where('country_code', $request->country);
    
    if ($request->filled('search')) {
        $s = $request->search;
        $query->where(function($q) use ($s) {
            $q->where('session_id', 'like', "%$s%")
              ->orWhere('page_url', 'like', "%$s%")
              ->orWhere('city', 'like', "%$s%");
        });
    }

    if ($request->boolean('exclude_bots')) {
        $query->where('is_bot', false);
    }
    if ($request->filled('utm_source'))   $query->where('utm_source', 'like', '%' . $request->utm_source . '%');
    if ($request->filled('utm_medium'))   $query->where('utm_medium', 'like', '%' . $request->utm_medium . '%');
    if ($request->filled('utm_campaign')) $query->where('utm_campaign', 'like', '%' . $request->utm_campaign . '%');
    if ($request->filled('gclid'))        $query->where('gclid', $request->gclid);
    

        $events = $query->orderBy('created_at', 'desc')->limit(5000)->get();

        $columns = [
            'ID', 'Timestamp', 'Session ID', 'Campaign ID', 'GCLID', 
            'Page URL', 'Device', 'Location', 'Clicks', 'Duration (s)', 'Is Bot'
        ];

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=intelligence_log_".now()->format('Y-m-d').".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

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
                    $e->duration_seconds,
                    $e->is_bot ? 'YES' : 'NO'
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

        $pixelSites = $organization->pixelSites()
        ->withCount(['adTrackEvents as total_hits'])
        ->withCount(['adTrackEvents as hits_last_24h' => function ($q) {
            $q->where('created_at', '>=', now()->subHours(24));
        }])
        ->get()
        ->map(function ($site) {
            $lastEvent = $site->adTrackEvents()
                ->orderBy('created_at', 'desc')
                ->first(['created_at', 'page_url']);

            $lastHitDomain = $lastEvent?->page_url ? parse_url($lastEvent->page_url, PHP_URL_HOST) : null;

            $pixelVerified = (bool) $site->pixel_verified_at;
            $recentlyActive = $site->hits_last_24h > 0;

            if ($pixelVerified && $recentlyActive) {
                $status = 'verified_active';
            } elseif ($site->total_hits > 0) {
                $status = 'connected_inactive';
            } else {
                $status = 'not_detected';
            }

            return [
                'id'                => $site->id,
                'label'             => $site->label,
                'ads_site_token'    => $site->ads_site_token,
                'connected'         => $site->total_hits > 0,
                'pixel_verified'    => $pixelVerified,
                'pixel_verified_at' => $site->pixel_verified_at?->toIso8601String(),
                'allowed_domain'    => $site->allowed_domain,
                'last_hit_at'       => $lastEvent?->created_at?->toIso8601String(),
                'last_hit_domain'   => $lastHitDomain,
                'total_hits'        => $site->total_hits,
                'hits_last_24h'     => $site->hits_last_24h,
                'enabled_modules'   => $site->enabled_modules,
                'tracking_enabled'  => (bool) $site->tracking_enabled,
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
     * Save the enabled modules for a specific pixel site.
     */
    public function saveModules(Request $request)
    {
        $request->validate([
            'pixel_site_id' => 'required|integer|exists:pixel_sites,id',
            'modules'       => 'required|array',
            'modules.*'     => 'string|in:click,schema,seo,behavior',
        ]);

        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $pixelSite = $organization->pixelSites()->findOrFail($request->pixel_site_id);

        $pixelSite->update([
            'enabled_modules' => $request->modules,
        ]);

        return response()->json([
            'enabled_modules' => $pixelSite->enabled_modules,
            'message'         => 'Tracker modules updated successfully. These modules are now enforced for this site.',
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

        $orgId        = $organization->id;
        $pixelSiteId  = $request->pixel_site_id;
        $excludeBots  = $request->boolean('exclude_bots');
        $pagesPage    = max(1, (int) $request->input('pages_page', 1));
        $pagesPerPage = min(50, max(1, (int) $request->input('pages_per_page', 10)));
        $normalizeIds = $request->boolean('normalize_ids', false);

        /** @var CdnAnalyticsService $engine */
        $engine = app(CdnAnalyticsService::class);

        $cacheKey = CdnAnalyticsService::cacheKey(
            $orgId,
            $pixelSiteId,
            $excludeBots,
            $pagesPage,
            $pagesPerPage
        );

        // ── 1. Priority: Instant Cache Read ──────────────────────────────────
        if (Cache::has($cacheKey)) {
            $data = Cache::get($cacheKey);
            // If the user requested dynamic ID normalization but the cache doesn't match,
            // we force a re-compute (rare edge case).
            if (isset($data['path_intelligence']) && $data['path_intelligence']['collapse_ids_active'] === $normalizeIds) {
                return response()->json($data);
            }
        }

        // ── 2. Fallback: On-Demand Computation ────────────────────────────────
        try {
            $result = Cache::remember($cacheKey, 600, function () use (
                $engine, $orgId, $pixelSiteId, $excludeBots, $pagesPage, $pagesPerPage, $normalizeIds
            ) {
                $payload = $engine->fetchDataForOrg(
                    $orgId,
                    $pixelSiteId,
                    $excludeBots,
                    $pagesPage,
                    $pagesPerPage
                );

                // Inject dynamic normalization flag
                $payload['meta']['normalize_ids'] = $normalizeIds;

                return $engine->analyze($payload);
            });

            return response()->json($result);

        } catch (\Throwable $e) {
            Log::error('CDN analytics on-demand failure', [
                'org_id' => $orgId,
                'error'  => $e->getMessage()
            ]);
            return response()->json(['error' => 'Analytics engine is currently busy. Please try again in a few moments.'], 503);
        }
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

        $botSignals = [
            'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot', 
            'Sogou', 'Exabot', 'facebot', 'ia_archiver', 'AdsBot-Google', 'Mediapartners-Google',
            'Twitterbot', 'facebookexternalhit', 'LinkedInBot'
        ];
        $isBot = false;
        foreach ($botSignals as $signal) {
            if (stripos($ua, $signal) !== false) {
                $isBot = true;
                break;
            }
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

        return ['browser' => $browser, 'platform' => $platform, 'device_type' => $device, 'is_bot' => $isBot];
    }





    /**
     * Get aggregated web analysis data for the Developers "Web Analysis" tab.
     */
    public function webAnalysis(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) return response()->json(['error' => 'Organization not found'], 404);

        $pixelSiteId = $request->input('pixel_site_id');
        $orgId = $organization->id;
        
        // Cache Key varies by pixel_site_id and pagination
        $cacheKey = "web_analysis_v2_{$orgId}_site_" . ($pixelSiteId ?? 'all') . 
                    "_p" . $request->input('sitemaps_page', 1) . 
                    "_lp" . $request->input('per_page', 25) . 
                    "_s" . md5($request->input('search', ''));

        return Cache::remember($cacheKey, 300, function() use ($organization, $orgId, $request, $pixelSiteId) {
            $pixelSite = $pixelSiteId ? PixelSite::where('organization_id', $orgId)->find($pixelSiteId) : null;

        // 1. Sitemaps (with Pagination)
        $sitemapsPage = $request->input('sitemaps_page', 1);
        $sitemapsPerPage = $request->input('sitemaps_per_page', 6);
        
        $paginatedSitemaps = $organization->sitemaps()
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->withCount('links')
            ->paginate($sitemapsPerPage, ['*'], 'sitemaps_page', $sitemapsPage);

        $sitemaps = collect($paginatedSitemaps->items())->map(function($s) {
            return [
                'id'                => $s->id,
                'name'              => $s->name,
                'site_url'          => $s->site_url,
                'links_count'       => $s->links_count,
                'last_crawl_status' => $s->last_crawl_status,
                'last_generated_at' => $s->last_generated_at ? $s->last_generated_at->diffForHumans() : 'Never',
                'is_discovery'      => (bool) $s->is_discovery,
                'crawl_mode'        => $s->crawl_mode ?? 'python',
            ];
        });

        // 2. SEO & AI Analysis Links
        $analysisLinksQuery = SitemapLink::whereHas('sitemap', function($q) use ($organization) {
            $q->where('organization_id', $organization->id);
        });

        if ($pixelSite && $pixelSite->allowed_domain) {
            $domain = preg_replace('/^www\./', '', $pixelSite->allowed_domain);
            $analysisLinksQuery->where('url', 'like', "%$domain%");
        }

        if ($request->filled('sitemap_id')) {
            $analysisLinksQuery->where('sitemap_id', $request->sitemap_id);
        }

        if ($request->filled('min_score')) {
            $analysisLinksQuery->where('seo_score', '>=', $request->min_score);
        }

        if ($request->filled('status')) {
            if ($request->status === 'ad_ready') {
                $analysisLinksQuery->where('cdn_engagement_score', '>=', 70);
            } elseif ($request->status === 'has_issues') {
                $analysisLinksQuery->whereNotNull('seo_bottlenecks')
                                  ->where('seo_bottlenecks', '!=', '[]')
                                  ->where('seo_bottlenecks', '!=', '');
            }
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $analysisLinksQuery->where(function($q) use ($s) {
                $q->where('url', 'like', "%$s%")
                  ->orWhere('title', 'like', "%$s%");
            });
        }

        $perPage = $request->input('per_page', 25);
        $paginatedLinks = $analysisLinksQuery->whereNotNull('seo_audit')
            ->orderByDesc('cdn_engagement_score')
            ->paginate($perPage);

        $analysisLinks = collect($paginatedLinks->items())->map(function($link) {
            return [
                'id' => $link->id,
                'url' => $link->url,
                'title' => $link->title,
                'description' => $link->description,
                'h1' => $link->h1,
                'http_status' => $link->http_status,
                'load_time' => $link->load_time,
                'seo_score' => $link->cdn_insight['seo_score'] ?? $link->seo_score,
                'unified_score' => $link->cdn_insight['unified_score'] ?? 0,
                'is_ad_ready' => $link->cdn_insight['is_ad_ready'] ?? false,
                'seo_bottlenecks' => $link->seo_bottlenecks,
                'seo_audit' => $link->seo_audit,
                'schema_suggestions' => $link->schema_suggestions,
            ];
        });

        // 3. JS Error Summary
        $errorSummary = CdnError::where('organization_id', $organization->id)
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw("COUNT(*) as total, 
                COUNT(DISTINCT url) as unique_urls,
                COUNT(DISTINCT message) as unique_messages")
            ->first();

        // 4. AI Schema Status
        $schemaStats = CdnPageSchema::where('pixel_site_id', $pixelSiteId ?: 0) // Filter by site if selected
            ->when(!$pixelSiteId, function($q) use ($organization) {
                $q->whereHas('pixelSite', fn($site) => $site->where('organization_id', $organization->id));
            })
            ->selectRaw("COUNT(*) as total_schemas, 
                SUM(injected_count) as total_injections,
                SUM(CASE WHEN has_conflict = 1 THEN 1 ELSE 0 END) as conflicts")
            ->first();

        // 5. 7-Day Trend Analytics
        $days = collect(range(6, 0))->map(fn($d) => now()->subDays($d)->format('Y-m-d'));
        
        $errorTrend = CdnError::where('organization_id', $organization->id)
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->groupBy('date')
            ->get()
            ->pluck('count', 'date');

        $injectionTrend = CdnPageSchema::where('pixel_site_id', $pixelSiteId ?: 0)
            ->when(!$pixelSiteId, function($q) use ($organization) {
                $q->whereHas('pixelSite', fn($site) => $site->where('organization_id', $organization->id));
            })
            ->where('last_injected_at', '>=', now()->subDays(7))
            ->selectRaw("DATE(last_injected_at) as date, SUM(injected_count) as count")
            ->groupBy('date')
            ->get()
            ->pluck('count', 'date');

        // Global Health Score (Optimized Memory Usage with cursor())
        $sitemapService = app(\App\Services\SitemapService::class);
        $totalLinksQuery = SitemapLink::whereHas('sitemap', function($q) use ($organization) {
            $q->where('organization_id', $organization->id);
        });

        $totalScore = 0;
        $count = 0;
        foreach ($totalLinksQuery->cursor() as $link) {
            $totalScore += $sitemapService->calculateSeoScore($link);
            $count++;
        }
        $healthScore = $count > 0 ? $totalScore / $count : 0;

        return response()->json([
            'sitemaps'       => $sitemaps,
            'analysis_links' => $analysisLinks,
            'health_score'   => round($healthScore),
            'pagination'     => [
                'current_page' => $paginatedLinks->currentPage(),
                'last_page'    => $paginatedLinks->lastPage(),
                'total'        => $paginatedLinks->total(),
                'per_page'     => $paginatedLinks->perPage(),
            ],
            'sitemaps_pagination' => [
                'current_page' => $paginatedSitemaps->currentPage(),
                'last_page'    => $paginatedSitemaps->lastPage(),
                'total'        => $paginatedSitemaps->total(),
                'per_page'     => $paginatedSitemaps->perPage(),
            ],
            'filters'        => [
                'search' => $request->search,
            ],
            'error_summary'  => $errorSummary,
            'schema_stats'   => $schemaStats,
            'trends'         => [
                'labels'     => $days->map(fn($d) => now()->parse($d)->format('M d')),
                'errors'     => $days->map(fn($d) => $errorTrend->get($d, 0)),
                'injections' => $days->map(fn($d) => (int) $injectionTrend->get($d, 0)),
            ],
        ]);
    });
}

    /**
     * Export web analysis as a professional PDF report.
     */
    public function downloadPdf(Request $request)
    {
        // Increase limits for potentially heavy PDF generation
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $organization = $request->user()->currentOrganization();
        if (!$organization) abort(404);

        $pixelSiteId = $request->input('pixel_site_id');
        $pixelSite = $pixelSiteId ? PixelSite::where('organization_id', $organization->id)->find($pixelSiteId) : null;

        // Reuse webAnalysis logic but with larger limits for PDF
        $sitemaps = $organization->sitemaps()->withCount('links')->get();
        
        $analysisLinksQuery = SitemapLink::whereHas('sitemap', function($q) use ($organization) {
            $q->where('organization_id', $organization->id);
        });

        if ($pixelSite && $pixelSite->allowed_domain) {
            $domain = preg_replace('/^www\./', '', $pixelSite->allowed_domain);
            $analysisLinksQuery->where('url', 'like', "%$domain%");
        }

        // 1. Calculate Average SEO Health safely using chunks to avoid memory spikes
        $totalLinksForScore = 0;
        $runningScoreSum = 0;

        // Clone query to avoid state corruption during chunking
        $scoreQuery = (clone $analysisLinksQuery)->whereNotNull('seo_audit')
            ->select(['id', 'sitemap_id', 'url', 'seo_audit', 'cdn_engagement_score', 'cdn_active']);

        $scoreQuery->chunk(100, function($chunk) use (&$totalLinksForScore, &$runningScoreSum) {
            foreach ($chunk as $link) {
                $runningScoreSum += $link->cdn_insight['seo_score'] ?? 0;
                $totalLinksForScore++;
            }
        });

        $overallScore = $totalLinksForScore > 0 ? round($runningScoreSum / $totalLinksForScore) : 0;

        // 2. Fetch the top 100 links for the actual PDF table (High Impact Pages)
        $analysisLinks = (clone $analysisLinksQuery)->whereNotNull('seo_audit')
            ->orderByDesc('cdn_engagement_score')
            ->limit(100)
            ->get();

        // 3. Acquisition Analytics Aggregation (Matching dashboard logic)
        $thirtyDaysAgo = now()->subDays(29)->startOfDay();
        $geoRaw = AdTrackEvent::where('organization_id', $organization->id)
            ->when($pixelSiteId, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("country_code, city, device_type, referrer, COUNT(*) as count")
            ->groupBy('country_code', 'city', 'device_type', 'referrer')
            ->get();

        $byCountry = $geoRaw->groupBy('country_code')
            ->map(fn($group, $code) => ['code' => $code ?: 'Unknown', 'count' => $group->sum('count')])
            ->sortByDesc('count')->values()->take(6);

        $byDevice = $geoRaw->groupBy('device_type')
            ->map(fn($group, $type) => ['name' => $type ?: 'Desktop', 'count' => $group->sum('count')])
            ->sortByDesc('count')->values();

        $byCity = $geoRaw->filter(fn($r) => !empty($r->city))
            ->groupBy('city')
            ->map(fn($group, $city) => ['name' => $city, 'count' => $group->sum('count')])
            ->sortByDesc('count')->values()->take(6);

        $topReferrers = $geoRaw->filter(fn($r) => !empty($r->referrer))
            ->groupBy(fn($r) => strtolower(parse_url($r->referrer, PHP_URL_HOST) ?? $r->referrer))
            ->map(fn($group, $domain) => ['domain' => $domain, 'count' => $group->sum('count')])
            ->sortByDesc('count')->values()->take(5);

        $errorSummary = CdnError::where('organization_id', $organization->id)
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw("COUNT(*) as total, 
                COUNT(DISTINCT url) as unique_urls,
                COUNT(DISTINCT message) as unique_messages")
            ->first();

        // Fix schemaStats query to avoid pixel_site_id = 0 issues
        $schemaStatsQuery = CdnPageSchema::query();
        if ($pixelSiteId) {
            $schemaStatsQuery->where('pixel_site_id', $pixelSiteId);
        } else {
            $schemaStatsQuery->whereHas('pixelSite', fn($site) => $site->where('organization_id', $organization->id));
        }

        $schemaStats = $schemaStatsQuery->selectRaw("COUNT(*) as total_schemas, 
                SUM(injected_count) as total_injections,
                SUM(CASE WHEN has_conflict = 1 THEN 1 ELSE 0 END) as conflicts")
            ->first();

        $pdf = Pdf::loadView('pdf.web-analysis', [
            'organization'   => $organization,
            'pixelSite'      => $pixelSite,
            'sitemaps'       => $sitemaps,
            'analysisLinks'  => $analysisLinks,
            'errorSummary'   => $errorSummary,
            'schemaStats'    => $schemaStats,
            'overallScore'   => $overallScore,
            'byCountry'      => $byCountry,
            'byDevice'       => $byDevice,
            'byCity'         => $byCity,
            'topReferrers'   => $topReferrers,
            'totalHits30d'   => $geoRaw->sum('count'),
            'generatedAt'    => now()->format('M d, Y H:i'),
        ]);

        return $pdf->download('web-analytics-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Return the last 20 auto-generated CDN schemas for the authenticated org.
     * Used by the Schema Debug panel in the Web Analysis > Health tab.
     */
    public function schemaDebug(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) return response()->json(['error' => 'Organization not found'], 404);

        $pixelSiteId = $request->input('pixel_site_id');

        $perPage = $request->input('per_page', 10);
        $paginatedSchemas = CdnPageSchema::whereHas('pixelSite', fn($q) => $q->where('organization_id', $organization->id))
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->where('is_auto_generated', true)
            ->orderByDesc('last_injected_at')
            ->paginate($perPage);

        $schemas = collect($paginatedSchemas->items())->map(fn($s) => [
            'id'               => $s->id,
            'url'              => $s->url,
            'schema_type'      => $s->schema_type,
            'injected_count'   => $s->injected_count,
            'last_injected_at' => $s->last_injected_at?->diffForHumans(),
            'schema_preview'   => json_encode($s->schema_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        ]);

        return response()->json([
            'schemas' => $schemas,
            'pagination' => [
                'current_page' => $paginatedSchemas->currentPage(),
                'last_page'    => $paginatedSchemas->lastPage(),
                'total'        => $paginatedSchemas->total(),
                'per_page'     => $paginatedSchemas->perPage(),
            ]
        ]);
    }

    /**
     * Get paginated client-side errors for the organization.
     */
    public function errors(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) return response()->json(['error' => 'Organization not found'], 404);

        $query = CdnError::where('organization_id', $organization->id);

        if ($request->filled('pixel_site_id')) {
            $query->where('pixel_site_id', $request->pixel_site_id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('message', 'like', "%$s%")
                  ->orWhere('stack', 'like', "%$s%")
                  ->orWhere('url', 'like', "%$s%");
            });
        }

        $perPage = $request->input('per_page', 25);
        $errors = $query->with('pixelSite:id,label')->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($errors);
    }

    // -------------------------------------------------------------------------
    // Discovery Helpers
    // -------------------------------------------------------------------------

    /**
     * Enable CDN Silent Discovery for the organisation.
     *
     * Creates or updates the discovery sitemap to crawl_mode=cdn,
     * then returns the sitemap's current state + how many pages discovered so far.
     * The CDN pixel will start populating SitemapLinks passively on each page hit.
     */
    public function enableCdnDiscovery(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) return response()->json(['error' => 'Organization not found'], 404);

        // Require an active pixel site for the selected site or any connected site
        $pixelSiteId = $request->input('pixel_site_id');
        $pixelSite = $pixelSiteId
            ? PixelSite::where('organization_id', $organization->id)->find($pixelSiteId)
            : PixelSite::where('organization_id', $organization->id)->whereNotNull('pixel_verified_at')->first();

        if (!$pixelSite) {
            return response()->json([
                'error'   => 'No verified CDN pixel found. Install the tracking pixel on your site first.',
                'success' => false,
            ], 422);
        }

        // Upsert discovery sitemap with CDN mode (Site-Specific)
        $sitemap = Sitemap::updateOrCreate(
            [
                'organization_id' => $organization->id, 
                'pixel_site_id'   => $pixelSite->id,
                'is_discovery'    => true
            ],
            [
                'user_id'    => $request->user()->id,
                'name'       => 'CDN Discovery — ' . ($pixelSite->allowed_domain ?? $pixelSite->label),
                'site_url'   => $pixelSite->allowed_domain ? 'https://' . $pixelSite->allowed_domain : null,
                'filename'   => 'cdn-discovery-' . $pixelSite->id . '-' . $organization->id . '.xml',
                'crawl_mode' => 'cdn',
                'is_index'   => false,
            ]
        );

        $discoveredCount = $sitemap->links()->count();

        return response()->json([
            'success'          => true,
            'message'          => 'Silent CDN discovery is now active. Pages will appear automatically as users visit them.',
            'sitemap_id'       => $sitemap->id,
            'discovered_count' => $discoveredCount,
            'pixel_domain'     => $pixelSite->allowed_domain ?? $pixelSite->label,
        ]);
    }

    /**
     * Return paginated list of CDN-discovered pages for the organisation.
     * Shows most recently seen pages first, with CDN hit counts.
     */
    public function discoveredPages(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) return response()->json(['error' => 'Organization not found'], 404);

        $pixelSiteId = $request->input('pixel_site_id');

        $discoverySitemap = Sitemap::where('organization_id', $organization->id)
            ->where('is_discovery', true)
            ->when($pixelSiteId, fn($q) => $q->where('pixel_site_id', $pixelSiteId))
            ->first();

        if (!$discoverySitemap) {
            return response()->json(['pages' => [], 'total' => 0, 'sitemap_id' => null, 'crawl_mode' => 'python']);
        }

        $perPage = $request->input('per_page', 10);
        $paginatedPages = $discoverySitemap->links()
            ->orderByDesc('cdn_last_seen_at')
            ->paginate($perPage);

        $pages = collect($paginatedPages->items())->map(fn($link) => [
            'id'              => $link->id,
            'url'             => $link->url,
            'title'           => $link->title,
            'cdn_hit_count'   => $link->cdn_hit_count,
            'cdn_last_seen_at'=> $link->cdn_last_seen_at?->diffForHumans(),
            'seo_score'       => $link->cdn_insight['seo_score'] ?? null,
            'status_code'     => $link->status_code,
        ]);

        return response()->json([
            'pages'      => $pages,
            'total'      => $paginatedPages->total(),
            'pagination' => [
                'current_page' => $paginatedPages->currentPage(),
                'last_page'    => $paginatedPages->lastPage(),
                'total'        => $paginatedPages->total(),
                'per_page'     => $paginatedPages->perPage(),
            ],
            'sitemap_id' => $discoverySitemap->id,
            'crawl_mode' => $discoverySitemap->crawl_mode,
        ]);
    }


    /**
     * Manually trigger JSON-LD schema generation for a specific URL.
     */
    public function generateSchemaForUrl(Request $request)
    {
        $request->validate([
            'pixel_site_id' => 'required|integer|exists:pixel_sites,id',
            'url'           => 'required|url',
        ]);

        $organization = $request->user()->currentOrganization();
        $pixelSite = $organization->pixelSites()->findOrFail($request->pixel_site_id);

        // 1. Try to find metadata from recent hits
        $lastHit = AdTrackEvent::where('pixel_site_id', $pixelSite->id)
            ->where('page_url', $request->url)
            ->whereNotNull('metadata')
            ->orderByDesc('created_at')
            ->first();

        $metadata = $lastHit?->metadata ?? [];

        // 2. If metadata is missing/incomplete, try to scrape basic tags
        if (empty($metadata['title']) && empty($metadata['h1'])) {
            try {
                $response = Http::timeout(5)->get($request->url);
                if ($response->successful()) {
                    $html = $response->body();
                    preg_match('/<title>(.*?)<\/title>/is', $html, $matches);
                    $metadata['title'] = $matches[1] ?? null;
                    
                    if (preg_match('/<meta name="description" content="(.*?)"/is', $html, $matches)) {
                        $metadata['description'] = $matches[1];
                    }
                    if (preg_match('/<h1>(.*?)<\/h1>/is', $html, $matches)) {
                        $metadata['h1'] = strip_tags($matches[1]);
                    }
                    if (preg_match('/<meta property="og:image" content="(.*?)"/is', $html, $matches)) {
                        $metadata['og_image'] = $matches[1];
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Manual Schema Scraping Failure: " . $e->getMessage());
            }
        }

        // 3. Generate schema (Asynchronous dispatch - FIX 5)
        GenerateCdnSchemaJob::dispatch($pixelSite, $request->url, $metadata);

        return response()->json([
            'success' => true,
            'message' => 'AI Schema generation queued. It will be available shortly.',
        ], 202);
    }

    /**
     * Fetch the page source and its injected schema for diagnostic purposes.
     */
    public function getPageSource(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
        ]);

        $organization = $request->user()->currentOrganization();
        
        // Find a suitable pixel site for context
        $host = parse_url($request->url, PHP_URL_HOST);
        $pixelSite = PixelSite::where('organization_id', $organization->id)
            ->get()
            ->first(function($site) use ($host) {
                if (!$site->allowed_domain) return false;
                $clean = preg_replace('/^www\./', '', strtolower($site->allowed_domain));
                $hostClean = preg_replace('/^www\./', '', strtolower($host));
                return $clean === $hostClean || str_ends_with($hostClean, '.' . $clean);
            });

        $html = "Unable to fetch page source.";
        try {
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'MetaPilot-Diagnostic-Bot/1.0',
            ])->get($request->url);
            
            if ($response->successful()) {
                $html = $response->body();
            } else {
                $html = "Server returned status " . $response->status();
            }
        } catch (\Exception $e) {
            $html = "Error fetching source: " . $e->getMessage();
        }

        $schema = null;
        if ($pixelSite) {
            $urlHash = hash('sha256', $this->normalizeUrlForHash($request->url));
            $schema = CdnPageSchema::where('pixel_site_id', $pixelSite->id)
                ->where('url_hash', $urlHash)
                ->first();
        }

        return response()->json([
            'html'   => $html,
            'schema' => $schema ? $schema->schema_json : null,
            'url'    => $request->url,
        ]);
    }



    /**
     * Normalize a URL for consistent hashing (strips scheme, lowercases, trims trailing slash).
     */
    private function normalizeUrlForHash(?string $url): string
    {
        if (!$url) return '';
        $parsed = parse_url($url);
        $normalized = ($parsed['host'] ?? '') . ($parsed['path'] ?? '');
        return strtolower(rtrim($normalized, '/'));
    }
}
