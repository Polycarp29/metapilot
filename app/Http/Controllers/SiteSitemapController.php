<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\URL;

class SiteSitemapController extends Controller
{
    /**
     * Generate a simple sitemap for the main site pages.
     */
    public function index(): Response
    {
        $baseUrl = config('app.url', 'http://127.0.0.1:8000');
        $now = date('c');

        $urls = [
            ['loc' => $baseUrl . '/', 'lastmod' => $now, 'priority' => '1.0'],
            ['loc' => $baseUrl . '/login', 'lastmod' => $now, 'priority' => '0.8'],
            ['loc' => $baseUrl . '/register', 'lastmod' => $now, 'priority' => '0.8'],
            ['loc' => $baseUrl . '/privacy', 'lastmod' => $now, 'priority' => '0.5'],
            ['loc' => $baseUrl . '/terms', 'lastmod' => $now, 'priority' => '0.5'],
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;
        
        foreach ($urls as $url) {
            $xml .= '  <url>' . PHP_EOL;
            $xml .= '    <loc>' . htmlspecialchars($url['loc']) . '</loc>' . PHP_EOL;
            $xml .= '    <lastmod>' . $url['lastmod'] . '</lastmod>' . PHP_EOL;
            $xml .= '    <priority>' . $url['priority'] . '</priority>' . PHP_EOL;
            $xml .= '  </url>' . PHP_EOL;
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'text/xml');
    }
}
