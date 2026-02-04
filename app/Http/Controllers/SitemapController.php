<?php

namespace App\Http\Controllers;

use App\Models\Sitemap;
use App\Models\SitemapLink;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class SitemapController extends Controller
{
    public function index()
    {
        $sitemaps = Sitemap::withCount('links')->orderBy('created_at', 'desc')->get();
        return Inertia::render('Sitemaps/Index', [
            'sitemaps' => $sitemaps
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'filename' => 'required|string|max:255|unique:sitemaps,filename',
            'is_index' => 'boolean'
        ]);

        if (!str_ends_with($validated['filename'], '.xml')) {
            $validated['filename'] .= '.xml';
        }

        $sitemap = Sitemap::create($validated);

        return redirect()->route('sitemaps.show', $sitemap)
            ->with('message', 'Sitemap container created!');
    }

    public function show(Sitemap $sitemap)
    {
        // Basic duplicate detection for the view
        $duplicates = SitemapLink::whereIn('url', $sitemap->links()->pluck('url'))
            ->where('sitemap_id', '!=', $sitemap->id)
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
        $handle = fopen($file->getRealPath(), 'r');
        
        $imported = 0;
        $row = 0;
        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            $url = trim($data[0] ?? '');
            
            // Skip header or invalid URLs
            if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL) || strtolower($url) === 'url') {
                continue;
            }

            SitemapLink::updateOrCreate([
                'sitemap_id' => $sitemap->id,
                'url' => $url
            ], [
                'lastmod' => now()->format('Y-m-d'),
                'changefreq' => 'daily',
                'priority' => 0.7
            ]);
            $imported++;
        }
        fclose($handle);

        return back()->with('message', "Successfully synced $imported links!");
    }

    public function addLink(Request $request, Sitemap $sitemap)
    {
        $validated = $request->validate([
            'url' => 'required|url',
            'priority' => 'numeric|min:0|max:1',
            'changefreq' => 'string'
        ]);

        SitemapLink::create(array_merge($validated, ['sitemap_id' => $sitemap->id]));

        return back()->with('message', 'Link added to sitemap!');
    }

    public function generate(Sitemap $sitemap)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;

        if ($sitemap->is_index) {
            $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;
            $otherSitemaps = Sitemap::where('is_index', false)->get();
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
}
