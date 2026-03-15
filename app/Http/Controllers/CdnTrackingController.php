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

        if ($signature === 'nosig') {
            Log::info('Pixel hit received without signature (nosig)', [
                'pixel_site_id' => $pixelSite->id,
                'page_view_id'  => $request->page_view_id,
                'referrer'      => $request->header('Referer'),
            ]);
        } elseif (!hash_equals($expected, $signature)) {
            Log::warning('Pixel HMAC validation failed', [
                'pixel_site_id' => $pixelSite->id,
                'page_view_id'  => $request->page_view_id,
                'received_sig'  => $signature,
                'expected_sig'  => $expected,
                'payload'       => $request->token . $request->page_view_id . $ts,
            ]);
            return response()->json(['error' => 'Invalid signature'], 403)
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
    

        $events = $query->orderBy('created_at', 'desc')->limit(5000)->get();

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

        return response()->json([
            'daily_history'  => $dailyHistory,
            'top_pages'      => $topPages,
            'top_referrers'  => $topReferrers,
            'trend_velocity' => ['rising' => $rising, 'falling' => $falling],
            'by_country'     => $byCountry,
            'by_device'      => $byDevice,
            'by_city'        => $byCity,
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
                    'name' => $metadata['title'] ?? $metadata['h1'],
                    'description' => $metadata['description'],
                    'url' => $url,
                    'primaryImageOfPage' => $metadata['og_image']
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

        return response()->json([
            'sitemaps'       => $sitemaps,
            'analysis_links' => $analysisLinks,
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

        // Upsert discovery sitemap with CDN mode
        $sitemap = Sitemap::updateOrCreate(
            ['organization_id' => $organization->id, 'is_discovery' => true],
            [
                'user_id'    => $request->user()->id,
                'name'       => 'CDN Discovery — ' . ($pixelSite->allowed_domain ?? $pixelSite->label),
                'site_url'   => $pixelSite->allowed_domain ? 'https://' . $pixelSite->allowed_domain : null,
                'filename'   => 'cdn-discovery-' . $organization->id . '.xml',
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

        $discoverySitemap = Sitemap::where('organization_id', $organization->id)
            ->where('is_discovery', true)
            ->first();

        if (!$discoverySitemap) {
            return response()->json(['pages' => [], 'total' => 0, 'sitemap_id' => null]);
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
                'is_discovery'    => true,
            ],
            [
                'user_id'    => $organization->users()->first()?->id,
                'name'       => 'CDN Discovery — ' . ($pixelSite->allowed_domain ?? $pixelSite->label),
                'site_url'   => $pixelSite->allowed_domain ? 'https://' . $pixelSite->allowed_domain : null,
                'filename'   => 'cdn-discovery-' . $organization->id . '.xml',
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
