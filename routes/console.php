<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::command('analytics:fetch-metrics')->dailyAt('02:00');
\Illuminate\Support\Facades\Schedule::command('analytics:fetch-gsc')->dailyAt('03:00');
\Illuminate\Support\Facades\Schedule::command('analytics:weekly-report')->mondays()->at('07:00');
\Illuminate\Support\Facades\Schedule::job(new \App\Jobs\DiscoverTrendingKeywordsJob)->hourly();
\Illuminate\Support\Facades\Schedule::job(new \App\Jobs\ProcessAnalyticsJob)->hourly();
\Illuminate\Support\Facades\Schedule::command('crawl:run-scheduled')->everyFiveMinutes();
