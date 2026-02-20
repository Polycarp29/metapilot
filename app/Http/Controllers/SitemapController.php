<?php

namespace App\Http\Controllers;

use App\Models\Sitemap;
use App\Models\SitemapLink;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

use App\Services\SitemapService;
use App\Jobs\CrawlSitemapJob;
use App\Models\Schema;
use App\Models\SchemaType;
use App\Models\SchemaField;
use App\Models\CrawlSchedule;

class SitemapController extends Controller
{
    protected $sitemapService;

    public function __construct(SitemapService $sitemapService)
    {
        $this->sitemapService = $sitemapService;
    }

    /**
     * Verify that a sitemap belongs to the current user's organization.
     */
    private function authorizeForOrganization(Sitemap $sitemap): void
    {
        $organization = auth()->user()->currentOrganization();
        if (!$organization || $sitemap->organization_id !== $organization->id) {
            abort(403, 'You do not have access to this sitemap.');
        }
    }

    /**
     * Verify that a sitemap link belongs to the current user's organization.
     */
    private function authorizeLinkForOrganization(SitemapLink $link): void
    {
        $link->loadMissing('sitemap');
        $this->authorizeForOrganization($link->sitemap);
    }

    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return redirect()->route('dashboard')->with('error', 'No organization selected.');
        }

        $sitemaps = Sitemap::where('organization_id', $organization->id)
            ->withCount('links')
            ->with('schedule')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Sitemaps/Index', [
            'sitemaps' => $sitemaps
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'site_url' => 'nullable|url|max:255',
            'filename' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('sitemaps')->where(function ($query) {
                    return $query->where('organization_id', auth()->user()->currentOrganization()->id);
                })
            ],
            'is_index' => 'boolean'
        ]);

        if (!str_ends_with($validated['filename'], '.xml')) {
            $validated['filename'] .= '.xml';
        }

        $user = auth()->user();
        $organization = $user->currentOrganization();
        $owner = $organization->owners()->first() ?? $user;

        $sitemap = Sitemap::create(array_merge($validated, [
            'organization_id' => $organization->id,
            'user_id' => $owner->id
        ]));

        return redirect()->route('sitemaps.show', $sitemap)
            ->with('message', 'Sitemap container created!');
    }

    public function update(Request $request, Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'site_url' => 'nullable|url|max:255',
            'filename' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('sitemaps')->where(function ($query) {
                    return $query->where('organization_id', auth()->user()->currentOrganization()->id);
                })->ignore($sitemap->id)
            ],
            'is_index' => 'boolean'
        ]);

        if (!str_ends_with($validated['filename'], '.xml')) {
            $validated['filename'] .= '.xml';
        }

        $sitemap->update($validated);

        return back()->with('message', 'Sitemap updated!');
    }

    public function destroy(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $sitemap->links()->delete();
        $sitemap->delete();

        return redirect()->route('sitemaps.index')->with('message', 'Sitemap deleted!');
    }

    public function show(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        // Efficient duplicate detection using a subquery
        $linkUrls = $sitemap->links()->pluck('url');
        $duplicateCount = SitemapLink::whereIn('url', $linkUrls)
            ->where('sitemap_id', '!=', $sitemap->id)
            ->whereHas('sitemap', function ($query) use ($sitemap) {
                $query->where('organization_id', $sitemap->organization_id);
            })
            ->distinct('url')
            ->count('url');

        return Inertia::render('Sitemaps/Manager', [
            'sitemap' => $sitemap->load('schedule'),
            'links' => $sitemap->links()->orderBy('created_at', 'desc')->paginate(100),
            'duplicateCount' => $duplicateCount
        ]);
    }

    public function import(Request $request, Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $request->validate([
            'file' => 'required|mimes:csv,txt,xml'
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $content = file_get_contents($file->getRealPath());
        
        // Strip BOM if present
        $content = preg_replace('/^[\xEF\xBB\xBF\xFE\xFF\xFF\xFE]*/', '', $content);
        
        $urls = [];

        if ($extension === 'xml' || str_contains($content, '<?xml') || str_contains($content, '<urlset')) {
            try {
                $xml = simplexml_load_string($content);
                if ($xml) {
                    if ($xml->url) {
                        foreach ($xml->url as $urlNode) {
                            if (isset($urlNode->loc)) {
                                $urls[] = (string)$urlNode->loc;
                            }
                        }
                    } 
                    elseif ($xml->sitemap) {
                        foreach ($xml->sitemap as $sitemapNode) {
                            if (isset($sitemapNode->loc)) {
                                $urls[] = (string)$sitemapNode->loc;
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                preg_match_all('/<loc>(.*?)<\/loc>/', $content, $matches);
                $urls = array_merge($urls, $matches[1] ?? []);
            }
        } else {
            $lines = preg_split('/\r\n|\r|\n/', $content);
            foreach ($lines as $line) {
                $parts = str_getcsv($line);
                $url = trim($parts[0] ?? '');
                
                if ($url) {
                    $urls[] = $url;
                }
            }
        }

        $imported = 0;
        foreach (array_unique($urls) as $url) {
            $sanitizedUrl = $this->sitemapService->sanitizeUrl($url);
            
            if (!$sanitizedUrl || !$this->sitemapService->isValidUrl($sanitizedUrl)) {
                continue;
            }

            if (in_array(strtolower(basename($sanitizedUrl)), ['url', 'loc', 'location'])) {
                continue;
            }

            if (!$this->sitemapService->isDuplicate($sitemap->id, $sanitizedUrl)) {
                $bottlenecks = $this->sitemapService->analyzeUrlStructure($sanitizedUrl);
                $slugQuality = $this->sitemapService->assessSlugQuality($sanitizedUrl);

                SitemapLink::create([
                    'sitemap_id' => $sitemap->id,
                    'url' => $sanitizedUrl,
                    'lastmod' => now()->format('Y-m-d'),
                    'changefreq' => 'daily',
                    'priority' => 0.7,
                    'seo_bottlenecks' => $bottlenecks,
                    'url_slug_quality' => $slugQuality,
                ]);
                $imported++;
            }
        }

        return back()->with('message', "Successfully imported $imported unique links!");
    }

    public function addLink(Request $request, Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $validated = $request->validate([
            'url' => 'required|string',
            'priority' => 'numeric|min:0|max:1',
            'changefreq' => 'string'
        ]);

        $sanitizedUrl = $this->sitemapService->sanitizeUrl($validated['url']);

        if (!$sanitizedUrl || !$this->sitemapService->isValidUrl($sanitizedUrl)) {
            return back()->withErrors(['url' => 'The provided URL is invalid or could not be sanitized.']);
        }

        if ($this->sitemapService->isDuplicate($sitemap->id, $sanitizedUrl)) {
            return back()->withErrors(['url' => 'This URL already exists in this sitemap.']);
        }

        $bottlenecks = $this->sitemapService->analyzeUrlStructure($sanitizedUrl);
        $slugQuality = $this->sitemapService->assessSlugQuality($sanitizedUrl);

        SitemapLink::create(array_merge($validated, [
            'sitemap_id' => $sitemap->id,
            'url' => $sanitizedUrl,
            'seo_bottlenecks' => $bottlenecks,
            'url_slug_quality' => $slugQuality,
        ]));

        return back()->with('message', 'Link added to sitemap!');
    }

    public function updateLink(Request $request, SitemapLink $link)
    {
        $this->authorizeLinkForOrganization($link);

        $validated = $request->validate([
            'url' => 'required|string',
            'priority' => 'numeric|min:0|max:1',
            'changefreq' => 'string'
        ]);

        $sanitizedUrl = $this->sitemapService->sanitizeUrl($validated['url']);

        if (!$sanitizedUrl || !$this->sitemapService->isValidUrl($sanitizedUrl)) {
            return back()->withErrors(['url' => 'The provided URL is invalid or could not be sanitized.']);
        }

        if ($this->sitemapService->isDuplicate($link->sitemap_id, $sanitizedUrl, $link->id)) {
            return back()->withErrors(['url' => 'This URL already exists in this sitemap.']);
        }

        $bottlenecks = $this->sitemapService->analyzeUrlStructure($sanitizedUrl);
        $slugQuality = $this->sitemapService->assessSlugQuality($sanitizedUrl);

        $link->update(array_merge($validated, [
            'url' => $sanitizedUrl,
            'seo_bottlenecks' => $bottlenecks,
            'url_slug_quality' => $slugQuality,
        ]));

        return back()->with('message', 'Link updated!');
    }

    public function destroyLink(SitemapLink $link)
    {
        $this->authorizeLinkForOrganization($link);

        $link->delete();

        return back()->with('message', 'Link removed!');
    }

    public function generate(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;

        if ($sitemap->is_index) {
            $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;
            $otherSitemaps = Sitemap::where('organization_id', $sitemap->organization_id)
                ->where('is_index', false)
                ->get();
            foreach ($otherSitemaps as $other) {
                $siteUrl = rtrim($sitemap->site_url ?? url('/'), '/');
                $xml .= '  <sitemap>' . PHP_EOL;
                $xml .= '    <loc>' . $siteUrl . '/' . $other->filename . '</loc>' . PHP_EOL;
                $xml .= '    <lastmod>' . ($other->last_generated_at ? $other->last_generated_at->format('c') : now()->format('c')) . '</lastmod>' . PHP_EOL;
                $xml .= '  </sitemap>' . PHP_EOL;
            }
            $xml .= '</sitemapindex>';
        } else {
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">' . PHP_EOL;
            
            $links = $sitemap->links()
                ->where('is_canonical', true)
                ->where('http_status', 200)
                ->get();
            foreach ($links as $link) {
                $xml .= '  <url>' . PHP_EOL;
                $xml .= '    <loc>' . htmlspecialchars($link->url) . '</loc>' . PHP_EOL;
                if ($link->lastmod) {
                    $xml .= '    <lastmod>' . $link->lastmod . '</lastmod>' . PHP_EOL;
                }
                $xml .= '    <changefreq>' . ($link->changefreq ?: 'daily') . '</changefreq>' . PHP_EOL;
                $xml .= '    <priority>' . number_format($link->priority ?: 0.7, 1) . '</priority>' . PHP_EOL;
                $xml .= '  </url>' . PHP_EOL;
            }
            $xml .= '</urlset>';
        }

        $sitemap->update(['last_generated_at' => now()]);

        return response($xml)
            ->header('Content-Type', 'application/xml; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $sitemap->filename . '"');
    }

    public function exportReport(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $links = $sitemap->links()->orderBy('url')->get();
        $filename = "crawler-report-" . Str::slug($sitemap->name) . "-" . now()->format('Y-m-d') . ".csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($links) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, [
                'URL',
                'Title',
                'Description',
                'H1',
                'Status',
                'HTTP Status',
                'Is Canonical?',
                'Canonical URL',
                'Depth',
                'Load Time (s)',
                'Internal Links In',
                'Internal Links Out',
                'Priority',
                'ChangeFreq'
            ]);

            foreach ($links as $link) {
                fputcsv($file, [
                    $link->url,
                    $link->title ?? 'N/A',
                    $link->description ?? 'N/A',
                    $link->h1 ?? 'N/A',
                    $link->status,
                    $link->http_status ?? 200,
                    $link->is_canonical ? 'Yes' : 'No',
                    $link->canonical_url ?? $link->url,
                    $link->depth_from_root,
                    number_format($link->load_time, 2),
                    $link->internal_links_in,
                    $link->internal_links_out,
                    $link->priority,
                    $link->changefreq
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportPdf(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $links = $sitemap->links()
            ->orderBy('url')
            ->get();

        $pdf = Pdf::loadView('reports.crawler_pdf', [
            'sitemap' => $sitemap,
            'links' => $links
        ])->setPaper('a4', 'landscape');

        $filename = "crawler-report-" . Str::slug($sitemap->name) . "-" . now()->format('Y-m-d') . ".pdf";

        return $pdf->download($filename);
    }

    public function crawl(Request $request, Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $validated = $request->validate([
            'starting_url' => 'nullable|url',
            'max_depth' => 'nullable|integer|min:1|max:10',
            'render_js' => 'boolean'
        ]);

        $startUrl = $validated['starting_url'] ?? ($sitemap->site_url ?? $sitemap->name);

        if (!filter_var($startUrl, FILTER_VALIDATE_URL)) {
            return back()->with('error', 'A valid Site URL is required to start a crawl. Please update the sitemap settings.');
        }

        $jobId = (string) \Illuminate\Support\Str::uuid();

        $crawlerManager = app(\App\Services\Crawler\CrawlerManager::class);
        $result = $crawlerManager->dispatch(
            $sitemap->id,
            $startUrl,
            $validated['max_depth'] ?? 3,
            array_merge($validated, ['job_id' => $jobId])
        );

        if (!$result) {
            Log::error("Crawl dispatch failed for Sitemap: {$sitemap->id}");
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['error' => 'Failed to dispatch crawl. Is the crawler service running?'], 500);
            }
            return back()->with('error', 'Failed to dispatch crawl. Is the crawler service running?');
        }

        $actualJobId = $result['job_id'] ?? $jobId;

        $sitemap->update([
            'last_crawl_status' => 'dispatched',
            'last_crawl_job_id' => $actualJobId
        ]);

        Log::info("Crawl dispatched for Sitemap: {$sitemap->id} [Job: {$actualJobId}]", [
            'url' => $startUrl,
            'depth' => $validated['max_depth'] ?? 3
        ]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'message' => 'Crawl job dispatched!',
                'job_id' => $actualJobId
            ]);
        }

        return back()->with('message', 'Crawl job dispatched! Results will appear soon.');
    }

    public function getJobProgress($jobId)
    {
        $progress = Redis::get("crawler:progress:{$jobId}");
        
        if (!$progress) {
            Log::debug("Progress poll for Job: {$jobId} - Key not found yet.");
            return response()->json([
                'status' => 'pending',
                'current_url' => 'Initializing...',
                'total_discovered' => 0,
                'total_crawled' => 0,
                'logs' => ['Waiting for worker to heartbeat...']
            ]);
        }

        $data = json_decode($progress, true);
        
        $data['status'] = $data['status'] ?? 'crawling';
        $data['current_url'] = $data['current_url'] ?? '';
        $data['total_discovered'] = $data['total_discovered'] ?? 0;
        $data['total_crawled'] = $data['total_crawled'] ?? 0;
        $data['logs'] = $data['logs'] ?? [];

        Log::debug("Progress poll for Job: {$jobId} - Current Status: " . $data['status']);
        
        return response()->json($data);
    }

    public function getTree(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        $links = $sitemap->links()->get();
        
        $tree = [];
        foreach ($links as $link) {
            $path = parse_url($link->url, PHP_URL_PATH) ?: '/';
            $tree[] = [
                'id' => $link->id,
                'url' => $link->url,
                'path' => $path,
                'title' => $link->title,
                'status' => $link->status,
                'level' => $link->structure_level,
                'parent_url' => $link->parent_url,
                'depth_from_root' => $link->depth_from_root,
                'seo_bottlenecks' => $link->seo_bottlenecks,
                'url_slug_quality' => $link->url_slug_quality,
            ];
        }

        return response()->json($tree);
    }

    public function aiAnalyze(SitemapLink $link)
    {
        $this->authorizeLinkForOrganization($link);

        try {
            // 1. Fetch content if we don't have it (could be expensive, ideally cached)
            $client = new \GuzzleHttp\Client(['timeout' => 30, 'verify' => false]);
            $response = $client->get($link->url);
            $content = (string) $response->getBody();

            // 2. Extract professional data using AI
            $aiService = app(\App\Services\OpenAIService::class);
            $aiService->setModelFromOrganization($link->sitemap->organization);
            
            $aiData = $aiService->extractProfessionalSchemaData($link->url, $content);

            if ($aiData) {
                $link->update(['ai_schema_data' => $aiData]);
                return back()->with('message', 'AI Analysis complete! Rich data extracted.');
            }

            return back()->with('error', 'AI could not extract structured data for this content.');
        } catch (\Exception $e) {
            Log::error('AI Link analysis failed: ' . $e->getMessage());
            return back()->with('error', 'Analysis failed: ' . $e->getMessage());
        }
    }

    public function generateJsonLd(SitemapLink $link)
    {
        $this->authorizeLinkForOrganization($link);

        $typeName = 'WebPage';
        $aiData = $link->ai_schema_data;

        if ($aiData && !empty($aiData['type'])) {
            $typeName = $aiData['type'];
        } elseif (!empty($link->schema_suggestions)) {
            $typeName = $link->schema_suggestions[0];
        }

        // Handle specific type mapping mismatches (e.g., FAQPage -> faq)
        $lookupName = $typeName;
        if (strtolower($lookupName) === 'faqpage') $lookupName = 'FAQ Page';
        if (strtolower($lookupName) === 'how-to' || strtolower($lookupName) === 'howto') $lookupName = 'How-To Guide';

        $type = SchemaType::where('name', 'like', $lookupName)->first() 
                ?? SchemaType::where('type_key', strtolower($typeName))->first()
                ?? SchemaType::where('name', 'WebPage')->first();

        if (!$type) {
            return back()->with('error', 'Schema Type not found in database.');
        }

        $url = $link->url;
        $schemaId = strtolower(rtrim(trim($url), '/'));

        $schemaName = ($aiData['data']['name'] ?? $aiData['data']['headline'] ?? null);
        if (!$schemaName) {
            $schemaName = 'Auto-Generated: ' . ($link->title ?? $link->url);
        }

        $schema = Schema::create([
            'user_id' => auth()->id(),
            'organization_id' => $link->sitemap->organization_id,
            'schema_type_id' => $type->id,
            'name' => $schemaName,
            'schema_id' => $schemaId,
            'url' => $url,
            'is_active' => true,
        ]);

        // Process fields: Use AI data if available, otherwise fallback to basic
        if ($aiData && !empty($aiData['data'])) {
            $this->createFieldsFromAiData($schema->id, null, $aiData['data']);
        } else {
            $fields = [
                ['path' => 'name', 'type' => 'text', 'value' => $link->title ?? ''],
                ['path' => 'description', 'type' => 'text', 'value' => $link->description ?? ''],
                ['path' => 'url', 'type' => 'url', 'value' => $link->url],
            ];

            if ($link->h1) {
                $fields[] = ['path' => 'headline', 'type' => 'text', 'value' => $link->h1];
            }

            foreach ($fields as $index => $fieldData) {
                SchemaField::create([
                    'schema_id' => $schema->id,
                    'field_path' => $fieldData['path'],
                    'field_type' => $fieldData['type'],
                    'field_value' => $fieldData['value'],
                    'sort_order' => $index,
                ]);
            }
        }

        return back()->with('message', 'Professional JSON-LD Schema generated successfully!');
    }

    public function recrawlLink(SitemapLink $link)
    {
        $this->authorizeLinkForOrganization($link);

        $sitemap = $link->sitemap;
        $jobId = (string) \Illuminate\Support\Str::uuid();
        
        $crawlerManager = app(\App\Services\Crawler\CrawlerManager::class);
        $result = $crawlerManager->dispatch(
            $sitemap->id,
            $link->url,
            0, // Max depth 0 = only this page
            ['job_id' => $jobId, 'render_js' => true]
        );

        if ($result) {
            $link->update(['status' => 'crawling']);
            return back()->with('message', 'Recrawl dispatched for this link!');
        }

        return back()->with('error', 'Failed to dispatch recrawl.');
    }

    public function recrawlAll(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        // Reset all links to pending to show they are being refreshed
        $sitemap->links()->update(['status' => 'pending']);

        // Restart main crawl
        return $this->crawl(request(), $sitemap);
    }

    public function cancelCrawl(Sitemap $sitemap)
    {
        $this->authorizeForOrganization($sitemap);

        if ($sitemap->last_crawl_job_id) {
            $crawlerManager = app(\App\Services\Crawler\CrawlerManager::class);
            $crawlerManager->stop($sitemap->last_crawl_job_id);
        }

        $sitemap->update([
            'last_crawl_status' => 'cancelled'
        ]);

        return response()->json([
            'message' => 'Crawl cancellation signal sent successfully.',
            'status' => 'cancelled'
        ]);
    }

    private function createFieldsFromAiData($schemaId, $parentId, array $data)
    {
        $index = 0;
        foreach ($data as $key => $value) {
            $type = 'text';
            $val = null;
            $children = [];

            if (is_array($value)) {
                if (array_keys($value) === range(0, count($value) - 1)) {
                    $type = 'array';
                    $children = $value;
                } else {
                    $type = 'object';
                    $children = $value;
                }
            } elseif (is_numeric($value)) {
                $type = 'number';
                $val = $value;
            } elseif (is_bool($value)) {
                $type = 'boolean';
                $val = $value ? 'true' : 'false';
            } else {
                $type = 'text';
                $val = $value;
            }

            $field = SchemaField::create([
                'schema_id' => $schemaId,
                'parent_field_id' => $parentId,
                'field_path' => $key,
                'field_type' => $type,
                'field_value' => $val,
                'sort_order' => $index++
            ]);

            if (!empty($children)) {
                $this->createFieldsFromAiData($schemaId, $field->id, $children);
            }
        }
    }
}
