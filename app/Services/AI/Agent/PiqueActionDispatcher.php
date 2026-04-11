<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;
use App\Models\Sitemap;
use App\Models\AnalyticsProperty;
use App\Models\User;
use App\Services\Crawler\CrawlerManager;
use App\Services\KeywordService;
use App\Services\CampaignKeywordService;
use App\Services\ContentSeoAnalysisService;
use App\Services\SchemaValidationService;
use App\Services\GscService;
use App\Services\InsightService;
use App\Services\ForecastService;
use App\Services\BlogTopicSuggestionService;
use App\Services\StrategyService;
use App\Services\AiContentDetectionService;
use App\Services\ContentHumanizerService;
use App\Services\NicheDetectionService;
use App\Services\OpenAIService;
use App\Services\LeadScoringService;
use App\Services\AttributionService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PiqueActionDispatcher
{
    public function __construct(
        protected CrawlerManager            $crawler,
        protected KeywordService            $keywords,
        protected CampaignKeywordService    $campaignKeywords,
        protected ContentSeoAnalysisService $contentAudit,
        protected SchemaValidationService   $schemaValidator,
        protected GscService                $gsc,
        protected InsightService            $insights,
        protected ForecastService           $forecast,
        protected BlogTopicSuggestionService $blogTopics,
        protected StrategyService           $strategy,
        protected AiContentDetectionService $aiDetector,
        protected ContentHumanizerService   $humanizer,
        protected NicheDetectionService     $nicheDetection,
        protected AttributionService        $attribution,
        protected OpenAIService             $openAI,
        protected PixelIntelligenceService  $pixelIntelligence,
        protected PiqueSchedulingService    $piqueScheduling,
    ) {}

    /**
     * Detect intent from prompt and dispatch the matching action.
     * Returns null if no action matches.
     */
    public function dispatch(string $prompt, Organization $organization, User $user): ?array
    {
        $p = strtolower($prompt);

        // 1. Crawl / scan
        if ($this->contains($p, ['crawl', 'scan site', 'spider', 'crawl my site'])) {
            return $this->runCrawl($organization);
        }

        // 2. Keyword research
        if ($this->contains($p, ['research keyword', 'keyword research', 'search for keyword', 'find keywords'])) {
            $query = $this->extractQuotedOrLastWords($prompt, 3);
            return $this->runKeywordResearch($organization, $query);
        }

        // 3. Discover trending topics
        if ($this->contains($p, ['trending', 'viral topic', 'trending keyword', 'what is trending'])) {
            return $this->runDiscoverTrending($organization);
        }

        // 4. On-page SEO audit
        if ($this->contains($p, ['insight', 'analytics', 'performance', 'doing', 'data', 'visualize'])) {
            return $this->runAnalyticsInsight($organization, $prompt);
        }

        if ($this->contains($p, ['gsc', 'search console', 'clicks', 'impressions'])) {
            return $this->runGscPerformance($organization);
        }

        // 5. Schema validation / generation
        if ($this->contains($p, ['generate schema', 'create schema', 'schema for', 'json-ld for'])) {
            return $this->runGenerateSchema($organization, $prompt);
        }
        if ($this->contains($p, ['validate schema', 'check schema', 'schema error', 'schema valid'])) {
            return $this->runSchemaValidation($organization);
        }

        // 6. GSC URL inspection
        if ($this->contains($p, ['inspect url', 'check url', 'index status', 'is indexed', 'url inspection'])) {
            $url = $this->extractUrl($prompt) ?? $organization->allowed_domain;
            return $this->runUrlInspection($organization, $url);
        }

        // 7. Analytics insight / Pixel performance
        if ($this->contains($p, ['pixel', 'metapilot pixel', 'tracking data', 'pixel status'])) {
            if ($this->contains($p, ['ping', 'verify connection', 'is it working', 'check connection'])) {
                return $this->runPingPixel($organization);
            }
            if ($this->contains($p, ['breakdown', 'analysis', 'deep', 'stats', 'pixel performance'])) {
                return $this->runDeepPixelAnalysis($organization);
            }
            return $this->runPixelData($organization);
        }
        if ($this->contains($p, ['insight', 'analytics insight', 'how is my site', 'google analytics', 'site performance', 'performance data', 'performance report'])) {
            return $this->runAnalyticsInsight($organization, $prompt);
        }

        // 7.5 Attribution Intelligence
        if ($this->contains($p, ['attribution', 'channel', 'google vs', 'bing', 'yandex', 'where is traffic from', 'country performance'])) {
            return $this->runAttributionAnalysis($organization);
        }

        // 7.6 Lead Intelligence
        if ($this->contains($p, ['lead', 'hot lead', 'who is interested', 'potential customer', 'intent analysis'])) {
            return $this->runLeadIntelligence($organization);
        }

        // 8. SEO / PDF Report
        if ($this->contains($p, ['seo report', 'analytics report', 'export report', 'compile report', 'generate report', 'pdf report', 'download report'])) {
            return $this->runSeoReport($organization);
        }

        // 9. Traffic forecast
        if ($this->contains($p, ['forecast', 'predict traffic', 'projection', 'predict my'])) {
            return $this->runForecast($organization);
        }

        // 9. Blog topic suggestions
        if ($this->contains($p, ['blog topic', 'content idea', 'what should i write', 'blog idea', 'write about'])) {
            return $this->runBlogTopics($organization);
        }

        // 10. Campaign proposal
        if ($this->contains($p, ['propose campaign', 'campaign strategy', 'seo campaign', 'suggest campaign'])) {
            return $this->runCampaignProposal($organization);
        }

        // 11. AI content detection
        if ($this->contains($p, ['detect ai', 'is this ai', 'ai content', 'ai probability', 'ai written'])) {
            $content = $this->extractQuotedContent($prompt);
            return $content ? $this->runAiDetection($content) : null;
        }

        // 12. Humanize content
        if ($this->contains($p, ['humanize', 'sound human', 'rewrite this', 'make it human'])) {
            $content = $this->extractQuotedContent($prompt);
            return $content ? $this->runHumanize($content) : null;
        }

        // 13. Content SEO audit
        if ($this->contains($p, ['content audit', 'audit content', 'seo score', 'keyword gap'])) {
            $content  = $this->extractQuotedContent($prompt);
            $keywords = $this->extractKeywordsFromPrompt($prompt);
            return $content ? $this->runContentSeoAudit($content, $keywords) : null;
        }

        // 14. Niche detection
        if ($this->contains($p, ['detect niche', 'my niche', 'my industry', 'what industry', 'detect industry'])) {
            return $this->runNicheDetection($organization);
        }

        // 15. Page journey — top visited pages from pixel
        if ($this->contains($p, ['top pages', 'most visited', 'popular pages', 'which pages', 'page traffic', 'visited the most', 'page performance', 'what pages'])) {
            return $this->runPageJourney($organization);
        }

        // 16. Traffic velocity — rising / falling pages
        if ($this->contains($p, ['rising', 'gaining traffic', 'growing pages', 'trending pages', 'falling', 'losing traffic', 'pages going down', 'traffic velocity', 'trend', 'pages declining'])) {
            return $this->runTrafficVelocity($organization);
        }

        // 17. Session journey / user navigation flow
        if ($this->contains($p, ['session', 'user journey', 'visitor path', 'how do visitors navigate', 'navigation flow', 'visit path', 'page flow', 'session flow'])) {
            return $this->runSessionJourney($organization);
        }

        // 18. Device split
        if ($this->contains($p, ['mobile traffic', 'desktop traffic', 'device split', 'mobile vs desktop', 'device breakdown', 'tablet traffic', 'device type', 'graph', 'plot', 'chart'])) {
            return $this->runDeviceSplit($organization);
        }

        // 19. Page detail drill-down
        if ($this->contains($p, ['page detail', 'what happened on', 'traffic for url', 'drill down', 'details for', 'stats for page', 'page stats'])) {
            $url = $this->extractUrl($prompt);
            if ($url) {
                return $this->runPageDetail($organization, $url);
            }
        }

        // 20. Engagement / traffic quality trend
        if ($this->contains($p, ['engagement trend', 'traffic quality', 'bounce rate', 'how is traffic quality', 'dwell time trend', 'engagement rate', 'quality of traffic'])) {
            return $this->runEngagementTrend($organization);
        }

        // 21. Scheduling / Automated Tasks
        if ($this->contains($p, ['schedule', 'periodic', 'automated', 'every', 'weekly', 'daily', 'monthly'])) {
            return $this->runScheduleAction($organization, $prompt);
        }

        return null;
    }

    // ─── Action Runners ───────────────────────────────────────────────────────

    private function runCrawl(Organization $organization): array
    {
        return $this->buildContainerSelectPayload($organization);
    }

    private function runKeywordResearch(Organization $organization, string $query): array
    {
        $result = $this->keywords->research($organization, $query);
        return ['action' => 'keyword_research', 'query' => $query, 'data' => $result, 'label' => "Keyword Research: \"{$query}\""];
    }

    private function runDiscoverTrending(Organization $organization): array
    {
        $result = $this->campaignKeywords->discoverTrendingKeywords($organization);
        return ['action' => 'trending_keywords', 'data' => $result, 'label' => 'Trending keyword discovery complete'];
    }

    private function runContentAudit(Organization $organization, string $prompt): array
    {
        $url = $this->extractUrl($prompt) ?? $organization->allowed_domain;
        return ['action' => 'content_audit', 'label' => "SEO content audit triggered for {$url}", 'url' => $url, 'data' => []];
    }

    private function runGenerateSchema(Organization $organization, string $prompt): array
    {
        $url = $this->extractUrl($prompt) ?? $organization->allowed_domain;
        return ['action' => 'generate_schema', 'label' => "Generating JSON-LD schema for {$url}", 'url' => $url];
    }

    private function runStartCrawl(Organization $organization): array
    {
        return $this->buildContainerSelectPayload($organization);
    }

    /**
     * Build the container-select action payload used by the Pique chat UI.
     */
    private function buildContainerSelectPayload(Organization $organization): array
    {
        $containers = Sitemap::where('organization_id', $organization->id)
            ->withCount('links')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn ($s) => [
                'id'                => $s->id,
                'name'              => $s->name,
                'site_url'          => $s->site_url,
                'last_crawl_status' => $s->last_crawl_status,
                'links_count'       => $s->links_count,
                'manage_url'        => route('sitemaps.show', $s->id),
            ])
            ->values()
            ->toArray();

        return [
            'action'     => 'crawl_container_select',
            'label'      => 'Container Crawl Setup',
            'containers' => $containers,
        ];
    }

    private function runSchemaValidation(Organization $organization): array
    {
        $schemas = $organization->schemas()->where('is_active', true)->with('schemaType')->get();
        $results = [];
        foreach ($schemas as $schema) {
            if (!empty($schema->schema_json)) {
                $validated = $this->schemaValidator->validateSchema($schema->schema_json);
                $results[] = ['name' => $schema->name, 'type' => $schema->schemaType?->name, 'validation' => $validated];
            }
        }
        return ['action' => 'schema_validation', 'data' => $results, 'label' => "Validated {$schemas->count()} active schema(s)"];
    }

    private function runUrlInspection(Organization $organization, string $url): array
    {
        $property = $organization->analyticsProperties()->whereNotNull('property_id')->first();
        if (!$property) {
            return ['action' => 'url_inspection', 'status' => 'error', 'label' => 'No connected Google Search Console property found.'];
        }
        try {
            $result = $this->gsc->inspectUrl($property, $url);
            return ['action' => 'url_inspection', 'url' => $url, 'data' => $result, 'label' => "URL inspection: {$url}"];
        } catch (\Exception $e) {
            Log::error('Pique URL inspection failed: ' . $e->getMessage());
            return ['action' => 'url_inspection', 'status' => 'error', 'label' => 'URL inspection failed: ' . $e->getMessage()];
        }
    }

    private function runAnalyticsInsight(Organization $organization, string $prompt = ''): array
    {
        $property = $this->resolveProperty($organization, $prompt);
        if (!$property) {
            // If multiple properties exist, ask the user to pick one
            $properties = $organization->analyticsProperties()->whereNotNull('property_id')->get();
            if ($properties->count() > 1) {
                return [
                    'action'     => 'property_select_required',
                    'label'      => 'Multiple analytics properties found — please specify which one.',
                    'properties' => $properties->map(fn($p) => ['id' => $p->id, 'name' => $p->name])->toArray(),
                ];
            }
            return ['action' => 'analytics_insight', 'status' => 'error', 'label' => 'No connected analytics property found.'];
        }
        $insight = $this->insights->generateWeeklySummary($property);
        $context = $insight->context ?? [];
        
        $current = $context['current'] ?? ($context['currentData'] ?? []);
        $prior   = $context['previous'] ?? ($context['prevData'] ?? []);

        return [
            'action'   => 'analytics_insight', 
            'property' => $property->name, 
            'data'     => $insight, 
            'label'    => "Analytics insight generated for {$property->name}",
            'charts'    => [
                [
                    'type'     => 'bar',
                    'title'    => 'User & Session Overview',
                    'subtitle' => 'Traffic Volume (Last 7 Days)',
                    'data'     => [
                        'labels'   => ['Users', 'Sessions'],
                        'datasets' => [
                            [
                                'label'           => 'Current Period',
                                'data'            => [
                                    (int) ($current['total_users'] ?? 0),
                                    (int) ($current['total_sessions'] ?? 0),
                                ],
                                'backgroundColor' => '#3b82f6',
                                'borderRadius'    => 6
                            ],
                            [
                                'label'           => 'Prior Period',
                                'data'            => [
                                    (int) ($prior['total_users'] ?? 0),
                                    (int) ($prior['total_sessions'] ?? 0),
                                ],
                                'backgroundColor' => '#94a3b8',
                                'borderRadius'    => 6
                            ]
                        ]
                    ]
                ],
                [
                    'type'     => 'doughnut',
                    'title'    => 'Engagement Rate',
                    'subtitle' => 'Active vs Bounce (Last 7 Days)',
                    'data'     => [
                        'labels'   => ['Engaged', 'Not Engaged'],
                        'datasets' => [[
                            'data' => [
                                (float) ($current['engagement_rate'] ?? 0),
                                100 - (float) ($current['engagement_rate'] ?? 0),
                            ],
                            'backgroundColor' => ['#10b981', '#f1f5f9'],
                            'borderWidth' => 0
                        ]]
                    ]
                ],
                $this->getGscChart($property)
            ]
        ];
    }

    private function getGscChart(AnalyticsProperty $property): array
    {
        $gsc = \App\Models\SearchConsoleMetric::where('analytics_property_id', $property->id)
            ->orderBy('snapshot_date', 'desc')
            ->first();

        return [
            'type' => 'bar',
            'title' => 'GSC Performance',
            'subtitle' => 'Clicks vs Impressions (Latest)',
            'data' => [
                'labels' => ['Clicks', 'Impressions'],
                'datasets' => [[
                    'label' => 'Count',
                    'data' => [
                        (int) ($gsc->clicks ?? 0),
                        (int) ($gsc->impressions ?? 0),
                    ],
                    'backgroundColor' => '#6366f1',
                    'borderRadius' => 6
                ]]
            ]
        ];
    }

    private function runGscPerformance(Organization $organization): array
    {
        $property = $this->resolveConnectedProperty($organization);
        if (!$property) {
            return ['action' => 'gsc_performance', 'status' => 'error', 'label' => 'No connected analytics/GSC property found.'];
        }

        return [
            'action' => 'gsc_performance',
            'label'  => "GSC Performance for {$property->name}",
            'chart'  => $this->getGscChart($property)
        ];
    }

    private function runPixelData(Organization $organization): array
    {
        $sites = $organization->pixelSites()->withCount(['adTrackEvents as hits_24h' => function($q) {
            $q->where('created_at', '>=', now()->subHours(24));
        }])->get();

        $data = $sites->map(fn($s) => [
            'id' => $s->id,
            'label' => $s->label,
            'domain' => $s->allowed_domain,
            'token' => $s->ads_site_token,
            'hits_24h' => $s->hits_24h,
            'status' => $s->pixel_verified_at ? 'active' : 'pending',
            'enabled_modules' => $s->enabled_modules ?? ['click', 'schema']
        ]);

        return [
            'action' => 'pixel_data', 
            'sites' => $data, 
            'label' => "MetaPilot Pixel details for {$sites->count()} site(s)",
            'supported_modules' => ['click', 'schema', 'behavior', 'seo']
        ];
    }

    private function runDeepPixelAnalysis(Organization $organization): array
    {
        $limit = now()->subDays(7);
        $events = $organization->adTrackEvents()
            ->where('created_at', '>=', $limit);

        $totalHits = (clone $events)->count();
        if ($totalHits === 0) {
            return ['action' => 'deep_pixel_analysis', 'status' => 'empty', 'label' => 'No pixel data found for the last 7 days.'];
        }

        $topPages = (clone $events)
            ->selectRaw('page_url, count(*) as count')
            ->groupBy('page_url')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $engagement = (clone $events)
            ->selectRaw('avg(duration_seconds) as avg_duration, avg(click_count) as avg_clicks')
            ->first();

        $referrers = (clone $events)
            ->selectRaw('referrer, count(*) as count')
            ->whereNotNull('referrer')
            ->groupBy('referrer')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $devices = (clone $events)
            ->selectRaw('device_type, count(*) as count')
            ->groupBy('device_type')
            ->get();

        // Lead Intelligence Integration
        $leadService = app(\App\Services\LeadScoringService::class);
        $hotLeadsCount = 0;
        $sessions = (clone $events)->distinct('session_id')->pluck('session_id');
        
        foreach ($sessions as $sid) {
            $score = $leadService->scoreSession($sid);
            if ($score['label'] === 'hot') $hotLeadsCount++;
        }

        return [
            'action' => 'deep_pixel_analysis',
            'label' => "Deep MetaPilot analysis for the last 7 days",
            'stats' => [
                'total_hits' => $totalHits,
                'avg_duration' => round($engagement->avg_duration ?? 0, 1),
                'avg_clicks' => round($engagement->avg_clicks ?? 0, 1),
                'top_pages' => $topPages,
                'top_referrers' => $referrers,
                'device_breakdown' => $devices,
                'hot_leads_count' => $hotLeadsCount
            ],
            'chart' => [
                'type' => 'bar',
                'title' => 'Top Pages Performance',
                'subtitle' => 'Traffic volume by page (Last 7 Days)',
                'data' => [
                    'labels' => collect($topPages)->pluck('page_url')->map(fn($url) => Str::limit($url, 20))->toArray(),
                    'datasets' => [[
                        'label' => 'Hits',
                        'data' => collect($topPages)->pluck('count')->toArray(),
                        'backgroundColor' => '#3b82f6',
                        'borderRadius' => 6,
                    ]]
                ]
            ]
        ];
    }

    private function runLeadIntelligence(Organization $organization): array
    {
        $leadService = app(\App\Services\LeadScoringService::class);
        $limit = now()->subDays(7);
        $sessions = $organization->adTrackEvents()
            ->where('created_at', '>=', $limit)
            ->distinct('session_id')
            ->pluck('session_id');

        $hotLeads = [];
        $warmLeadsCount = 0;

        foreach ($sessions as $sid) {
            $analysis = $leadService->scoreSession($sid);
            if ($analysis['label'] === 'hot') {
                $firstEvent = $organization->adTrackEvents()->where('session_id', $sid)->first();
                $hotLeads[] = array_merge($analysis, [
                    'session_id' => $sid,
                    'last_seen' => $firstEvent->created_at->diffForHumans(),
                    'location' => ($firstEvent->city ? $firstEvent->city . ', ' : '') . $firstEvent->country_code,
                    'source' => $firstEvent->utm_source ?? ($firstEvent->referrer ? parse_url($firstEvent->referrer, PHP_URL_HOST) : 'Direct'),
                ]);
            } elseif ($analysis['label'] === 'warm') {
                $warmLeadsCount++;
            }
        }

        // Sort hot leads by score
        usort($hotLeads, fn($a, $b) => $b['score'] <=> $a['score']);

        return [
            'action' => 'lead_intelligence',
            'label' => "Lead Intelligence: Found " . count($hotLeads) . " hot leads in the last 7 days",
            'data' => [
                'hot_leads' => array_slice($hotLeads, 0, 10), // Top 10
                'warm_leads_count' => $warmLeadsCount,
                'total_analyzed' => count($sessions)
            ]
        ];
    }

    private function runPingPixel(Organization $organization): array
    {
        $sites = $organization->pixelSites()->get();
        $results = [];

        foreach ($sites as $site) {
            $lastEvent = $site->adTrackEvents()->latest()->first();
            $isLive = $lastEvent && $lastEvent->created_at->gt(now()->subMinutes(10));
            
            $results[] = [
                'label' => $site->label,
                'domain' => $site->allowed_domain,
                'status' => $isLive ? 'Connected' : 'Waiting for Signal',
                'last_signal' => $lastEvent ? $lastEvent->created_at->diffForHumans() : 'Never',
                'is_live' => $isLive
            ];
        }

        return [
            'action' => 'pixel_ping',
            'label' => "Pixel Connection Ping complete for {$sites->count()} site(s)",
            'results' => $results
        ];
    }

    private function runForecast(Organization $organization, string $prompt = ''): array
    {
        $property = $this->resolveProperty($organization, $prompt);
        if (!$property) {
            return ['action' => 'forecast', 'status' => 'error', 'label' => 'No connected analytics property to forecast.'];
        }
        $result = $this->forecast->forecast($property->id, 30, 14);
        return ['action' => 'forecast', 'property' => $property->name, 'data' => $result, 'label' => "14-day traffic forecast for {$property->name}"];
    }

    private function runBlogTopics(Organization $organization): array
    {
        $topics = $this->blogTopics->getSuggestions($organization);
        return ['action' => 'blog_topics', 'data' => $topics, 'label' => 'Blog topic suggestions generated'];
    }

    private function runCampaignProposal(Organization $organization, string $prompt = ''): array
    {
        $property = $this->resolveProperty($organization, $prompt);
        if (!$property) {
            return ['action' => 'campaign_proposal', 'status' => 'error', 'label' => 'No analytics property to base a campaign on.'];
        }
        $proposal = $this->strategy->proposeCampaign($property);
        return ['action' => 'campaign_proposal', 'property' => $property->name, 'data' => $proposal, 'label' => 'SEO campaign proposal generated'];
    }

    private function runAiDetection(string $content): array
    {
        $result = $this->aiDetector->analyze($content);
        return ['action' => 'ai_detection', 'data' => $result, 'label' => "AI detection complete — score: {$result['ai_score']}%"];
    }

    private function runHumanize(string $content): array
    {
        $result = $this->humanizer->humanize($content);
        return ['action' => 'humanize', 'data' => $result, 'label' => 'Content humanized'];
    }

    private function runContentSeoAudit(string $content, array $keywords): array
    {
        $result = $this->openAI->auditContentForSeo($content, $keywords);
        return ['action' => 'content_seo_audit', 'data' => $result, 'label' => 'Content SEO audit complete'];
    }

    private function runNicheDetection(Organization $organization): array
    {
        $niche = $this->nicheDetection->detectNiche($organization);
        return ['action' => 'niche_detection', 'data' => $niche ? $niche->toArray() : null, 'label' => "Niche detected: " . ($niche?->detected_niche ?? 'Unknown')];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function runSeoReport(Organization $organization): array
    {
        $properties = $organization->analyticsProperties()
            ->where('is_active', true)
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'property_id' => $p->property_id,
                'website_url' => $p->website_url,
            ])
            ->toArray();

        return [
            'action'     => 'report_property_select',
            'label'      => 'SEO Report Configuration',
            'properties' => $properties,
            'response'   => "I can help you compile a professional SEO report. Which analytics properties should I include?"
        ];
    }

    /**
     * Resolve an analytics property by matching a property name mentioned in the prompt.
     * Falls back to the first connected property if no match is found.
     */
    private function resolveProperty(Organization $organization, string $prompt = ''): ?\App\Models\AnalyticsProperty
    {
        $properties = $organization->analyticsProperties()->whereNotNull('property_id')->get();
        if ($properties->isEmpty()) return null;

        // Try to find a property whose name appears in the prompt (case-insensitive)
        if (!empty($prompt)) {
            $pl = strtolower($prompt);
            foreach ($properties as $prop) {
                if (str_contains($pl, strtolower($prop->name))) {
                    return $prop;
                }
                // Also match on website_url domain fragment
                $domain = parse_url($prop->website_url ?? '', PHP_URL_HOST);
                if ($domain && str_contains($pl, strtolower($domain))) {
                    return $prop;
                }
            }
        }

        // Default: first connected property
        return $properties->first();
    }

    private function contains(string $prompt, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($prompt, $needle)) return true;
        }
        return false;
    }

    private function extractUrl(string $prompt): ?string
    {
        preg_match('/https?:\/\/[^\s]+/', $prompt, $matches);
        return $matches[0] ?? null;
    }

    private function extractQuotedContent(string $prompt): ?string
    {
        // Try triple backtick blocks first, then quoted strings
        if (preg_match('/```(.*?)```/s', $prompt, $m)) return trim($m[1]);
        if (preg_match('/"([^"]{30,})"/s', $prompt, $m)) return trim($m[1]);
        return null;
    }

    private function extractQuotedOrLastWords(string $prompt, int $fallbackWords = 3): string
    {
        // Try to extract a quoted phrase
        if (preg_match('/"([^"]+)"/', $prompt, $m)) return trim($m[1]);
        if (preg_match("/[''']([^''']+)[''']/", $prompt, $m)) return trim($m[1]);
        // Fallback: take last N words
        $words = explode(' ', trim($prompt));
        return implode(' ', array_slice($words, -$fallbackWords));
    }

    private function extractKeywordsFromPrompt(string $prompt): array
    {
        // Try to find a "keywords:" or "for: X, Y, Z" pattern
        if (preg_match('/(?:keywords?|targeting|for)[:\s]+([^."\n]+)/i', $prompt, $m)) {
            return array_map('trim', explode(',', $m[1]));
        }
        return [];
    }

    private function runAttributionAnalysis(\App\Models\Organization $organization): array
    {
        $data = $this->attribution->analyze($organization);
        
        // Enrich with Keyword Inference for top pages
        $property = $organization->analyticsProperties()->first();

        if ($property) {
            foreach ($data['top_links'] as &$link) {
                $url = $link['page_url'];
                $keywords = $this->gsc->getTopKeywordsForUrl($property, $url);
                $link['inferred_keywords'] = array_slice($keywords, 0, 5);
            }
        }

        $channels = $data['channels'] ?? [];
        $labels   = array_keys($channels);
        $values   = array_values($channels);

        return [
            'action' => 'attribution_analysis',
            'label'  => 'Attribution and channel analysis complete',
            'data'   => $data,
            'chart'  => [
                'type'     => 'doughnut',
                'title'    => 'Traffic by Channel',
                'subtitle' => 'Referrer & Source Breakdown',
                'data'     => [
                    'labels'   => array_map(fn($l) => ucfirst($l), $labels),
                    'datasets' => [[
                        'data'            => $values,
                        'backgroundColor' => ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
                        'borderWidth'     => 0
                    ]]
                ]
            ]
        ];
    }

    // ─── Pixel Journey Action Runners (Pique-only via PixelIntelligenceService) ─

    private function runPageJourney(Organization $organization): array
    {
        $topPages    = $this->pixelIntelligence->getTopPages($organization, 10, 7);
        $velocity    = $this->pixelIntelligence->getTrendVelocity($organization);

        return [
            'action'          => 'page_journey',
            'label'           => 'Page journey intelligence retrieved',
            'data'            => [
                'top_pages'       => $topPages,
                'rising_pages'    => $velocity['rising'],
                'falling_pages'   => $velocity['falling'],
            ],
            'chart' => [
                'type' => 'bar',
                'title' => 'Top Pages by Traffic',
                'subtitle' => 'Most visited pages recently',
                'data' => [
                    'labels' => collect($topPages)->pluck('url')->map(fn($url) => Str::limit($url, 20))->toArray(),
                    'datasets' => [[
                        'label' => 'Hits',
                        'data' => collect($topPages)->pluck('hit_count')->toArray(),
                        'backgroundColor' => '#10b981',
                        'borderRadius' => 6,
                    ]]
                ]
            ]
        ];
    }

    private function runTrafficVelocity(Organization $organization): array
    {
        $velocity = $this->pixelIntelligence->getTrendVelocity($organization);

        return [
            'action' => 'traffic_velocity',
            'label'  => 'Traffic velocity report: rising and falling pages',
            'data'   => $velocity,
            'chart'  => [
                'type' => 'bar',
                'title' => 'Traffic Velocity',
                'subtitle' => 'High-growth vs Declining pages (Hits)',
                'data' => [
                    'labels' => collect($velocity['rising'])->merge($velocity['falling'])->pluck('url')->map(fn($url) => Str::limit($url, 15))->toArray(),
                    'datasets' => [[
                        'label' => 'Hit Velocity',
                        'data' => collect($velocity['rising'])->pluck('hit_count')->merge(collect($velocity['falling'])->pluck('hit_count')->map(fn($h) => -$h))->toArray(),
                        'backgroundColor' => collect($velocity['rising'])->map(fn() => '#10b981')->merge(collect($velocity['falling'])->map(fn() => '#ef4444'))->toArray(),
                        'borderRadius' => 6,
                    ]]
                ]
            ]
        ];
    }

    private function runSessionJourney(Organization $organization): array
    {
        $flows = $this->pixelIntelligence->getJourneyFlows($organization);

        return [
            'action' => 'session_journey',
            'label'  => 'User session journey flows retrieved',
            'data'   => $flows,
        ];
    }

    private function runPageDetail(Organization $organization, string $url): array
    {
        $detail = $this->pixelIntelligence->getPageDetail($organization, $url);

        return [
            'action' => 'page_detail',
            'label'  => "Page detail for {$url}",
            'data'   => $detail,
            'chart'  => [
                'type'     => 'doughnut',
                'title'    => 'Device Split for this Page',
                'subtitle' => 'Traffic breakdown by hardware',
                'data'     => [
                    'labels'   => ['Mobile', 'Desktop', 'Tablet'],
                    'datasets' => [[
                        'data'            => [
                            $detail['by_device']['mobile']  ?? 0,
                            $detail['by_device']['desktop'] ?? 0,
                            $detail['by_device']['tablet']  ?? 0,
                        ],
                        'backgroundColor' => ['#10b981', '#3b82f6', '#f59e0b'],
                        'borderWidth'     => 0
                    ]]
                ]
            ]
        ];
    }

    private function runDeviceSplit(Organization $organization): array
    {
        $split   = $this->pixelIntelligence->getDeviceSplit($organization);
        $summary = $this->pixelIntelligence->getSummary($organization, 7);

        // Prepare Chart Data
        $labels = array_map(fn($k) => ucfirst($k), array_keys($split));
        $values = array_values($split);

        return [
            'action' => 'device_split',
            'label'  => 'Device traffic breakdown retrieved',
            'data'   => [
                'device_split' => $split,
                'period'       => '7 days',
                'total_hits'   => $summary['total_hits'],
            ],
            'chart'  => [
                'type' => 'doughnut',
                'title' => 'Device Type Split',
                'subtitle' => 'Traffic by Device (Last 7 Days)',
                'data' => [
                    'labels' => $labels,
                    'datasets' => [[
                        'data' => $values,
                        'backgroundColor' => ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
                        'borderWidth' => 0
                    ]]
                ]
            ]
        ];
    }

    private function runEngagementTrend(Organization $organization): array
    {
        $current = $this->pixelIntelligence->getSummary($organization, 7);
        $prior   = $this->pixelIntelligence->getSummary($organization, 14);

        return [
            'action' => 'engagement_trend',
            'label'  => 'Engagement and traffic quality trend',
            'data'   => [
                'last_7_days'  => $current,
                'last_14_days' => $prior,
            ],
            'chart'  => [
                'type'     => 'line',
                'title'    => 'Traffic Engagement Trend',
                'subtitle' => 'Last 7 Days vs Prior 7 Days',
                'data'     => [
                    'labels'   => ['Previous Period', 'Current Period'],
                    'datasets' => [
                        [
                            'label'           => 'Total Hits',
                            'data'            => [$prior['total_hits'], $current['total_hits']],
                            'borderColor'     => '#3b82f6',
                            'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                            'fill'            => true,
                            'tension'         => 0.4
                        ],
                        [
                            'label'           => 'Engaged Hits',
                            'data'            => [
                                round(($prior['total_hits'] * ($prior['engagement_rate'] ?? 0)) / 100), 
                                round(($current['total_hits'] * ($current['engagement_rate'] ?? 0)) / 100)
                            ],
                            'borderColor'     => '#10b981',
                            'backgroundColor' => 'rgba(16, 185, 129, 0.1)',
                            'fill'            => true,
                            'tension'         => 0.4
                        ]
                    ]
                ]
            ]
        ];
    }
    private function runScheduleAction(Organization $organization, string $prompt): array
    {
        $p = strtolower($prompt);
        
        // Basic parser for AI intent
        $type = $this->contains($p, ['crawl', 'scan']) ? 'crawl' : 'analytics_alert';
        $freq = $this->contains($p, ['daily', 'every day']) ? 'daily' 
              : ($this->contains($p, ['monthly']) ? 'monthly' : 'weekly');
        
        $params = [
            'type' => $type,
            'frequency' => $freq,
            'run_at' => '08:00', // Default
            'day_of_week' => 1,    // Monday
            'payload' => [
                'prompt_context' => $prompt
            ]
        ];

        $result = $this->piqueScheduling->scheduleTask($organization, $params);

        return [
            'action' => 'schedule_task',
            'label'  => $result['label'],
            'data'   => $result,
        ];
    }
}

