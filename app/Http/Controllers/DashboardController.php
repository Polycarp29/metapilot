<?php

namespace App\Http\Controllers;

use App\Models\Schema;
use App\Models\SchemaType;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        $sitemapIds = $organization->sitemaps()->pluck('id');

        // 1. Basic Schema Stats
        $stats = [
            'totalSchemas' => \App\Models\Schema::where('organization_id', $organization->id)->count(),
            'totalTypes' => \App\Models\SchemaType::where('is_active', true)->count(),
            'activeSchemas' => \App\Models\Schema::where('organization_id', $organization->id)->where('is_active', true)->count()
        ];

        // 2. SEO Coverage Stats
        $totalLinks = \App\Models\SitemapLink::whereIn('sitemap_id', $sitemapIds)->count();
        $coveredLinks = \App\Models\SitemapLink::whereIn('sitemap_id', $sitemapIds)
            ->where(function ($query) {
                $query->whereNotNull('extracted_json_ld')
                      ->orWhereNotNull('ai_schema_data');
            })->count();
        
        $stats['totalLinks'] = $totalLinks;
        $stats['seoCoverage'] = $totalLinks > 0 ? round(($coveredLinks / $totalLinks) * 100, 1) : 0;

        // 3. Search Visibility (Last 30 Days)
        $propertyIds = $organization->analyticsProperties()->pluck('id');
        $searchStats = \App\Models\SearchConsoleMetric::whereIn('analytics_property_id', $propertyIds)
            ->where('snapshot_date', '>=', now()->subDays(30))
            ->selectRaw('SUM(clicks) as total_clicks, SUM(impressions) as total_impressions')
            ->first();
        
        $stats['totalClicks'] = (int) ($searchStats->total_clicks ?? 0);
        $stats['totalImpressions'] = (int) ($searchStats->total_impressions ?? 0);

        // 4. Recent Insights
        $recentInsights = \App\Models\Insight::whereIn('analytics_property_id', $propertyIds)
            ->latest('insight_at')
            ->limit(3)
            ->get();

        // 5. Sitemap Health
        $sitemaps = $organization->sitemaps()
            ->select('id', 'name', 'site_url', 'last_crawl_status', 'last_generated_at')
            ->withCount('links')
            ->get();

        $recentSchemas = \App\Models\Schema::where('organization_id', $organization->id)
            ->with('schemaType')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentSchemas' => $recentSchemas,
            'sitemaps' => $sitemaps,
            'recentInsights' => $recentInsights,
            'organizationName' => $organization->name
        ]);
    }
}