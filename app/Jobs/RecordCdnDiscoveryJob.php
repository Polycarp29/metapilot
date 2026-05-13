<?php

namespace App\Jobs;

use App\Models\Organization;
use App\Models\PixelSite;
use App\Models\Sitemap;
use App\Models\SitemapLink;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * RecordCdnDiscoveryJob
 *
 * Asynchronously records a newly discovered page from the CDN pixel tracker.
 * Offloaded from trackHit() to keep the web response fast (< 5ms).
 *
 * Handles:
 *  - Resolving or creating the organisation's discovery sitemap
 *  - firstOrCreate on SitemapLink for the discovered URL
 */
class RecordCdnDiscoveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries   = 3;
    public $timeout = 30;

    protected int    $pixelSiteId;
    protected string $url;
    protected string $urlHash;
    protected array  $meta;

    public function __construct(int $pixelSiteId, string $url, string $urlHash, array $meta = [])
    {
        $this->pixelSiteId = $pixelSiteId;
        $this->url         = $url;
        $this->urlHash     = $urlHash;
        $this->meta        = $meta;
        $this->queue       = 'cdn';
    }

    public function handle(): void
    {
        $pixelSite = PixelSite::find($this->pixelSiteId);

        if (!$pixelSite) {
            Log::warning('RecordCdnDiscoveryJob: PixelSite not found', ['pixel_site_id' => $this->pixelSiteId]);
            return;
        }

        $organization = $pixelSite->organization;

        if (!$organization) {
            return;
        }

        // Resolve or create the discovery sitemap (safe to do in background)
        $sitemap = $this->resolveDiscoverySitemap($organization, $pixelSite);

        // Record the discovered page — idempotent, won't duplicate
        SitemapLink::firstOrCreate(
            ['sitemap_id' => $sitemap->id, 'url_hash' => $this->urlHash],
            [
                'url'              => $this->url,
                'title'            => isset($this->meta['title']) ? mb_substr($this->meta['title'], 0, 500) : null,
                'status_code'      => 200,
                'cdn_active'       => true,
                'cdn_hit_count'    => 1,
                'cdn_last_seen_at' => now(),
            ]
        );
    }

    /**
     * Resolve or auto-create the organisation's CDN discovery sitemap.
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
                'crawl_mode' => 'cdn',
                'is_index'   => false,
            ]
        );
    }
}
