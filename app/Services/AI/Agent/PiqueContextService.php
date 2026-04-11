<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;
use App\Models\AnalyticsProperty;
use App\Models\Schema;
use App\Models\PixelSite;
use App\Models\MetricSnapshot;
use App\Models\SearchConsoleMetric;
use App\Models\KeywordResearch;

class PiqueContextService
{
    public function __construct(
        protected PixelIntelligenceService $pixelIntelligence
    ) {}

    /**
     * Gather all relevant Metapilot data for the agent's context.
     */
    public function getContext(Organization $organization): array
    {
        return [
            'organization'      => $this->getOrganizationContext($organization),
            'schemas'           => $this->getSchemaContext($organization),
            'pixels'            => $this->getPixelContext($organization),
            'pixel_summary'     => $this->getPixelSummaryContext($organization),
            'pixel_journey'     => $this->getPixelJourneyContext($organization),
            'properties'        => $this->getAnalyticsContext($organization),
            'niche_intelligence'=> $this->getNicheContext($organization),
            'keyword_research'  => $this->getKeywordResearchContext($organization),
        ];
    }

    protected function getOrganizationContext(Organization $organization): array
    {
        return [
            'name'              => $organization->name,
            'industry'          => $organization->nicheIntelligence?->niche_name ?? 'Unknown',
            'allowed_domain'    => $organization->allowed_domain,
            'is_pixel_verified' => (bool) $organization->pixel_verified_at,
        ];
    }

    protected function getNicheContext(Organization $organization): array
    {
        $niche = $organization->nicheIntelligence;
        if (!$niche) return [];

        return [
            'detected_niche'      => $niche->detected_niche,
            'confidence'          => $niche->confidence,
            'trend_keywords'      => $niche->trend_keywords ?? [],
            'industry_benchmarks' => $niche->industry_benchmarks ?? [],
            'seasonal_patterns'   => $niche->seasonal_patterns ?? [],
            'last_updated_at'     => $niche->last_updated_at?->toDateString(),
        ];
    }

    protected function getKeywordResearchContext(Organization $organization): array
    {
        return KeywordResearch::where('organization_id', $organization->id)
            ->orderBy('last_searched_at', 'desc')
            ->limit(5)
            ->get(['query', 'intent', 'niche', 'growth_rate', 'current_interest', 'last_searched_at'])
            ->map(fn($kw) => [
                'query'            => $kw->query,
                'intent'           => $kw->intent,
                'niche'            => $kw->niche,
                'growth_rate'      => $kw->growth_rate,
                'current_interest' => $kw->current_interest,
            ])->toArray();
    }

    protected function getSchemaContext(Organization $organization): array
    {
        return $organization->schemas()
            ->with('schemaType')
            ->where('is_active', true)
            ->get()
            ->map(fn($s) => [
                'name'         => $s->name,
                'type'         => $s->schemaType?->name,
                'url'          => $s->url,
                'published_at' => $s->published_at?->toIso8601String(),
            ])->toArray();
    }

    protected function getPixelContext(Organization $organization): array
    {
        return $organization->pixelSites()
            ->get()
            ->map(fn($p) => [
                'id'      => $p->id,
                'label'   => $p->label,
                'domain'  => $p->allowed_domain,
                'token'   => $p->ads_site_token,
                'verified'=> (bool) $p->pixel_verified_at,
                'modules' => $p->enabled_modules,
            ])->toArray();
    }

    /**
     * 7-day traffic summary per pixel site.
     * Injected into the system prompt as a live performance snapshot.
     */
    protected function getPixelSummaryContext(Organization $organization): array
    {
        return $organization->pixelSites()
            ->get()
            ->map(fn($site) => [
                'site_id'  => $site->id,
                'label'    => $site->label,
                'domain'   => $site->allowed_domain,
                'stats_7d' => $this->pixelIntelligence->getSummary($organization, 7, $site->id),
            ])->toArray();
    }

    /**
     * Top pages + trend velocity — the user journey intelligence block.
     * Injected into the system prompt so Pique can proactively surface insights.
     */
    protected function getPixelJourneyContext(Organization $organization): array
    {
        // Prefer a verified site; fall back to null (org-wide aggregation)
        $activeSite = $organization->pixelSites()
            ->whereNotNull('pixel_verified_at')
            ->first();

        $siteId = $activeSite?->id;

        return [
            'site_label'      => $activeSite?->label ?? 'All Sites',
            'site_domain'     => $activeSite?->allowed_domain ?? 'N/A',
            'top_pages'       => $this->pixelIntelligence->getTopPages($organization, 5, 7, $siteId),
            'trend_velocity'  => $this->pixelIntelligence->getTrendVelocity($organization, $siteId),
        ];
    }

    protected function getAnalyticsContext(Organization $organization): array
    {
        return $organization->analyticsProperties()
            ->get()
            ->map(function ($prop) {
                return [
                    'name'           => $prop->name,
                    'is_connected'   => (bool) $prop->property_id,
                    'latest_metrics' => $this->getLatestMetrics($prop),
                    'serp_performance' => $this->getLatestGscData($prop),
                ];
            })->toArray();
    }

    protected function getLatestMetrics(AnalyticsProperty $property): ?array
    {
        $snapshot = MetricSnapshot::where('analytics_property_id', $property->id)
            ->orderBy('snapshot_date', 'desc')
            ->first();

        return $snapshot ? [
            'date'            => $snapshot->snapshot_date->format('Y-m-d'),
            'users'           => $snapshot->users,
            'sessions'        => $snapshot->sessions,
            'engagement_rate' => $snapshot->engagement_rate,
            'is_range'        => false, // single-day snapshot, not a date range
        ] : null;
    }

    protected function getLatestGscData(AnalyticsProperty $property): ?array
    {
        $metric = SearchConsoleMetric::where('analytics_property_id', $property->id)
            ->orderBy('snapshot_date', 'desc')
            ->first();

        return $metric ? [
            'date'         => $metric->snapshot_date,
            'clicks'       => $metric->clicks,
            'impressions'  => $metric->impressions,
            'avg_position' => $metric->position,
        ] : null;
    }
}
