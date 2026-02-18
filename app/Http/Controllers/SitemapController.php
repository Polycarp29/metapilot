<?php

namespace App\Http\Controllers;

use App\Models\Sitemap;
use App\Models\SitemapLink;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

use App\Services\SitemapService;
use App\Jobs\CrawlSitemapJob;

class SitemapController extends Controller
{
    protected $sitemapService;

    public function __construct(SitemapService $sitemapService)
    {
        $this->sitemapService = $sitemapService;
    }

    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return redirect()->route('dashboard')->with('error', 'No organization selected.');
        }

        $sitemaps = Sitemap::where('organization_id', $organization->id)
            ->withCount('links')
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

        // Determine ownership
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
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
        $sitemap->links()->delete();
        $sitemap->delete();

        return redirect()->route('sitemaps.index')->with('message', 'Sitemap deleted!');
    }

    public function show(Sitemap $sitemap)
    {
        // Basic duplicate detection for the view
        $duplicates = SitemapLink::whereIn('url', $sitemap->links()->pluck('url'))
            ->where('sitemap_id', '!=', $sitemap->id)
            ->whereHas('sitemap', function ($query) use ($sitemap) {
                $query->where('organization_id', $sitemap->organization_id);
            })
            ->get()
            ->groupBy('url');

        return Inertia::render('Sitemaps/Manager', [
            'sitemap' => $sitemap,
            'links' => $sitemap->links()->orderBy('created_at', 'desc')->paginate(100),
            'duplicateCount' => $duplicates->count()
        ]);
    }

    public function import(Request $request, Sitemap $sitemap)
    {
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
                    // Handle standard sitemap
                    if ($xml->url) {
                        foreach ($xml->url as $urlNode) {
                            if (isset($urlNode->loc)) {
                                $urls[] = (string)$urlNode->loc;
                            }
                        }
                    } 
                    // Handle sitemap index
                    elseif ($xml->sitemap) {
                        foreach ($xml->sitemap as $sitemapNode) {
                            if (isset($sitemapNode->loc)) {
                                $urls[] = (string)$sitemapNode->loc;
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                // Fallback to regex if XML parsing fails
                preg_match_all('/<loc>(.*?)<\/loc>/', $content, $matches);
                $urls = array_merge($urls, $matches[1] ?? []);
            }
        } else {
            // Treat as CSV or TXT - split by common delimiters and newlines
            $lines = preg_split('/\r\n|\r|\n/', $content);
            foreach ($lines as $line) {
                // Try to get first column if CSV
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

            // Skip common header names if they somehow passed sanitization
            if (in_array(strtolower(basename($sanitizedUrl)), ['url', 'loc', 'location'])) {
                continue;
            }

            if (!$this->sitemapService->isDuplicate($sitemap->id, $sanitizedUrl)) {
                SitemapLink::create([
                    'sitemap_id' => $sitemap->id,
                    'url' => $sanitizedUrl,
                    'lastmod' => now()->format('Y-m-d'),
                    'changefreq' => 'daily',
                    'priority' => 0.7
                ]);
                $imported++;
            }
        }

        return back()->with('message', "Successfully imported $imported unique links!");
    }

    public function addLink(Request $request, Sitemap $sitemap)
    {
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

        SitemapLink::create(array_merge($validated, [
            'sitemap_id' => $sitemap->id,
            'url' => $sanitizedUrl
        ]));

        return back()->with('message', 'Link added to sitemap!');
    }

    public function updateLink(Request $request, SitemapLink $link)
    {
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

        $link->update(array_merge($validated, ['url' => $sanitizedUrl]));

        return back()->with('message', 'Link updated!');
    }

    public function destroyLink(SitemapLink $link)
    {
        $link->delete();

        return back()->with('message', 'Link removed!');
    }

    public function generate(Sitemap $sitemap)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;

        if ($sitemap->is_index) {
            $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;
            $otherSitemaps = Sitemap::where('organization_id', $sitemap->organization_id)
                ->where('is_index', false)
                ->get();
            foreach ($otherSitemaps as $other) {
                $xml .= '  <sitemap>' . PHP_EOL;
                $xml .= '    <loc>' . url($other->filename) . '</loc>' . PHP_EOL;
                $xml .= '    <lastmod>' . ($other->last_generated_at ? $other->last_generated_at->format('c') : now()->format('c')) . '</lastmod>' . PHP_EOL;
                $xml .= '  </sitemap>' . PHP_EOL;
            }
            $xml .= '</sitemapindex>';
        } else {
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">' . PHP_EOL;
            
            // Load all links for generation
            $links = $sitemap->links;
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

    public function crawl(Request $request, Sitemap $sitemap)
    {
        $validated = $request->validate([
            'starting_url' => 'nullable|url',
            'max_depth' => 'nullable|integer|min:1|max:10',
            'render_js' => 'boolean'
        ]);

        CrawlSitemapJob::dispatch(
            $sitemap, 
            $validated['starting_url'] ?? null,
            $validated
        );

        return back()->with('message', 'Crawl job dispatched! Results will appear soon.');
    }

    public function getTree(Sitemap $sitemap)
    {
        $links = $sitemap->links()->get();
        
        // Basic hierarchical builder based on path depth
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
                'parent_url' => $link->parent_url
            ];
        }

        return response()->json($tree);
    }
}
