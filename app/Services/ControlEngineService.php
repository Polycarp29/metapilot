<?php

namespace App\Services;

use App\Models\ControlEngineAlert;
use App\Models\Organization;
use App\Models\AnalyticsProperty;
use App\Models\MetricSnapshot;
use Illuminate\Support\Facades\Log;

class ControlEngineService
{
    protected KnowledgeBaseService $knowledgeBase;
    protected TrendsAnalysisService $trendsAnalysis;
    protected NicheDetectionService $nicheDetection;
    protected Ga4Service $ga4Service;
    protected GscService $gscService;

    public function __construct(
        KnowledgeBaseService $knowledgeBase,
        TrendsAnalysisService $trendsAnalysis,
        NicheDetectionService $nicheDetection,
        Ga4Service $ga4Service,
        GscService $gscService
    ) {
        $this->knowledgeBase = $knowledgeBase;
        $this->trendsAnalysis = $trendsAnalysis;
        $this->nicheDetection = $nicheDetection;
        $this->ga4Service = $ga4Service;
        $this->gscService = $gscService;
    }

    /**
     * Run full analysis for a property.
     */
    public function analyze(AnalyticsProperty $property): array
    {
        Log::info("Starting control engine analysis", [
            'property_id' => $property->id,
            'property_name' => $property->name
        ]);

        $results = [
            'critical_issues' => $this->detectCriticalIssues($property),
            'acquisition_analysis' => $this->analyzeUserAcquisition($property),
            'trend_opportunities' => $this->detectTrendOpportunities($property),
            'alerts_generated' => [],
        ];

        // Generate alerts based on findings
        $alerts = $this->generateIntelligentAlerts($property, $results);
        $results['alerts_generated'] = $alerts;

        Log::info("Control engine analysis complete", [
            'property_id' => $property->id,
            'alerts_count' => count($alerts)
        ]);

        return $results;
    }

    /**
     * Detect critical issues (sitemap, crawl errors, broken links).
     */
    public function detectCriticalIssues(AnalyticsProperty $property): array
    {
        $issues = [];

        try {
            // Check sitemap errors
            $sitemapErrors = $this->gscService->getSitemapErrors($property);
            if (!empty($sitemapErrors)) {
                $issues[] = [
                    'type' => 'sitemap_failure',
                    'severity' => 'critical',
                    'details' => $sitemapErrors,
                ];
            }

            // Check crawl errors
            $crawlErrors = $this->gscService->getCrawlErrors($property);
            if (!empty($crawlErrors)) {
                $issues[] = [
                    'type' => 'crawl_error',
                    'severity' => 'high',
                    'details' => $crawlErrors,
                ];
            }

            // Check index coverage
            $indexIssues = $this->gscService->getIndexCoverage($property);
            if (!empty($indexIssues)) {
                $issues[] = [
                    'type' => 'index_coverage',
                    'severity' => 'medium',
                    'details' => $indexIssues,
                ];
            }
        } catch (\Exception $e) {
            Log::error("Error detecting critical issues", [
                'property_id' => $property->id,
                'error' => $e->getMessage()
            ]);
        }

        return $issues;
    }

    /**
     * Analyze user acquisition patterns.
     */
    public function analyzeUserAcquisition(AnalyticsProperty $property): array
    {
        // Get historical acquisition data
        $timeSeries = $this->ga4Service->getAcquisitionTimeSeries($property, 30);
        
        if (empty($timeSeries)) {
            return ['status' => 'insufficient_data'];
        }

        // Detect anomalies
        $anomalies = $this->knowledgeBase->detectAnomalies($timeSeries);

        // Match against learned patterns
        $currentPattern = $this->knowledgeBase->analyzePattern($timeSeries);
        $matchedPattern = $this->knowledgeBase->matchPattern(
            $currentPattern,
            'acquisition',
            $property->organization
        );

        return [
            'anomalies' => $anomalies,
            'matched_pattern' => $matchedPattern ? $matchedPattern->toArray() : null,
            'current_trend' => $currentPattern['trend'] ?? 0,
        ];
    }

    /**
     * Detect trend opportunities in the organization's niche.
     */
    public function detectTrendOpportunities(AnalyticsProperty $property): array
    {
        $niche = $this->nicheDetection->detectNiche($property->organization);
        
        if (!$niche) {
            return [];
        }

        $keywords = $niche->trend_keywords ?? [];
        
        if (empty($keywords)) {
            return [];
        }

        $trending = $this->trendsAnalysis->detectTrendingTopics($keywords);

        return array_slice($trending, 0, 5); // Top 5 opportunities
    }

    /**
     * Generate intelligent alerts with recommendations.
     */
    public function generateIntelligentAlerts(AnalyticsProperty $property, array $analysisResults): array
    {
        $alerts = [];

        // Process critical issues
        foreach ($analysisResults['critical_issues'] ?? [] as $issue) {
            $alert = $this->createAlert(
                $property,
                $issue['type'],
                $issue['severity'],
                $this->generateIssueTitle($issue),
                $this->generateIssueDescription($issue),
                ['issue_details' => $issue['details']],
                $this->generateIssueRecommendations($issue)
            );
            
            if ($alert) {
                $alerts[] = $alert;
            }
        }

        // Process acquisition anomalies
        $acquisition = $analysisResults['acquisition_analysis'] ?? [];
        foreach ($acquisition['anomalies'] ?? [] as $anomaly) {
            if ($anomaly['severity'] === 'critical' || $anomaly['severity'] === 'high') {
                $alert = $this->createAlert(
                    $property,
                    $anomaly['z_score'] < 0 ? 'critical_drop' : 'unusual_spike',
                    $anomaly['severity'],
                    $this->generateAnomalyTitle($anomaly),
                    $this->generateAnomalyDescription($anomaly),
                    ['anomaly_data' => $anomaly],
                    $this->generateAnomalyRecommendations($anomaly)
                );
                
                if ($alert) {
                    $alerts[] = $alert;
                }
            }
        }

        // Process trend opportunities
        foreach ($analysisResults['trend_opportunities'] ?? [] as $opportunity) {
            if ($opportunity['growth_rate'] > 50) { // High growth rate
                $alert = $this->createAlert(
                    $property,
                    'trend_opportunity',
                    'medium',
                    "Trending opportunity: {$opportunity['keyword']}",
                    "This keyword is showing {$opportunity['growth_rate']}% growth",
                    ['opportunity' => $opportunity],
                    [
                        "Create content around '{$opportunity['keyword']}'",
                        "Optimize existing pages for this keyword",
                        "Consider running ads targeting this keyword",
                    ]
                );
                
                if ($alert) {
                    $alerts[] = $alert;
                }
            }
        }

        return $alerts;
    }

    /**
     * Update niche intelligence for organization.
     */
    public function updateNicheIntelligence(Organization $organization): void
    {
        $this->nicheDetection->detectNiche($organization);
    }

    /**
     * Get active alerts for organization.
     */
    public function getActiveAlerts(Organization $organization): array
    {
        return ControlEngineAlert::where('organization_id', $organization->id)
            ->where('is_dismissed', false)
            ->orderBy('severity')
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get pattern matches for property.
     */
    public function matchPatterns(AnalyticsProperty $property): array
    {
        $matches = [];

        // Try to match different pattern types
        foreach (['acquisition', 'engagement', 'conversion'] as $type) {
            // Get recent data
            $snapshots = MetricSnapshot::where('analytics_property_id', $property->id)
                ->whereBetween('snapshot_date', [now()->subDays(30), now()])
                ->orderBy('snapshot_date')
                ->get();

            if ($snapshots->count() >= 7) {
                $data = $this->knowledgeBase->extractFeatures($snapshots, $type);
                $pattern = $this->knowledgeBase->analyzePattern($data);
                
                $match = $this->knowledgeBase->matchPattern(
                    $pattern,
                    $type,
                    $property->organization
                );

                if ($match) {
                    $matches[$type] = $match->toArray();
                }
            }
        }

        return $matches;
    }

    /**
     * Get niche intelligence for organization.
     */
    public function getNicheIntelligence(Organization $organization): ?array
    {
        $niche = $organization->nicheIntelligence;
        return $niche ? $niche->toArray() : null;
    }

    /**
     * Create an alert.
     */
    protected function createAlert(
        AnalyticsProperty $property,
        string $type,
        string $severity,
        string $title,
        string $description,
        array $contextData,
        array $recommendations
    ): ?ControlEngineAlert {
        // Check for duplicates in last 24 hours
        $existing = ControlEngineAlert::where('organization_id', $property->organization_id)
            ->where('analytics_property_id', $property->id)
            ->where('alert_type', $type)
            ->where('created_at', '>', now()->subDay())
            ->first();

        if ($existing) {
            Log::info("Skipping duplicate alert", ['type' => $type]);
            return null;
        }

        return ControlEngineAlert::create([
            'organization_id' => $property->organization_id,
            'analytics_property_id' => $property->id,
            'alert_type' => $type,
            'severity' => $severity,
            'title' => $title,
            'description' => $description,
            'affected_metrics' => $this->extractAffectedMetrics($type),
            'recommendations' => $recommendations,
            'context_data' => $contextData,
        ]);
    }

    /**
     * Helper methods for generating alert content.
     */
    protected function generateIssueTitle(array $issue): string
    {
        $titles = [
            'sitemap_failure' => 'Sitemap submission failed',
            'crawl_error' => 'Crawl errors detected',
            'index_coverage' => 'Index coverage issues found',
        ];

        return $titles[$issue['type']] ?? 'Critical issue detected';
    }

    protected function generateIssueDescription(array $issue): string
    {
        $count = count($issue['details'] ?? []);
        return "Detected {$count} {$issue['type']} issues that require attention.";
    }

    protected function generateIssueRecommendations(array $issue): array
    {
        $recommendations = [
            'sitemap_failure' => [
                'Check sitemap.xml is accessible',
                'Verify sitemap format is valid',
                'Resubmit sitemap in Google Search Console',
            ],
            'crawl_error' => [
                'Review crawl errors in Google Search Console',
                'Fix broken internal links',
                'Check robots.txt configuration',
            ],
            'index_coverage' => [
                'Review excluded pages in Search Console',
                'Fix canonical tag issues',
                'Ensure important pages are indexable',
            ],
        ];

        return $recommendations[$issue['type']] ?? ['Review the issue in Google Search Console'];
    }

    protected function generateAnomalyTitle(array $anomaly): string
    {
        $direction = $anomaly['z_score'] < 0 ? 'drop' : 'spike';
        $percent = abs(round((($anomaly['value'] - $anomaly['expected']) / $anomaly['expected']) * 100));
        
        return "Significant {$direction} in traffic ({$percent}%)";
    }

    protected function generateAnomalyDescription(array $anomaly): string
    {
        $direction = $anomaly['z_score'] < 0 ? 'decreased' : 'increased';
        $percent = abs(round((($anomaly['value'] - $anomaly['expected']) / $anomaly['expected']) * 100));
        
        return "Traffic has {$direction} by {$percent}% on {$anomaly['date']}, from {$anomaly['expected']} to {$anomaly['value']}.";
    }

    protected function generateAnomalyRecommendations(array $anomaly): array
    {
        if ($anomaly['z_score'] < 0) {
            // Drop recommendations
            return [
                'Check for manual actions in Google Search Console',
                'Review recent website changes or updates',
                'Verify analytics tracking is working correctly',
                'Check for server downtime or performance issues',
            ];
        } else {
            // Spike recommendations
            return [
                'Identify the traffic source causing the spike',
                'Ensure your infrastructure can handle the load',
                'Capitalize on the increased attention',
                'Monitor conversion rates during spike',
            ];
        }
    }

    protected function extractAffectedMetrics(string $type): array
    {
        $metricsMap = [
            'critical_drop' => ['users', 'sessions', 'pageviews'],
            'unusual_spike' => ['users', 'sessions'],
            'sitemap_failure' => ['indexability'],
            'crawl_error' => ['crawl_budget', 'indexability'],
            'acquisition_anomaly' => ['users', 'new_users'],
            'conversion_issue' => ['conversions', 'conversion_rate'],
        ];

        return $metricsMap[$type] ?? [];
    }
}
