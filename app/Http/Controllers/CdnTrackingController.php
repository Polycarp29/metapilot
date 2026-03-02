<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\AdTrackEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class CdnTrackingController extends Controller
{
    /**
     * Serve the tracking JS script.
     */
    public function serveScript()
    {
        $path = public_path('js/ads-tracker.js');
        if (!File::exists($path)) {
            return response()->json(['error' => 'Script not found'], 404);
        }

        return response()->file($path, [
            'Content-Type' => 'application/javascript',
            'Cache-Control' => 'public, max-age=31536000', // 1 year cache
        ]);
    }

    /**
     * Handle the tracking pixel hit.
     */
    public function trackHit(Request $request)
    {
        $request->validate([
            'token' => 'required|uuid',
            'page_url' => 'nullable|url',
        ]);

        $organization = Organization::where('ads_site_token', $request->token)->first();
        if (!$organization) {
            return response()->json(['error' => 'Invalid site token'], 422);
        }

        $ua = $request->header('User-Agent');
        $deviceData = $this->parseUserAgent($ua);
        
        $geo = $this->getGeoData($request->ip());

        AdTrackEvent::create([
            'organization_id' => $organization->id,
            'site_token' => $request->token,
            'country_code' => $geo['country_code'] ?? $request->header('CF-IPCountry'),
            'city' => $geo['city'] ?? null,
            'browser' => $deviceData['browser'],
            'platform' => $deviceData['platform'],
            'device_type' => $deviceData['device_type'],
            'screen_resolution' => $request->screen_resolution,
            'google_campaign_id' => $request->campaign_id,
            'page_url' => $request->page_url,
            'referrer' => $request->referrer,
            'session_id' => $request->session_id,
            'gclid' => $request->gclid,
            'utm_source' => $request->utm_source,
            'utm_medium' => $request->utm_medium,
            'utm_campaign' => $request->utm_campaign,
            'ip_hash' => hash('sha256', $request->ip()),
        ]);

        return response()->json(null, 204);
    }

    /**
     * Simple UA parser to avoid heavy dependencies for now.
     */
    protected function parseUserAgent($ua)
    {
        $browser = 'Unknown';
        $platform = 'Unknown';
        $device = 'Desktop';

        if (stripos($ua, 'Mobile') !== false || stripos($ua, 'Android') !== false) {
            $device = 'Mobile';
        } elseif (stripos($ua, 'Tablet') !== false || stripos($ua, 'iPad') !== false) {
            $device = 'Tablet';
        }

        if (stripos($ua, 'Firefox') !== false) $browser = 'Firefox';
        elseif (stripos($ua, 'Chrome') !== false) $browser = 'Chrome';
        elseif (stripos($ua, 'Safari') !== false) $browser = 'Safari';
        elseif (stripos($ua, 'Edge') !== false) $browser = 'Edge';
        elseif (stripos($ua, 'MSIE') !== false || stripos($ua, 'Trident') !== false) $browser = 'Internet Explorer';

        if (stripos($ua, 'Windows') !== false) $platform = 'Windows';
        elseif (stripos($ua, 'Macintosh') !== false) $platform = 'macOS';
        elseif (stripos($ua, 'Linux') !== false) $platform = 'Linux';
        elseif (stripos($ua, 'Android') !== false) $platform = 'Android';
        elseif (stripos($ua, 'iPhone') !== false || stripos($ua, 'iPad') !== false) $platform = 'iOS';

        return [
            'browser' => $browser,
            'platform' => $platform,
            'device_type' => $device
        ];
    }

    /**
     * Basic GeoIP lookup.
     */
    protected function getGeoData($ip)
    {
        if ($ip === '127.0.0.1' || $ip === '::1') return null;

        try {
            // Using a free IP info service with a timeout to avoid blocking the pixel.
            $response = \Illuminate\Support\Facades\Http::timeout(2)
                ->get("http://ip-api.com/json/{$ip}?fields=status,countryCode,city");
            
            if ($response->successful() && $response->json('status') === 'success') {
                return [
                    'country_code' => $response->json('countryCode'),
                    'city' => $response->json('city')
                ];
            }
        } catch (\Exception $e) {
            // Silently fail if geo lookup fails
        }

        return null;
    }

    /**
     * Get recent track events for the organization.
     */
    public function events(Request $request)
    {
        $organization = $request->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'Organization not found'], 404);
        }

        $events = AdTrackEvent::where('organization_id', $organization->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($events);
    }
}
