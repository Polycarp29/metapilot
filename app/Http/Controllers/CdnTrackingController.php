<?php

namespace App\Http\Controllers;

use App\Models\AdTrackEvent;
use App\Models\Organization;
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

        $organization = Organization::where('ads_site_token', $request->token)->first();
        if (!$organization) {
            return response()->json(['error' => 'Invalid token'], 403)
                ->withHeaders($this->corsHeaders());
        }

        // --- Security: Domain Pinning ---
        if ($organization->allowed_domain) {
            $origin  = $request->header('Origin', '');
            $referer = $request->header('Referer', '');
            $allowed = strtolower(trim($organization->allowed_domain, '/'));

            $originHost  = strtolower(parse_url($origin,  PHP_URL_HOST) ?? '');
            $refererHost = strtolower(parse_url($referer, PHP_URL_HOST) ?? '');

            // Strip www. for comparison
            $normalise = fn($h) => preg_replace('/^www\./', '', $h);

            if (
                $normalise($originHost)  !== $normalise($allowed) &&
                $normalise($refererHost) !== $normalise($allowed)
            ) {
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
            $organization->ads_site_token
        );

        if (!hash_equals($expected, $signature)) {
            Log::warning('Pixel HMAC validation failed', [
                'org_id'        => $organization->id,
                'page_view_id'  => $request->page_view_id,
            ]);
            return response()->json(['error' => 'Invalid signature'], 403)
                ->withHeaders($this->corsHeaders());
        }

        // --- Parse UA and Geo ---
        $ua         = $request->header('User-Agent');
        $deviceData = $this->parseUserAgent($ua);
        $geo        = $this->getGeoData($request->ip());

        // --- Upsert the hit ---
        AdTrackEvent::updateOrCreate(
            ['page_view_id' => $request->page_view_id],
            [
                'organization_id'    => $organization->id,
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
            ]
        );

        // --- Mark pixel as verified on first domain-confirmed hit ---
        if (!$organization->pixel_verified_at) {
            $organization->update(['pixel_verified_at' => now()]);
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

        $organization = Organization::where('ads_site_token', $request->token)->first();

        if (!$organization) {
            return response()->json(['ok' => false, 'error' => 'Invalid token'], 403)
                ->withHeaders($this->corsHeaders());
        }

        // Check if the calling domain matches the allowed_domain
        $domainVerified = false;
        if ($organization->allowed_domain) {
            $origin     = strtolower(parse_url($request->header('Origin', ''), PHP_URL_HOST) ?? '');
            $referer    = strtolower(parse_url($request->header('Referer', ''), PHP_URL_HOST) ?? '');
            $allowed    = strtolower($organization->allowed_domain);
            $normalise  = fn($h) => preg_replace('/^www\./', '', $h);
            $domainVerified = (
                $normalise($origin)  === $normalise($allowed) ||
                $normalise($referer) === $normalise($allowed)
            );
        }

        return response()->json([
            'ok'              => true,
            'echo'            => $request->challenge,
            'server_time'     => now()->toIso8601String(),
            'domain_verified' => $domainVerified,
        ])->withHeaders($this->corsHeaders());
    }

    /**
     * Get recent track events for the authenticated organization (for the Developer Tab).
     */
    public function events(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $events = AdTrackEvent::where('organization_id', $organization->id)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($events);
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

        $totalHits    = AdTrackEvent::where('organization_id', $organization->id)->count();
        $hitsLast24h  = AdTrackEvent::where('organization_id', $organization->id)
            ->where('created_at', '>=', now()->subHours(24))
            ->count();

        $lastEvent = AdTrackEvent::where('organization_id', $organization->id)
            ->orderBy('created_at', 'desc')
            ->first(['created_at', 'page_url']);

        // Determine domain of last hit
        $lastHitDomain = null;
        if ($lastEvent?->page_url) {
            $lastHitDomain = parse_url($lastEvent->page_url, PHP_URL_HOST);
        }

        // Status logic
        $pixelVerified = (bool) $organization->pixel_verified_at;
        $recentlyActive = $hitsLast24h > 0;

        if ($pixelVerified && $recentlyActive) {
            $status = 'verified_active';
        } elseif ($totalHits > 0) {
            $status = 'connected_inactive';
        } else {
            $status = 'not_detected';
        }

        return response()->json([
            'connected'       => $totalHits > 0,
            'pixel_verified'  => $pixelVerified,
            'pixel_verified_at' => $organization->pixel_verified_at?->toIso8601String(),
            'allowed_domain'  => $organization->allowed_domain,
            'last_hit_at'     => $lastEvent?->created_at?->toIso8601String(),
            'last_hit_domain' => $lastHitDomain,
            'total_hits'      => $totalHits,
            'hits_last_24h'   => $hitsLast24h,
            'status'          => $status,
        ]);
    }

    /**
     * Save the allowed domain for this organization's pixel pinning.
     */
    public function saveAllowedDomain(Request $request)
    {
        $request->validate([
            'allowed_domain' => 'nullable|string|max:255|regex:/^([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})$/',
        ]);

        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        // Reset pixel_verified_at when domain changes (needs re-verification)
        $domainChanged = $organization->allowed_domain !== $request->allowed_domain;

        $organization->update([
            'allowed_domain'    => $request->allowed_domain ?: null,
            'pixel_verified_at' => $domainChanged ? null : $organization->pixel_verified_at,
        ]);

        return response()->json([
            'allowed_domain' => $organization->allowed_domain,
            'message'        => $domainChanged
                ? 'Domain updated. Pixel verification reset — the tracker must fire from the new domain to re-verify.'
                : 'Domain saved.',
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
}
