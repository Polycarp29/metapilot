<?php

namespace App\Jobs;

use App\Models\AdTrackEvent;
use App\Models\CdnPageSchema;
use App\Models\PixelSite;
use App\Models\SitemapLink;
use App\Models\AdCampaign;
use App\Services\BotFirewallService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProcessCdnHitJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected array $payload,
        protected array $headers,
        protected string $ip,
        protected string $userAgent
    ) {}

    /**
     * Execute the job.
     * 
     * This job performs the "Heavy Lifting" previously done in the controller:
     * 1. HMAC Verification
     * 2. Bot Scoring (Behavioral)
     * 3. Geo/UA Parsing
     * 4. DB Write (updateOrCreate)
     * 5. Discovery & Schema Job dispatching
     */
    public function handle(BotFirewallService $firewall): void
    {
        $token = $this->payload['token'] ?? null;
        if (!$token) return;

        $pixelSite = PixelSite::where('ads_site_token', $token)->first();
        if (!$pixelSite) return;

        $ts        = (int) ($this->payload['_ts'] ?? 0);
        $signature = $this->payload['_sig'] ?? '';
        
        $expected = hash_hmac(
            'sha256',
            $token . $this->payload['page_view_id'] . $ts,
            $pixelSite->ads_site_token
        );

        if ($signature !== 'nosig' && !hash_equals($expected, $signature)) {
            return;
        }

        $isBot = $firewall->isAllowlisted($this->userAgent) ? false : null;
        if ($isBot === null) {
            $deviceData = $this->parseUserAgent($this->userAgent);
            $isBot = $deviceData['is_bot'] ?? false;
        }

        $countryCode = $this->headers['cf-ipcountry'] ?? 
                       $this->headers['x-vercel-ip-country'] ?? 
                       Cache::get("geoip_country_{$this->ip}");
        $city = Cache::get("geoip_city_{$this->ip}");

        $meta = $this->payload['metadata'] ?? [];
        if (!is_array($meta)) $meta = [];
        $meta = array_map(fn($v) => is_string($v) ? mb_substr($v, 0, 500) : $v, $meta);
        if (isset($this->payload['is_engaged'])) $meta['is_engaged'] = (bool) $this->payload['is_engaged'];

        $pageUrl = $this->payload['page_url'] ?? null;
        $urlHash = $pageUrl ? hash('sha256', $this->normalizeUrlForHash($pageUrl)) : null;

        $hit = AdTrackEvent::updateOrCreate(
            ['page_view_id' => $this->payload['page_view_id']],
            [
                'organization_id'    => $pixelSite->organization_id,
                'pixel_site_id'      => $pixelSite->id,
                'site_token'         => $token,
                'country_code'       => $countryCode,
                'city'               => $city,
                'browser'            => $deviceData['browser'] ?? 'Unknown',
                'platform'           => $deviceData['platform'] ?? 'Unknown',
                'device_type'        => $deviceData['device_type'] ?? 'desktop',
                'screen_resolution'  => $this->payload['screen_resolution'] ?? null,
                'duration_seconds'   => $this->payload['duration_seconds'] ?? 0,
                'max_scroll_depth'   => $this->payload['max_scroll_depth'] ?? 0,
                'click_count'        => $this->payload['click_count']      ?? 0,
                'google_campaign_id' => $this->payload['campaign_id']      ?? null,
                'page_url'           => $pageUrl,
                'referrer'           => $this->payload['referrer']        ?? null,
                'session_id'         => $this->payload['session_id']       ?? null,
                'gclid'              => $this->payload['gclid']            ?? null,
                'utm_source'         => $this->payload['utm_source']       ?? null,
                'utm_medium'         => $this->payload['utm_medium']       ?? null,
                'utm_campaign'       => $this->payload['utm_campaign']     ?? null,
                'ip_hash'            => hash('sha256', $this->ip),
                'metadata'           => $meta,
                'is_bot'             => $isBot,
            ]
        );

        $this->processModules($pixelSite, $this->payload, $urlHash, $meta);

        if ($urlHash && $pageUrl && !$isBot) {
            $discoveryCacheKey = "cdn_seen_{$pixelSite->id}_{$urlHash}";
            if (!Cache::has($discoveryCacheKey)) {
                Cache::put($discoveryCacheKey, true, 300);
                RecordCdnDiscoveryJob::dispatch($pixelSite->id, $pageUrl, $urlHash, $meta);
            }
        }

        Log::info("CDN Hit Processed", [
            'site' => $pixelSite->id,
            'ip'   => substr(hash('sha256', $this->ip), 0, 8),
            'bot'  => $isBot ? 'YES' : 'NO'
        ]);
    }

    /**
     * Process intelligence modules (click tracking, schema generation).
     */
    protected function processModules($pixelSite, $payload, $urlHash, $meta): void
    {
        $requestedModules = $payload['modules'] ?? [];
        if (is_string($requestedModules)) $requestedModules = explode(',', $requestedModules);
        
        $enabledModules = $pixelSite->enabled_modules ?? ['click', 'schema'];
        $activeModules  = array_intersect($requestedModules, $enabledModules);

        if (in_array('click', $activeModules)) {
            $sitemapLink = SitemapLink::whereHas('sitemap', function($q) use ($pixelSite) {
                $q->where('organization_id', $pixelSite->organization_id);
            })->where('url_hash', $urlHash)->first();

            if ($sitemapLink) {
                $sitemapLink->increment('cdn_hit_count');
                $clicks = (int) ($payload['click_count'] ?? 0);
                if ($clicks > 0) $sitemapLink->increment('cdn_click_count', $clicks);
                
                $sitemapLink->update([
                    'cdn_active' => true,
                    'cdn_last_seen_at' => now(),
                ]);
            }
        }

        if (in_array('schema', $activeModules) && !empty($meta) && $urlHash) {
            $schemaKey = "schema_dispatched_{$pixelSite->id}_{$urlHash}";
            if (!Cache::has($schemaKey)) {
                $exists = CdnPageSchema::where('pixel_site_id', $pixelSite->id)->where('url_hash', $urlHash)->exists();
                if (!$exists) {
                    Cache::put($schemaKey, true, 600);
                    GenerateCdnSchemaJob::dispatch($pixelSite, $payload['page_url'], $meta);
                }
            }
        }
    }

    /**
     * Minimal UA parser (Duplicate of logic in controller, kept for job independence).
     */
    protected function parseUserAgent(?string $ua): array
    {
        if (!$ua) return ['browser' => 'Unknown', 'platform' => 'Unknown', 'device_type' => 'desktop', 'is_bot' => true];
        
        $ua = strtolower($ua);
        $isBot = false;
        
        // Basic bot detection strings
        $bots = ['bot', 'crawler', 'spider', 'slurp', 'search', 'headless', 'phantomjs', 'selenium', 'puppeteer'];
        foreach ($bots as $bot) {
            if (str_contains($ua, $bot)) {
                $isBot = true;
                break;
            }
        }

        $platform = 'Unknown';
        if (str_contains($ua, 'windows')) $platform = 'Windows';
        elseif (str_contains($ua, 'macintosh')) $platform = 'Mac';
        elseif (str_contains($ua, 'linux')) $platform = 'Linux';
        elseif (str_contains($ua, 'android')) $platform = 'Android';
        elseif (str_contains($ua, 'iphone') || str_contains($ua, 'ipad')) $platform = 'iOS';

        $browser = 'Unknown';
        if (str_contains($ua, 'edg')) $browser = 'Edge';
        elseif (str_contains($ua, 'chrome')) $browser = 'Chrome';
        elseif (str_contains($ua, 'safari')) $browser = 'Safari';
        elseif (str_contains($ua, 'firefox')) $browser = 'Firefox';

        $deviceType = 'desktop';
        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) $deviceType = 'mobile';
        elseif (str_contains($ua, 'ipad') || str_contains($ua, 'tablet')) $deviceType = 'tablet';

        return [
            'browser'     => $browser,
            'platform'    => $platform,
            'device_type' => $deviceType,
            'is_bot'      => $isBot
        ];
    }

    protected function normalizeUrlForHash(?string $url): string
    {
        if (!$url) return '';
        $parsed = parse_url($url);
        $normalized = ($parsed['host'] ?? '') . ($parsed['path'] ?? '');
        return strtolower(rtrim($normalized, '/'));
    }
}
