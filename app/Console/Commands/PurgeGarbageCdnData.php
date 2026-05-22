<?php

namespace App\Console\Commands;

use App\Models\AdTrackEvent;
use App\Models\CdnError;
use App\Models\CdnPageSchema;
use App\Models\PixelSite;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeGarbageCdnData extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cdn:purge-garbage
        {--days=30        : Delete garbage records older than this many days}
        {--site-id=       : Scope purge to a specific pixel_site ID}
        {--all-bots       : Also purge all records where is_bot=true (not just betting referrers)}
        {--schemas        : Also purge orphaned CdnPageSchemas with no associated hits}
        {--errors         : Also purge CdnError records with invalid HMAC (all errors for the site)}
        {--malformed-urls : Also purge all events where page_url is malformed (e.g. no host or invalid scheme)}
        {--dry-run        : Count rows to be deleted without actually deleting anything}';

    /**
     * The console command description.
     */
    protected $description = 'Purge garbage CDN data (bot hits, betting-site traffic, orphaned schemas) to keep the database clean.';

    public function handle(): int
    {
        $days          = (int) $this->option('days');
        $siteId        = $this->option('site-id') ? (int) $this->option('site-id') : null;
        $dryRun        = (bool) $this->option('dry-run');
        $allBots       = (bool) $this->option('all-bots');
        $malformedUrls = (bool) $this->option('malformed-urls');

        $cutoff  = now()->subDays($days);

        if ($dryRun) {
            $this->warn('DRY RUN — no data will be deleted.');
        }

        $this->info("Purging CDN garbage older than {$days} days" . ($siteId ? " for pixel_site #{$siteId}" : ' across all sites') . '...');
        $this->newLine();

        // ── 1. Bot-flagged ad_track_events ──────────────────────────────────
        $eventsQuery = AdTrackEvent::where('is_bot', true)
            ->where('created_at', '<', $cutoff);

        if ($siteId) {
            $eventsQuery->where('pixel_site_id', $siteId);
        }

        $eventsCount = $eventsQuery->count();

        if (!$dryRun && $eventsCount > 0) {
            // Chunk delete to avoid locking the table for too long
            $eventsQuery->chunkById(500, function ($chunk) {
                AdTrackEvent::whereIn('id', $chunk->pluck('id'))->delete();
            });
        }

        $this->line("  <fg=red>✗</> ad_track_events (is_bot=true, > {$days}d old): <fg=yellow>{$eventsCount} rows</>" . ($dryRun ? '' : ' deleted'));

        // ── 2. All bot events (if --all-bots) ───────────────────────────────
        if ($allBots) {
            $allBotsQuery = AdTrackEvent::where('is_bot', true);
            if ($siteId) $allBotsQuery->where('pixel_site_id', $siteId);

            $allBotsCount = $allBotsQuery->count();

            if (!$dryRun && $allBotsCount > 0) {
                $allBotsQuery->chunkById(500, function ($chunk) {
                    AdTrackEvent::whereIn('id', $chunk->pluck('id'))->delete();
                });
            }

            $this->line("  <fg=red>✗</> ad_track_events (ALL is_bot=true, any age): <fg=yellow>{$allBotsCount} rows</>" . ($dryRun ? '' : ' deleted'));
        }

        // ── 3. Orphaned CdnPageSchemas (--schemas) ──────────────────────────
        if ($this->option('schemas')) {
            $schemasQuery = CdnPageSchema::whereDoesntHave('pixelSite');
            if ($siteId) {
                $schemasQuery = CdnPageSchema::where('pixel_site_id', $siteId)
                    ->where('injected_count', 0)
                    ->where('created_at', '<', $cutoff);
            }

            $schemasCount = $schemasQuery->count();

            if (!$dryRun && $schemasCount > 0) {
                $schemasQuery->chunkById(200, function ($chunk) {
                    CdnPageSchema::whereIn('id', $chunk->pluck('id'))->delete();
                });
            }

            $this->line("  <fg=red>✗</> cdn_page_schemas (orphaned/uninjected): <fg=yellow>{$schemasCount} rows</>" . ($dryRun ? '' : ' deleted'));
        }

        // ── 4. CdnErrors for the site (--errors) ────────────────────────────
        if ($this->option('errors') && $siteId) {
            $errorsQuery = CdnError::where('pixel_site_id', $siteId)
                ->where('created_at', '<', $cutoff);

            $errorsCount = $errorsQuery->count();

            if (!$dryRun && $errorsCount > 0) {
                $errorsQuery->chunkById(500, function ($chunk) {
                    CdnError::whereIn('id', $chunk->pluck('id'))->delete();
                });
            }

            $this->line("  <fg=red>✗</> cdn_errors (site #{$siteId}, > {$days}d old): <fg=yellow>{$errorsCount} rows</>" . ($dryRun ? '' : ' deleted'));
        }

        // ── 5. Malformed page_url events (--malformed-urls) ───────────────────
        if ($malformedUrls) {
            $malformedQuery = AdTrackEvent::where(function ($q) {
                $q->whereNull('page_url')
                  ->orWhere('page_url', 'not like', 'http://%')
                  ->where('page_url', 'not like', 'https://%')
                  ->orWhere('page_url', '=', 'https:')
                  ->orWhere('page_url', '=', 'http:');
            });

            if ($siteId) {
                $malformedQuery->where('pixel_site_id', $siteId);
            }

            $malformedCount = $malformedQuery->count();

            if (!$dryRun && $malformedCount > 0) {
                $malformedQuery->chunkById(500, function ($chunk) {
                    AdTrackEvent::whereIn('id', $chunk->pluck('id'))->delete();
                });
            }

            $this->line("  <fg=red>✗</> ad_track_events (malformed page_url): <fg=yellow>{$malformedCount} rows</>" . ($dryRun ? '' : ' deleted'));
        }

        $this->newLine();

        if ($dryRun) {
            $this->warn('Dry run complete. Re-run without --dry-run to apply deletions.');
        } else {
            $this->info('   Purge complete. Run OPTIMIZE TABLE on large tables if needed.');
            $this->line('   Example: php artisan tinker --execute="DB::statement(\'OPTIMIZE TABLE ad_track_events\')"');
        }

        return self::SUCCESS;
    }
}
