<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Analytics ─────────────────────────────────────────────────────────────
Schedule::command('analytics:fetch-metrics')->dailyAt('02:00');
Schedule::command('analytics:fetch-gsc')->dailyAt('03:00');
Schedule::command('analytics:weekly-report')->mondays()->at('07:00');
Schedule::job(new \App\Jobs\DiscoverTrendingKeywordsJob)->hourly();
Schedule::job(new \App\Jobs\ProcessAnalyticsJob)->hourly();
Schedule::command('crawl:run-scheduled')->everyFiveMinutes();
Schedule::command('pique:run-scheduled')->everyFiveMinutes();

// ── Security Engine ────────────────────────────────────────────────────────
// Daily compressed mysqldump of the primary database (01:00 AM)
Schedule::command('db:backup')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/db-backup.log'));

// Weekly cross-database archive streamer — Sundays at 00:30 AM
Schedule::command('db:archive')
    ->weekly()
    ->sundays()
    ->at('00:30')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/db-archive.log'));

// Daily bot firewall report — parsed from security.log (06:00 AM)
Schedule::command('bot:report')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/bot-report.log'));
