<?php

namespace App\Services;

use App\Models\AdTrackEvent;
use App\Models\Organization;
use App\Models\SitemapLink;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttributionService
{
    /**
     * Analyze traffic attribution for an organization.
     */
    public function analyze(Organization $organization, int $days = 30): array
    {
        $startDate = now()->subDays($days);

        // 1. Channel Attribution Analysis
        $channelStats = $this->getChannelStats($organization, $startDate);

        // 2. Country Attribution Analysis
        $countryStats = $this->getCountryStats($organization, $startDate);

        // 3. City Attribution Analysis
        $cityStats = $this->getCityStats($organization, $startDate);

        // 4. High-Performing Landing Pages (The "Links that are doing well")
        $topLinks = $this->getTopPerformingLinks($organization, $startDate);

        return [
            'summary' => [
                'period_days' => $days,
                'total_hits'  => array_sum(array_column($channelStats, 'hits')),
            ],
            'channels'  => $channelStats,
            'countries' => $countryStats,
            'cities'    => $cityStats,
            'top_links' => $topLinks,
        ];
    }

    /**
     * Group traffic by channel (Organic, Paid, Social, etc.) using DB-level aggregation.
     * Note: Channel classification is done via SQL CASE expressions instead of loading
     * all rows into PHP memory — safe at any scale.
     */
    private function getChannelStats(Organization $organization, Carbon $startDate): array
    {
        // DB-level channel classification via CASE WHEN
        $rows = AdTrackEvent::where('organization_id', $organization->id)
            ->where('created_at', '>=', $startDate)
            ->where('is_bot', false)
            ->selectRaw("
                CASE
                    WHEN gclid IS NOT NULL OR utm_medium IN ('cpc','ppc','paid') OR google_campaign_id IS NOT NULL THEN 'Paid Search'
                    WHEN referrer REGEXP '(facebook\\.com|twitter\\.com|x\\.com|instagram\\.com|linkedin\\.com|pinterest\\.com|tiktok\\.com|reddit\\.com)' THEN 'Social'
                    WHEN referrer IS NOT NULL AND referrer != '' AND utm_medium NOT IN ('cpc','ppc','paid') THEN 'Referral'
                    WHEN utm_source IN ('google','bing','yandex','duckduckgo') AND (utm_medium IS NULL OR utm_medium NOT IN ('cpc','ppc','paid')) THEN 'Organic Search'
                    ELSE 'Direct'
                END AS channel,
                COUNT(*) as hits,
                SUM(CASE WHEN duration_seconds >= 30 OR max_scroll_depth >= 50 THEN 1 ELSE 0 END) as engaged
            ")
            ->groupBy('channel')
            ->get();

        $channels = [
            'Paid Search'    => ['hits' => 0, 'engagement' => 0, 'engagement_rate' => 0],
            'Organic Search' => ['hits' => 0, 'engagement' => 0, 'engagement_rate' => 0],
            'Social'         => ['hits' => 0, 'engagement' => 0, 'engagement_rate' => 0],
            'Direct'         => ['hits' => 0, 'engagement' => 0, 'engagement_rate' => 0],
            'Referral'       => ['hits' => 0, 'engagement' => 0, 'engagement_rate' => 0],
        ];

        foreach ($rows as $row) {
            $name = $row->channel;
            if (!isset($channels[$name])) {
                $channels[$name] = ['hits' => 0, 'engagement' => 0, 'engagement_rate' => 0];
            }
            $channels[$name]['hits']           = (int) $row->hits;
            $channels[$name]['engagement']     = (int) $row->engaged;
            $channels[$name]['engagement_rate'] = $row->hits > 0
                ? round(($row->engaged / $row->hits) * 100, 1)
                : 0;
        }

        return $channels;
    }

    /**
     * Classify an event into a marketing channel.
     */
    private function classifyChannel(AdTrackEvent $event): string
    {
        $medium   = strtolower($event->utm_medium ?? '');
        $source   = strtolower($event->utm_source ?? '');
        $referrer = strtolower($event->referrer ?? '');

        // 1. Paid Search
        if ($event->gclid || in_array($medium, ['cpc', 'ppc', 'paid'])) {
            return 'Paid Search';
        }

        // 2. Social
        $socialDomains = ['facebook.com', 't.co', 'twitter.com', 'linkedin.com', 'instagram.com', 'tiktok.com', 'pinterest.com'];
        foreach ($socialDomains as $domain) {
            if (str_contains($referrer, $domain) || str_contains($source, str_replace('.com', '', $domain))) {
                return 'Social';
            }
        }

        // 3. Organic Search
        $searchEngines = [
            'google' => 'Google',
            'bing'   => 'Bing',
            'yandex' => 'Yandex',
            'yahoo'  => 'Yahoo',
            'duckduckgo' => 'DuckDuckGo',
            'baidu'  => 'Baidu'
        ];
        foreach ($searchEngines as $key => $name) {
            if (str_contains($referrer, $key . '.') || $source === $key) {
                return 'Organic Search'; // We could return $name if we wanted specific engines
            }
        }

        // 4. Direct
        if (empty($referrer) && empty($source)) {
            return 'Direct';
        }

        return 'Referral';
    }

    /**
     * Group metrics by country — returns resolved country name alongside code.
     */
    private function getCountryStats(Organization $organization, Carbon $startDate): array
    {
        return AdTrackEvent::where('organization_id', $organization->id)
            ->where('created_at', '>=', $startDate)
            ->where('is_bot', false)
            ->whereNotNull('country_code')
            ->select(
                'country_code',
                DB::raw('count(*) as hits'),
                DB::raw('sum(case when duration_seconds >= 30 then 1 else 0 end) as engaged_hits'),
                DB::raw('avg(duration_seconds) as avg_dwell')
            )
            ->groupBy('country_code')
            ->orderByDesc('hits')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $row->engagement_rate = $row->hits > 0
                    ? round(($row->engaged_hits / $row->hits) * 100, 1)
                    : 0;
                $row->avg_dwell = (int) round($row->avg_dwell ?? 0);
                return $row;
            })
            ->toArray();
    }

    /**
     * Group metrics by city — provides real city names for Pique to report on.
     * Never anonymized; if city is null the row is excluded.
     */
    private function getCityStats(Organization $organization, Carbon $startDate): array
    {
        return AdTrackEvent::where('organization_id', $organization->id)
            ->where('created_at', '>=', $startDate)
            ->where('is_bot', false)
            ->whereNotNull('city')
            ->where('city', '!=', '')
            ->select(
                'city',
                'country_code',
                DB::raw('count(*) as hits'),
                DB::raw('sum(case when duration_seconds >= 30 OR max_scroll_depth >= 50 then 1 else 0 end) as engaged_hits'),
                DB::raw('avg(duration_seconds) as avg_dwell')
            )
            ->groupBy('city', 'country_code')
            ->orderByDesc('hits')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $row->engagement_rate = $row->hits > 0
                    ? round(($row->engaged_hits / $row->hits) * 100, 1)
                    : 0;
                $row->avg_dwell = (int) round($row->avg_dwell ?? 0);
                return $row;
            })
            ->toArray();
    }

    /**
     * Identify the top-performing links.
     */
    private function getTopPerformingLinks(Organization $organization, Carbon $startDate): array
    {
        return AdTrackEvent::where('organization_id', $organization->id)
            ->where('created_at', '>=', $startDate)
            ->where('is_bot', false)
            ->select('page_url', 
                DB::raw('count(*) as hits'),
                DB::raw('avg(duration_seconds) as avg_dwell'),
                DB::raw('max(max_scroll_depth) as avg_scroll')
            )
            ->groupBy('page_url')
            ->orderByDesc('hits')
            ->limit(10)
            ->get()
            ->toArray();
    }
}
