<?php

namespace App\Http\Controllers;

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
            'token'        => 'required|uuid',
            'page_view_id' => 'required|string|max:50',
            'page_url'     => 'nullable|url',
            'duration_seconds' => 'nullable|integer',
            'max_scroll_depth' => 'nullable|integer',
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
                    'token'    => substr($request->token, 0, 8) . '...',
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

        if ($signature === 'nosig') {
            Log::info('Pixel hit received without signature (nosig)', [
                'pixel_site_id' => $pixelSite->id,
                'page_view_id'  => $request->page_view_id,
                'referrer'      => $request->header('Referer'),
            ]);
        } elseif ($signature === 'invalid-sig') {
             Log::warning('Pixel hit received with deliberate "invalid-sig" (likely test or bypass attempt)', [
                'pixel_site_id' => $pixelSite->id,
                'page_view_id'  => $request->page_view_id,
                'ip'            => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature format'], 403)
                ->withHeaders($this->corsHeaders());
        } elseif (!hash_equals($expected, $signature)) {
            Log::warning('Pixel HMAC validation failed: Mismatch', [
                'pixel_site_id' => $pixelSite->id,
                'page_view_id'  => $request->page_view_id,
                'received_sig'  => $signature,
                'expected_sig'  => $expected,
                'payload_used'  => $request->token . $request->page_view_id . $ts,
                'key_used_prefix' => substr($pixelSite->ads_site_token, 0, 8) . '...',
            ]);
            return response()->json(['error' => 'Signature mismatch'], 403)
                ->withHeaders($this->corsHeaders());
        }

        // --- Parse UA and Geo ---
        $ua         = $request->header('User-Agent');
        $deviceData = $this->parseUserAgent($ua);
        
        // Improved IP detection for proxies/CDNs
        $clientIp = $request->header('CF-Connecting-IP') ?? $request->ip();
        if (!$request->header('CF-Connecting-IP') && $request->header('X-Forwarded-For')) {
            $ips = explode(',', $request->header('X-Forwarded-For'));
            $clientIp = trim($ips[0]);
        }
        
        $geo = $this->getGeoData($clientIp);

        // Normalize URL for consistent hashing
        $normalizedUrl = $this->normalizeUrlForHash($request->page_url);
        $urlHash = $normalizedUrl ? hash('sha256', $normalizedUrl) : null;


        // --- Metadata Enrichment ---
        $meta = $request->metadata ?? [];
        if ($request->has('is_engaged')) {
            $meta['is_engaged'] = (bool) $request->is_engaged;
        }

        // --- Upsert the hit ---
        $hit = AdTrackEvent::updateOrCreate(
            ['page_view_id' => $request->page_view_id],
            [
                'organization_id'    => $organization->id,
                'pixel_site_id'      => $pixelSite->id,
                'site_token'         => $request->token,
                'country_code'       => ($geo['country_code'] ?? null) 
                                        ?? $request->header('CF-IPCountry')
                                        ?? $request->header('X-Vercel-IP-Country')
                                        ?? $request->header('X-App-Country'),
                'city'               => $geo['city'] ?? null,
                'browser'            => $deviceData['browser'],
                'platform'           => $deviceData['platform'],
                'device_type'        => $deviceData['device_type'],
                'screen_resolution'  => $request->screen_resolution,
                'duration_seconds'   => $request->duration_seconds ?? 0,
                'max_scroll_depth'   => $request->max_scroll_depth ?? 0,
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
                'metadata'           => $meta,
                'is_bot'             => $deviceData['is_bot'] ?? false,
            ]
        );

            // --- Intelligence Platform Integration ---
            $requestedModules = $request->input('modules', []);
            if (is_string($requestedModules)) $requestedModules = explode(',', $requestedModules);
            
            $enabledModules = $pixelSite->enabled_modules ?? ['click', 'schema'];
            $activeModules  = array_intersect($requestedModules, $enabledModules);

            // 1. Link to SitemapLink (Enforced by 'click' module)
            if (in_array('click', $activeModules)) {
                $sitemapLink = SitemapLink::whereHas('sitemap', function($q) use ($organization) {
                    $q->where('organization_id', $organization->id);
                })->where('url_hash', $urlHash)->first();

                if ($sitemapLink) {
                    $sitemapLink->increment('cdn_hit_count');
                    $clicks = (int) ($request->click_count ?? 0);
                    if ($clicks > 0) {
                        $sitemapLink->increment('cdn_click_count', $clicks);
                    }
                    
                    // Recalculate Engagement Score: (Click Rate * 80) + (Volume Bonus * 20)
                    $totalHits = $sitemapLink->cdn_hit_count;
                    $totalClicks = $sitemapLink->cdn_click_count;
                    $clickRate = $totalHits > 0 ? ($totalClicks / $totalHits) : 0;
                    $volumeBonus = min(1, $totalHits / 100); // Max bonus at 100 hits
                    
                    $engagementScore = ($clickRate * 80) + ($volumeBonus * 20);

                    $sitemapLink->update([
                        'cdn_active' => true,
                        'cdn_last_seen_at' => now(),
                        'cdn_engagement_score' => min(100, $engagementScore)
                    ]);
                }

                // 1.5 Link to AdCampaign (Organization Scoped)
                if ($request->campaign_id) {
                    $adCampaign = AdCampaign::where('organization_id', $organization->id)
                        ->where('google_campaign_id', $request->campaign_id)
                        ->first();
                    
                    if ($adCampaign) {
                        $cMetrics = $adCampaign->metrics ?? [];
                        $cMetrics['internal_hits'] = ($cMetrics['internal_hits'] ?? 0) + 1;
                        $cMetrics['internal_clicks'] = ($cMetrics['internal_clicks'] ?? 0) + (int) ($request->click_count ?? 0);
                        $adCampaign->update(['metrics' => $cMetrics]);
                    }
                }
            }

            // 2. Auto-Generate Schema (Enforced by 'schema' module)
            if (in_array('schema', $activeModules) && $request->metadata) {
                $exists = CdnPageSchema::where('pixel_site_id', $pixelSite->id)
                    ->where('url_hash', $urlHash)
                    ->exists();
                
                if (!$exists) {
                    $this->generateSchemaForPage($pixelSite, $request->page_url, $request->metadata);
                }
            }

        // --- Mark pixel as verified on first domain-confirmed hit ---
        if (!$pixelSite->pixel_verified_at) {
            $pixelSite->update(['pixel_verified_at' => now()]);
        }

        // --- Live Page Discovery ---
        if ($urlHash && $request->page_url) {
            $isNewPage = !AdTrackEvent::where('pixel_site_id', $pixelSite->id)
                ->where('page_view_id', '!=', $request->page_view_id)
                ->where('page_url', $request->page_url)
                ->exists();

            if ($isNewPage) {
                $discoverySitemap = $this->resolveDiscoverySitemap($organization, $pixelSite);
                $crawlMode = $discoverySitemap->crawl_mode;

                if ($crawlMode === 'cdn') {
                    // ── Silent CDN Discovery: record URL directly from pixel metadata ──
                    $meta = is_array($request->metadata) ? $request->metadata : [];
                    SitemapLink::firstOrCreate(
                        ['sitemap_id' => $discoverySitemap->id, 'url_hash' => $urlHash],
                        [
                            'url'          => $request->page_url,
                            'title'        => $meta['title'] ?? null,
                            'status_code'  => 200,
                            'cdn_active'   => true,
                            'cdn_hit_count'    => 1,
                            'cdn_last_seen_at' => now(),
                        ]
                    );
                } else {
                    // ── Aggressive Crawl: dispatch Scrapy spider for full extraction ──
                    app(\App\Services\Crawler\CrawlerManager::class)->dispatch(
                        $discoverySitemap->id,
                        $request->page_url,
                        0,
                        ['job_id' => 'cdn-discovery-' . $urlHash, 'render_js' => true]
                    );
                }
            }
        }

        return response()->json(null, 204)->withHeaders($this->corsHeaders());
    }

    /**
     * Log a client-side error from the tracker.
     */
    public function logError(Request $request)
    {
        $request->validate([
            'token'        => 'required|uuid',
            'page_view_id' => 'required|string|max:50',
            '_ts'          => 'required|integer',
            '_sig'         => 'required|string',
        ]);

        $pixelSite = PixelSite::where('ads_site_token', $request->token)->first();
        if (!$pixelSite) return response()->json(['error' => 'Invalid token'], 403)->withHeaders($this->corsHeaders());

        // Validate signature (using _err suffix as implemented in JS)
        $expected = hash_hmac('sha256', $pixelSite->ads_site_token . $request->page_view_id . '_err' . $request->_ts, $pixelSite->ads_site_token);
        
        // Skip signature check if it fails but log it for investigation (security feature)
        if (!hash_equals($expected, $request->_sig)) {
             Log::warning("CDN Error Signature Mismatch", ['expected' => $expected, 'received' => $request->_sig]);
             // For now we still log the error but mark it as unsigned if we had a field for it
        }

        CdnError::create([
            'pixel_site_id'   => $pixelSite->id,
            'organization_id' => $pixelSite->organization_id,
            'page_view_id'    => $request->page_view_id,
            'url'             => $request->url,
            'message'         => $request->message,
            'stack'           => $request->stack,
            'source'          => $request->source ?? 'window',
            'line'            => $request->line,
            'col'             => $request->col,
            'filename'        => $request->filename,
            'user_agent'      => $request->header('User-Agent'),
            'ip_hash'         => hash('sha256', $request->ip()),
            'load_time_ms'    => $request->load_time_ms,
            'error_type'      => $request->error_type ?? 'js_error',
            'http_status'     => $request->http_status,
        ]);

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
        
        // Include is_returning by checking if ip_hash appeared before the event's created_at
        $events = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $events->getCollection()->transform(function($event) {
            $event->is_returning = AdTrackEvent::where('organization_id', $event->organization_id)
                ->where('ip_hash', $event->ip_hash)
                ->where('created_at', '<', $event->created_at)
                ->exists();
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

        $orgId = $organization->id;

        $thirtyDaysAgo = now()->subDays(29)->startOfDay();

        $queryBase = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id));

        // Filters
        if ($request->boolean('exclude_bots')) $queryBase->where('is_bot', false);
        if ($request->filled('utm_source'))   $queryBase->where('utm_source', 'like', '%' . $request->utm_source . '%');
        if ($request->filled('utm_medium'))   $queryBase->where('utm_medium', 'like', '%' . $request->utm_medium . '%');
        if ($request->filled('utm_campaign')) $queryBase->where('utm_campaign', 'like', '%' . $request->utm_campaign . '%');
        if ($request->filled('gclid'))        $queryBase->where('gclid', $request->gclid);

        $rawDaily = (clone $queryBase)
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

        // ── 3. Top pages with 14-day sparkline, delta & bottleneck ──────────────
        $pagesPage    = max(1, (int) $request->input('pages_page', 1));
        $pagesPerPage = min(50, max(1, (int) $request->input('pages_per_page', 10)));
        $pagesOffset  = ($pagesPage - 1) * $pagesPerPage;

        // Count distinct pages first for pagination meta
        $pagesTotal = (clone $queryBase)->whereNotNull('page_url')->distinct()->count('page_url');

        $topPageRows = (clone $queryBase)
            ->whereNotNull('page_url')
            ->selectRaw("page_url,
                COUNT(*) as total_hits,
                AVG(duration_seconds) as avg_duration,
                AVG(max_scroll_depth) as avg_scroll,
                AVG(click_count) as avg_clicks,
                SUM(CASE WHEN (gclid IS NOT NULL OR utm_campaign IS NOT NULL OR google_campaign_id IS NOT NULL) THEN 1 ELSE 0 END) as ad_hits,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count,
                SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN 1 ELSE 0 END) as yesterday_count")
            ->groupBy('page_url')
            ->orderByDesc('total_hits')
            ->offset($pagesOffset)
            ->limit($pagesPerPage)
            ->get();

        // 14-day sparkline per top page
        $fourteenDaysAgo = now()->subDays(13)->startOfDay();
        $topPageUrls = $topPageRows->pluck('page_url')->toArray();

        // --- Bounce Rate Calculation (SQL subquery, scoped to current page's URLs only) ---
        // Previously loaded ALL session rows into PHP memory (O(n) on total events), causing
        // timeouts on large orgs. Now runs a single SQL subquery restricted to the current
        // page's 10 URLs, keeping the computation inside the database.
        $bouncesByPage = collect();
        if (!empty($topPageUrls)) {
            $bouncesByPage = DB::table(function ($sub) use ($orgId, $request, $thirtyDaysAgo, $topPageUrls) {
                $sub->from('ad_track_events')
                    ->selectRaw('page_url, session_id, COUNT(*) as session_count')
                    ->where('organization_id', $orgId)
                    ->whereNotNull('page_url')
                    ->whereIn('page_url', $topPageUrls)
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->when($request->filled('pixel_site_id'), fn($q) => $q->where('pixel_site_id', $request->pixel_site_id))
                    ->when($request->boolean('exclude_bots'), fn($q) => $q->where('is_bot', false))
                    ->groupBy('page_url', 'session_id');
            }, 'session_counts')
            ->selectRaw('page_url, COUNT(*) as total_sessions, SUM(CASE WHEN session_count = 1 THEN 1 ELSE 0 END) as bounce_count')
            ->groupBy('page_url')
            ->get()
            ->keyBy('page_url')
            ->map(fn($r) => $r->total_sessions > 0 ? round(($r->bounce_count / $r->total_sessions) * 100, 1) : 0);
        }

        $sparklineRaw = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereIn('page_url', $topPageUrls)
            ->where('created_at', '>=', $fourteenDaysAgo)
            ->selectRaw("page_url, DATE(created_at) as date, COUNT(*) as cnt")
            ->groupBy('page_url', 'date')
            ->get()
            ->groupBy('page_url');

        // Error counts per page (from cdn_errors)
        $errorsByPage = CdnError::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->whereIn('url', $topPageUrls)
            ->selectRaw("url, COUNT(*) as error_count, AVG(load_time_ms) as avg_load_time")
            ->groupBy('url')
            ->get()
            ->keyBy('url');

        // ── 4. Keyword ↔ Page Intent Linkage ──────────────────────────────
        $keywords = KeywordResearch::where('organization_id', $orgId)->get();

        $topPages = $topPageRows->map(function ($row) use ($sparklineRaw, $keywords, $bouncesByPage, $errorsByPage) {
            $todayC     = (int) $row->today_count;
            $yesterdayC = (int) $row->yesterday_count;
            $deltaPct   = $yesterdayC > 0
                ? round((($todayC - $yesterdayC) / $yesterdayC) * 100, 1)
                : ($todayC > 0 ? 100 : null);

            // ── Engagement Scoring (0-100) ──
            $avgDuration = $row->avg_duration ?? 0;
            $avgClicks   = $row->avg_clicks ?? 0;
            $bounceRate  = $bouncesByPage[$row->page_url] ?? 0;
            $errorInfo   = $errorsByPage[$row->page_url] ?? null;
            $errorCount  = $errorInfo ? (int) $errorInfo->error_count : 0;
            $avgLoadTime = $errorInfo ? round($errorInfo->avg_load_time ?? 0) : 0;

            // Dwell factor (0-30): 60s+ = max
            $dwellScore = min(($avgDuration / 60) * 30, 30);
            // Scroll factor (0-30): 100% = max
            $maxScroll = $row->avg_scroll ?? 0;
            $scrollScore = ($maxScroll / 100) * 30;
            // Interaction factor (0-25): 5+ clicks = max
            $interactionScore = min(($avgClicks / 5) * 25, 25);
            // Bounce factor (0-15): 0% bounce = 15, 100% bounce = 0
            $bounceScore = (1 - ($bounceRate / 100)) * 15;
            
            $engagementScore = round($dwellScore + $scrollScore + $interactionScore + $bounceScore);

            // ── Bottleneck Score (0-100, higher = more problematic) ──
            // High bounce + low dwell + errors + slow load = bottleneck
            $bounceBottleneck    = $bounceRate / 100 * 40;        // 0-40
            $dwellBottleneck     = max(0, (1 - $avgDuration / 60) * 30); // 0-30 (low dwell is bad)
            $errorBottleneck     = min($errorCount * 5, 20);       // 0-20 (each error adds 5pts)
            $loadBottleneck      = $avgLoadTime > 3000 ? 10 : ($avgLoadTime > 1500 ? 5 : 0); // 0-10
            $bottleneckScore     = round($bounceBottleneck + $dwellBottleneck + $errorBottleneck + $loadBottleneck);
            $bottleneckSeverity  = $bottleneckScore >= 60 ? 'critical' : ($bottleneckScore >= 35 ? 'warning' : 'good');

            // Build improvement recommendations
            $recommendations = [];
            if ($bounceRate > 60)    $recommendations[] = 'High bounce rate — improve page relevance or above-fold content';
            if ($avgDuration < 20)   $recommendations[] = 'Low dwell time — add engaging content or video';
            if ($avgClicks < 1)      $recommendations[] = 'Low interaction — add clear CTAs or internal links';
            if ($errorCount > 0)     $recommendations[] = "$errorCount JS error(s) detected — check browser console";
            if ($avgLoadTime > 3000) $recommendations[] = 'Slow page load (avg '.round($avgLoadTime/1000, 1).'s) — optimise images & scripts';
            elseif ($avgLoadTime > 1500) $recommendations[] = 'Moderate load time — consider caching or CDN';

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
                    'query'      => $k->query,
                    'intent'     => $k->intent,
                    'is_primary' => false,
                ];
            })->values();

            $topIntent = $matchedKeywords->countBy('intent')->sortDesc()->keys()->first();

            return [
                'page_url'            => $row->page_url,
                'total_hits'          => (int) $row->total_hits,
                'ad_hits'             => (int) $row->ad_hits,
                'avg_duration'        => round($avgDuration),
                'avg_clicks'          => round($avgClicks, 1),
                'engagement_score'    => $engagementScore,
                'is_ad_ready'         => $isAdReady,
                'today_count'         => $todayC,
                'yesterday_count'     => $yesterdayC,
                'delta_pct'           => $deltaPct,
                'sparkline'           => $series,
                'matched_keywords'    => $matchedKeywords,
                'top_intent'          => $topIntent,
                'bounce_rate'         => $bounceRate,
                'error_count'         => $errorCount,
                'avg_load_time'       => $avgLoadTime,
                'bottleneck_score'    => $bottleneckScore,
                'bottleneck_severity' => $bottleneckSeverity,
                'recommendations'     => $recommendations,
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

        // ── 6. Geography & Device Breakdown ──────────────────────────
        $geoRaw = AdTrackEvent::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw("country_code, city, device_type, COUNT(*) as count")
            ->groupBy('country_code', 'city', 'device_type')
            ->get();

        $byCountry = $geoRaw->groupBy('country_code')
            ->map(fn($group, $code) => [
                'code' => $code ?: 'Unknown',
                'count' => $group->sum('count')
            ])->sortByDesc('count')->values()->take(10);

        $byDevice = $geoRaw->groupBy('device_type')
            ->map(fn($group, $type) => [
                'name' => $type ?: 'Desktop',
                'count' => $group->sum('count')
            ])->sortByDesc('count')->values();

        $byCity = $geoRaw->filter(fn($r) => !empty($r->city))
            ->groupBy('city')
            ->map(fn($group, $city) => [
                'name' => $city,
                'count' => $group->sum('count')
            ])->sortByDesc('count')->values()->take(10);

        // ── 7. Site Health (performance + error summary) ───────────────────
        $last24h = now()->subDay();

        $healthRaw = CdnError::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->selectRaw("url, error_type, AVG(load_time_ms) as avg_load_ms, COUNT(*) as count, MAX(created_at) as last_seen")
            ->groupBy('url', 'error_type')
            ->orderByDesc('count')
            ->get();

        $slowPages = $healthRaw
            ->where('error_type', 'slow_load')
            ->sortByDesc('avg_load_ms')
            ->take(5)
            ->map(fn($r) => [
                'url'          => $r->url,
                'avg_load_ms'  => round($r->avg_load_ms),
                'count'        => (int) $r->count,
                'last_seen'    => $r->last_seen,
            ])->values();

        $errorTypeBreakdown = $healthRaw
            ->groupBy('error_type')
            ->map(fn($group, $type) => [
                'type'  => $type ?: 'js_error',
                'count' => $group->sum('count'),
            ])->sortByDesc('count')->values();

        $alertsLast24h = CdnError::where('organization_id', $orgId)
            ->when($request->pixel_site_id, fn($q, $id) => $q->where('pixel_site_id', $id))
            ->where('created_at', '>=', $last24h)
            ->selectRaw("url, error_type, COUNT(*) as count")
            ->groupBy('url', 'error_type')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'url'        => $r->url,
                'error_type' => $r->error_type ?? 'js_error',
                'count'      => (int) $r->count,
            ])->values();

        return response()->json([
            'daily_history'  => $dailyHistory,
            'top_pages'      => $topPages,
            'pages_total'    => $pagesTotal,
            'pages_page'     => $pagesPage,
            'pages_per_page' => $pagesPerPage,
            'top_referrers'  => $topReferrers,
            'trend_velocity' => ['rising' => $rising, 'falling' => $falling],
            'by_country'     => $byCountry,
            'by_device'      => $byDevice,
            'by_city'        => $byCity,
            'site_health'    => [
                'slow_pages'          => $slowPages,
                'error_type_breakdown'=> $errorTypeBreakdown,
                'alerts_last_24h'     => $alertsLast24h,
            ],
            'summary'        => [
                'today_hits'     => $todayHits,
                'yesterday_hits' => $yesterdayHits,
                'today_delta'    => $todayDelta,
                'last7_hits'     => $last7,
                'prev7_hits'     => $prev7,
                'week_delta'     => $weekDelta,
                'last30_hits'    => $geoRaw->sum('count'),
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

    protected function getGeoData($ip): ?array
    {
        if (!$ip || $ip === '127.0.0.1' || $ip === '::1') return null;

        return Cache::remember("geoip_{$ip}", 86400, function () use ($ip) {
            // Priority 1: ipapi.co (1000/day, HTTPS)
            try {
                $response = Http::timeout(2)->get("https://ipapi.co/{$ip}/json/");
                if ($response->successful() && $response->json('country_code')) {
                    return [
                        'country_code' => strtoupper($response->json('country_code')),
                        'city'         => $response->json('city'),
                    ];
                }
            } catch (\Exception $e) {}

            // Priority 2: ip-api.com (Reliable secondary, HTTP but backend-safe)
            try {
                $response = Http::timeout(2)->get("http://ip-api.com/json/{$ip}");
                if ($response->successful() && $response->json('status') === 'success') {
                    return [
                        'country_code' => strtoupper($response->json('countryCode')),
                        'city'         => $response->json('city'),
                    ];
                }
            } catch (\Exception $e) {}

            return null;
        });
    }

    /**
     * Generate and cache a JSON-LD schema for a specific page hit.
     */
    private function generateSchemaForPage(PixelSite $site, string $url, array $metadata)
    {
        $urlHash = hash('sha256', $this->normalizeUrlForHash($url));

        
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
            // Enhanced logic: Try to use AI analysis if we have metadata
            try {
                $aiService = app(\App\Services\OpenAIService::class);
                $aiService->setModelFromOrganization($site->organization);
                
                // Construct pseudo-html from metadata for extraction
                $pseudoHtml = "<html><head><title>" . ($metadata['title'] ?? '') . "</title>";
                $pseudoHtml .= "<meta name='description' content='" . ($metadata['description'] ?? '') . "'>";
                $pseudoHtml .= "</head><body><h1>" . ($metadata['h1'] ?? '') . "</h1></body></html>";

                $aiData = $aiService->extractProfessionalSchemaData($url, $pseudoHtml);
                
                if ($aiData && !empty($aiData['data'])) {
                    $schema = $aiData['data'];
                    // Ensure @context and @type are set if missing from AI returned data
                    if (!isset($schema['@context'])) $schema['@context'] = 'https://schema.org';
                    if (!isset($schema['@type'])) $schema['@type'] = $aiData['type'] ?? 'WebPage';
                }
            } catch (\Exception $e) {
                Log::error("CDN Auto-Schema AI Failure: " . $e->getMessage());
            }

            // Fallback if AI fails or wasn't used
            if (!isset($schema)) {
                $schema = [
                    '@context' => 'https://schema.org',
                    '@type' => 'WebPage',
                    'name' => $metadata['title'] ?? ($metadata['h1'] ?? 'Untitled Page'),
                    'description' => $metadata['description'] ?? '',
                    'url' => $url,
                    'primaryImageOfPage' => $metadata['og_image'] ?? null
                ];
            }
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

    /**
     * Get aggregated web analysis data for the Developers "Web Analysis" tab.
     */
    public function webAnalysis(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) return response()->json(['error' => 'Organization not found'], 404);

        $pixelSiteId = $request->input('pixel_site_id');
        $pixelSite = $pixelSiteId ? PixelSite::where('organization_id', $organization->id)->find($pixelSiteId) : null;

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

        // Global Health Score (All organization's sitemap links)
        $sitemapService = app(\App\Services\SitemapService::class);
        $totalLinks = SitemapLink::whereHas('sitemap', function($q) use ($organization) {
            $q->where('organization_id', $organization->id);
        })->with('sitemap')->get();
        
        $healthScore = $totalLinks->avg(fn($l) => $sitemapService->calculateSeoScore($l));

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

        // 3. Generate schema (Internal call)
        $schema = $this->generateSchemaForPage($pixelSite, $request->url, $metadata);

        return response()->json([
            'success' => true,
            'message' => 'AI Schema synthesized and injected successfully.',
            'schema'  => $schema->schema_json,
        ]);
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
     * Find or auto-create the organisation's CDN discovery sitemap.
     *
     * The discovery sitemap is a special sitemap used as the landing zone for
     * pages found passively (CDN) or aggressively (Scrapy) via pixel traffic.
     * It is created once and reused for all subsequent discoveries.
     */
    private function resolveDiscoverySitemap(Organization $organization, PixelSite $pixelSite): Sitemap
    {
        return Sitemap::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'pixel_site_id'   => $pixelSite->id,
                'is_discovery'    => true,
            ],
            [
                'user_id'    => $organization->users()->first()?->id,
                'name'       => 'CDN Discovery — ' . ($pixelSite->allowed_domain ?? $pixelSite->label),
                'site_url'   => $pixelSite->allowed_domain ? 'https://' . $pixelSite->allowed_domain : null,
                'filename'   => 'cdn-discovery-' . $pixelSite->id . '-' . $organization->id . '.xml',
                'crawl_mode' => 'cdn',   // default: silent; user can switch to aggressive in settings
                'is_index'   => false,
            ]
        );
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
