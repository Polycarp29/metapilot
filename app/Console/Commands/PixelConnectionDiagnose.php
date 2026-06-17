<?php

namespace App\Console\Commands;

use App\Models\PixelSite;
use App\Models\AdTrackEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;

class PixelConnectionDiagnose extends Command
{
    protected $signature = 'pixel:diagnose
                            {--site= : A specific PixelSite ID to diagnose (optional)}
                            {--fire-hit : Actually fire a test hit through the full pipeline}';

    protected $description = 'Run a full end-to-end pixel connection diagnostic — checks Redis, queue workers, DB, domain pinning, and the Python analytics engine.';

    public function handle(): int
    {
        $this->line('');
        $this->info('══════════════════════════════════════════════');
        $this->info('  MetaPilot Pixel Connection Diagnostics v1.0  ');
        $this->info('══════════════════════════════════════════════');
        $this->line('');

        $passed = 0;
        $failed = 0;

        // ── Layer 1: Redis ────────────────────────────────────────────────────
        $this->comment('[ LAYER 1 ] Redis Connectivity');
        try {
            $redis = app('redis')->connection();
            $redis->ping();
            $this->ok('  ✓ Redis is reachable (PONG)');

            $queueLength = $redis->llen('queues:cdn-ingestion');
            $this->line("  → queues:cdn-ingestion depth: {$queueLength}");

            $failed_jobs = DB::table('failed_jobs')->count();
            $this->line("  → failed_jobs table count:    {$failed_jobs}");
            if ($failed_jobs > 0) {
                $this->warn("  ⚠ There are {$failed_jobs} failed jobs — run: php artisan queue:failed");
            }

            $passed++;
        } catch (\Throwable $e) {
            $this->err("  ✗ Redis connection FAILED: " . $e->getMessage());
            $this->warn("    Fix: ensure Redis is running on " . config('database.redis.default.host') . ':' . config('database.redis.default.port'));
            $failed++;
        }
        $this->line('');

        // ── Layer 2: Queue Worker Detection ───────────────────────────────────
        $this->comment('[ LAYER 2 ] Queue Worker Detection');
        $workerProcesses = shell_exec("ps aux 2>/dev/null | grep 'queue:work' | grep -v grep");
        if (!empty(trim($workerProcesses ?? ''))) {
            $this->ok('  ✓ Queue worker process detected');
            $this->line('    ' . trim($workerProcesses));
            $passed++;
        } else {
            $this->err('  ✗ No queue:work process found!');
            $this->warn('    Fix: php artisan queue:work redis --queue=cdn-ingestion,default --timeout=120');
            $this->warn('    Or check your Supervisor config: supervisor-worker.conf');
            $failed++;
        }
        $this->line('');

        // ── Layer 3: Tracker Script File ──────────────────────────────────────
        $this->comment('[ LAYER 3 ] Tracker Script File');
        $scriptPath = public_path('js/ads-tracker.js');
        if (file_exists($scriptPath)) {
            $size = number_format(filesize($scriptPath));
            $this->ok("  ✓ ads-tracker.js exists ({$size} bytes)");
            $passed++;
        } else {
            $this->err('  ✗ public/js/ads-tracker.js is MISSING');
            $this->warn('    The script cannot be served — clients cannot load the tracker.');
            $failed++;
        }
        $this->line('');

        // ── Layer 4: APP_URL Check ────────────────────────────────────────────
        $this->comment('[ LAYER 4 ] APP_URL Configuration');
        $appUrl = config('app.url');
        $this->line("  → APP_URL = {$appUrl}");
        if (str_contains($appUrl, '127.0.0.1') || str_contains($appUrl, 'localhost')) {
            $this->err('  ✗ APP_URL is set to a local address!');
            $this->warn('    External sites cannot reach http://127.0.0.1.');
            $this->warn('    Fix: Set APP_URL=https://your-production-domain.com in .env');
            $failed++;
        } else {
            $this->ok('  ✓ APP_URL points to a non-local address');
            $passed++;
        }
        $this->line('');

        // ── Layer 5: Pixel Sites Inventory ────────────────────────────────────
        $this->comment('[ LAYER 5 ] Pixel Sites Inventory');
        $siteId = $this->option('site');
        $sitesQuery = PixelSite::withCount('adTrackEvents');
        if ($siteId) {
            $sitesQuery->where('id', $siteId);
        }
        $sites = $sitesQuery->get();

        if ($sites->isEmpty()) {
            $this->warn('  ⚠ No Pixel Sites found in the database.');
            $this->line('    Go to Developer Tools → Create a new Pixel Site first.');
        } else {
            $rows = $sites->map(fn($s) => [
                $s->id,
                $s->label,
                $s->allowed_domain ?? '(any domain)',
                $s->tracking_enabled ? '<fg=green>YES</>' : '<fg=red>NO</>',
                $s->pixel_verified_at ? $s->pixel_verified_at->diffForHumans() : '<fg=yellow>NEVER</>',
                $s->ad_track_events_count,
            ])->toArray();

            $this->table(
                ['ID', 'Label', 'Allowed Domain', 'Tracking On', 'Last Verified', 'Total Hits'],
                $rows
            );

            foreach ($sites as $site) {
                if (!$site->tracking_enabled) {
                    $this->warn("  ⚠ Site #{$site->id} ({$site->label}): tracking is DISABLED — hits are silently dropped.");
                    $failed++;
                } else {
                    $passed++;
                }
            }
        }
        $this->line('');

        // ── Layer 6: Recent Event Activity ────────────────────────────────────
        $this->comment('[ LAYER 6 ] Recent Event Activity (last 24h)');
        $recentHits = AdTrackEvent::where('created_at', '>=', now()->subHours(24))
            ->selectRaw('pixel_site_id, COUNT(*) as cnt, MAX(created_at) as last_at')
            ->groupBy('pixel_site_id')
            ->get();

        if ($recentHits->isEmpty()) {
            $this->warn('  ⚠ Zero events received in the last 24 hours.');
            $this->line('    This confirms the CDN infrastructure is not receiving pixel hits.');
            $failed++;
        } else {
            foreach ($recentHits as $row) {
                $this->ok("  ✓ Site #{$row->pixel_site_id}: {$row->cnt} hits (last: {$row->last_at})");
            }
            $passed++;
        }
        $this->line('');

        // ── Layer 7: Python Analytics Engine ──────────────────────────────────
        $this->comment('[ LAYER 7 ] Python Analytics Engine (port 8001)');
        $engineUrl = config('services.python_engine.url', env('PYTHON_ENGINE_URL', 'http://127.0.0.1:8001'));
        $this->line("  → Engine URL: {$engineUrl}");
        try {
            $response = Http::timeout(3)->get("{$engineUrl}/health/cdn");
            if ($response->successful()) {
                $this->ok('  ✓ Python analytics engine is UP and healthy');
                $passed++;
            } else {
                $this->err("  ✗ Engine returned HTTP {$response->status()}");
                $failed++;
            }
        } catch (\Throwable $e) {
            $this->err('  ✗ Python analytics engine is DOWN: ' . $e->getMessage());
            $this->warn('    Fix: cd /path/to/analytics-engine && uvicorn main:app --host 127.0.0.1 --port 8001');
            $this->warn('    Or check Supervisor: supervisorctl status cdn-analytics-engine');
            $failed++;
        }
        $this->line('');

        // ── Layer 8: Live Hit Test (optional) ─────────────────────────────────
        if ($this->option('fire-hit')) {
            $this->comment('[ LAYER 8 ] Live End-to-End Hit Test');

            $site = $siteId ? PixelSite::find($siteId) : PixelSite::where('tracking_enabled', true)->first();
            if (!$site) {
                $this->warn('  ⚠ No active pixel site to test against. Skipping.');
            } else {
                $this->line("  → Testing against: #{$site->id} ({$site->label})");
                $this->line("  → Token: {$site->ads_site_token}");

                // Step A: Verify connection handshake
                $challenge = bin2hex(random_bytes(8));
                $verifyUrl = url('/cdn/verify-connection');
                $this->line("  → Calling: GET {$verifyUrl}?token=...&challenge={$challenge}");

                try {
                    $res = Http::withHeaders([
                        'Origin'  => 'https://test-diagnostic.metapilot.internal',
                        'Referer' => 'https://test-diagnostic.metapilot.internal/',
                    ])->get($verifyUrl, [
                        'token'     => $site->ads_site_token,
                        'challenge' => $challenge,
                        'modules'   => 'click',
                    ]);

                    if ($res->successful() && ($res->json('echo') === $challenge)) {
                        $this->ok('  ✓ Handshake PASSED — server echoed challenge correctly');
                        $this->line('    domain_verified: ' . ($res->json('domain_verified') ? 'true' : 'false'));
                        $passed++;
                    } else {
                        $this->err('  ✗ Handshake FAILED. Response: ' . $res->body());
                        $failed++;
                    }
                } catch (\Throwable $e) {
                    $this->err('  ✗ Handshake request threw exception: ' . $e->getMessage());
                    $failed++;
                }

                // Step B: Fire a test hit
                $pageViewId = 'diag-' . uniqid();
                $ts = time();
                $hitUrl = url('/cdn/ad-hit');
                $this->line("  → Firing: POST {$hitUrl} (page_view_id: {$pageViewId})");

                try {
                    $res = Http::withHeaders([
                        'Content-Type' => 'application/json',
                        'Origin'       => 'https://test-diagnostic.metapilot.internal',
                        'Referer'      => 'https://test-diagnostic.metapilot.internal/test',
                        'User-Agent'   => 'Mozilla/5.0 (MetaPilot Diagnostic Tool)',
                    ])->post($hitUrl, [
                        'token'        => $site->ads_site_token,
                        'page_view_id' => $pageViewId,
                        'page_url'     => 'https://test-diagnostic.metapilot.internal/test',
                        '_ts'          => $ts,
                        '_sig'         => 'nosig',
                    ]);

                    if ($res->status() === 204) {
                        $this->ok('  ✓ Hit accepted (204 No Content) — dispatched to cdn-ingestion queue');
                        $this->line('    Check DB in ~2s: SELECT * FROM ad_track_events WHERE page_view_id = \'' . $pageViewId . '\';');
                        sleep(3);

                        $written = AdTrackEvent::where('page_view_id', $pageViewId)->exists();
                        if ($written) {
                            $this->ok('  ✓ Event confirmed in DB — full pipeline is WORKING');
                            $passed++;
                        } else {
                            $this->err('  ✗ Hit was accepted but NOT written to DB after 3s.');
                            $this->warn('    The queue worker is likely not running. Check: ps aux | grep queue:work');
                            $failed++;
                        }
                    } else {
                        $this->err("  ✗ Hit rejected with HTTP {$res->status()}: " . $res->body());
                        $failed++;
                    }
                } catch (\Throwable $e) {
                    $this->err('  ✗ Hit request threw exception: ' . $e->getMessage());
                    $failed++;
                }
            }
            $this->line('');
        }

        // ── Summary ───────────────────────────────────────────────────────────
        $this->info('══════════════════════════════════════════════');
        $total = $passed + $failed;
        if ($failed === 0) {
            $this->info("  ✅ All {$total} checks PASSED — pipeline is healthy.");
        } else {
            $this->error("  ❌ {$failed}/{$total} checks FAILED — see issues above.");
        }
        $this->info('══════════════════════════════════════════════');
        $this->line('');

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function ok(string $msg): void
    {
        $this->line("<fg=green>{$msg}</>");
    }

    private function err(string $msg): void
    {
        $this->line("<fg=red>{$msg}</>");
    }
}
