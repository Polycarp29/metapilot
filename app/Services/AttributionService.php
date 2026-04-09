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

        // 3. High-Performing Landing Pages (The "Links that are doing well")
        $topLinks = $this->getTopPerformingLinks($organization, $startDate);

        return [
            'summary' => [
                'period_days' => $days,
                'total_hits'  => array_sum(array_column($channelStats, 'hits')),
            ],
            'channels'  => $channelStats,
            'countries' => $countryStats,
            'top_links' => $topLinks,
        ];
    }

    /**
     * Group traffic by channel (Organic, Paid, Social, etc.)
     */
    private function getChannelStats(Organization $organization, Carbon $startDate): array
    {
        $events = AdTrackEvent::where('organization_id', $organization->id)
            ->where('created_at', '>=', $startDate)
            ->where('is_bot', false)
            ->get();

        $stats = [
            'Paid Search'    => ['hits' => 0, 'engagement' => 0, 'leads' => 0],
            'Organic Search' => ['hits' => 0, 'engagement' => 0, 'leads' => 0],
            'Social'         => ['hits' => 0, 'engagement' => 0, 'leads' => 0],
            'Direct'         => ['hits' => 0, 'engagement' => 0, 'leads' => 0],
            'Referral'       => ['hits' => 0, 'engagement' => 0, 'leads' => 0],
        ];

        foreach ($events as $event) {
            $channel = $this->classifyChannel($event);
            if (!isset($stats[$channel])) $stats[$channel] = ['hits' => 0, 'engagement' => 0, 'leads' => 0];

            $stats[$channel]['hits']++;
            
            // Engagement logic (using dwell time or scroll)
            if (($event->duration_seconds >= 30) || ($event->max_scroll_depth >= 50)) {
                $stats[$channel]['engagement']++;
            }

            // Lead logic (using lead scoring threshold - assumed 70+ if we had it here, 
            // but we can use is_engaged as a proxy for leads in this rapid summary)
            if ($event->metadata['is_engaged'] ?? false) {
                $stats[$channel]['leads']++;
            }
        }

        // Calculate rates
        foreach ($stats as $name => &$data) {
            $data['engagement_rate'] = $data['hits'] > 0 ? round(($data['engagement'] / $data['hits']) * 100, 1) : 0;
        }

        return $stats;
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
     * Group metrics by country.
     */
    private function getCountryStats(Organization $organization, Carbon $startDate): array
    {
        return AdTrackEvent::where('organization_id', $organization->id)
            ->where('created_at', '>=', $startDate)
            ->where('is_bot', false)
            ->select('country_code', 
                DB::raw('count(*) as hits'), 
                DB::raw('sum(case when duration_seconds >= 30 then 1 else 0 end) as engaged_hits')
            )
            ->groupBy('country_code')
            ->orderByDesc('hits')
            ->limit(10)
            ->get()
            ->map(function($row) {
                $row->engagement_rate = $row->hits > 0 ? round(($row->engaged_hits / $row->hits) * 100, 1) : 0;
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
            ->limit(5)
            ->get()
            ->toArray();
    }
}
