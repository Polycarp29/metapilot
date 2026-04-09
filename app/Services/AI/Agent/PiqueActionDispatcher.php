<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;
use App\Models\User;
use App\Models\AnalyticsProperty;
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
use Illuminate\Support\Facades\Log;

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
        protected OpenAIService             $openAI,
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
        if ($this->contains($p, ['audit', 'site audit', 'analyze site', 'site health', 'on-page seo'])) {
            return $this->runContentAudit($organization, $prompt);
        }

        // 4. Crawl / Scan
        if ($this->contains($p, ['crawl', 'scan site', 'discover links', 'start crawl', 'find broken links'])) {
            return $this->runStartCrawl($organization);
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
            if ($this->contains($p, ['breakdown', 'analysis', 'deep', 'stats', 'performance'])) {
                return $this->runDeepPixelAnalysis($organization);
            }
            return $this->runPixelData($organization);
        }
        if ($this->contains($p, ['insight', 'performance', 'analytics report', 'traffic report', 'how is my site'])) {
            return $this->runAnalyticsInsight($organization);
        }

        // 8. Traffic forecast
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

        return null;
    }

    // ─── Action Runners ───────────────────────────────────────────────────────

    private function runCrawl(Organization $organization): array
    {
        $sitemap = $organization->sitemaps()->first();
        if (!$sitemap) {
            return ['action' => 'crawl', 'status' => 'error', 'label' => 'No sitemap registered — add a sitemap first.'];
        }
        $this->crawler->dispatch($sitemap->id, $organization->allowed_domain);
        return ['action' => 'crawl', 'status' => 'dispatched', 'label' => "Crawl dispatched for {$organization->allowed_domain}"];
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
        $sitemap = $organization->sitemaps()
            ->orderBy('is_discovery', 'desc')
            ->whereNotNull('site_url')
            ->first();

        if (!$sitemap) {
            return ['action' => 'start_crawl', 'status' => 'error', 'label' => 'No sitemap or site URL found to crawl.'];
        }

        $result = $this->crawler->dispatch($sitemap->id, $sitemap->site_url);

        if (!$result) {
            return ['action' => 'start_crawl', 'status' => 'error', 'label' => 'Failed to dispatch crawl job.'];
        }

        $sitemap->update([
            'last_crawl_status' => 'dispatched',
            'last_crawl_job_id' => $result['job_id'] ?? null
        ]);

        return [
            'action' => 'start_crawl',
            'status' => 'success',
            'label' => "Crawl initialized for {$sitemap->site_url}",
            'job_id' => $result['job_id'] ?? null,
            'data' => $result
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

    private function runAnalyticsInsight(Organization $organization): array
    {
        $property = $organization->analyticsProperties()->whereNotNull('property_id')->first();
        if (!$property) {
            return ['action' => 'analytics_insight', 'status' => 'error', 'label' => 'No connected analytics property found.'];
        }
        $insight = $this->insights->generateWeeklySummary($property);
        return ['action' => 'analytics_insight', 'data' => $insight, 'label' => "Analytics insight generated for {$property->name}"];
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

        return [
            'action' => 'deep_pixel_analysis',
            'label' => "Deep MetaPilot analysis for the last 7 days",
            'stats' => [
                'total_hits' => $totalHits,
                'avg_duration' => round($engagement->avg_duration ?? 0, 1),
                'avg_clicks' => round($engagement->avg_clicks ?? 0, 1),
                'top_pages' => $topPages,
                'top_referrers' => $referrers,
                'device_breakdown' => $devices
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

    private function runForecast(Organization $organization): array
    {
        $property = $organization->analyticsProperties()->whereNotNull('property_id')->first();
        if (!$property) {
            return ['action' => 'forecast', 'status' => 'error', 'label' => 'No connected analytics property to forecast.'];
        }
        $result = $this->forecast->forecast($property->id, 30, 14);
        return ['action' => 'forecast', 'data' => $result, 'label' => "14-day traffic forecast for {$property->name}"];
    }

    private function runBlogTopics(Organization $organization): array
    {
        $topics = $this->blogTopics->getSuggestions($organization);
        return ['action' => 'blog_topics', 'data' => $topics, 'label' => 'Blog topic suggestions generated'];
    }

    private function runCampaignProposal(Organization $organization): array
    {
        $property = $organization->analyticsProperties()->whereNotNull('property_id')->first();
        if (!$property) {
            return ['action' => 'campaign_proposal', 'status' => 'error', 'label' => 'No analytics property to base a campaign on.'];
        }
        $proposal = $this->strategy->proposeCampaign($property);
        return ['action' => 'campaign_proposal', 'data' => $proposal, 'label' => 'SEO campaign proposal generated'];
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
}
