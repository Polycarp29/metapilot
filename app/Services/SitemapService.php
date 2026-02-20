<?php

namespace App\Services;

use App\Models\SitemapLink;
use Illuminate\Support\Facades\Log;

class SitemapService
{
    /**
     * Sanitize a URL according to sitemap best practices.
     * Removes query parameters and fragments.
     */
    public function sanitizeUrl(string $url): ?string
    {
        $url = trim($url);
        if (empty($url)) {
            return null;
        }

        // Basic protocol check/fix
        if (!preg_match('/^https?:\/\//i', $url) && preg_match('/^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+/i', $url)) {
            $url = 'https://' . $url;
        }

        $parts = parse_url($url);

        if (!$parts || !isset($parts['host'])) {
            return null;
        }

        $sanitized = ($parts['scheme'] ?? 'https') . '://' . $parts['host'];

        if (isset($parts['port'])) {
            $sanitized .= ':' . $parts['port'];
        }

        if (isset($parts['path'])) {
            $path = preg_replace('#/+#', '/', $parts['path']);
            $sanitized .= $path;
        } else {
            $sanitized .= '/';
        }

        return $sanitized;
    }

    /**
     * Validate if a URL is suitable for a sitemap.
     */
    public function isValidUrl(string $url): bool
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = parse_url($url, PHP_URL_SCHEME);
        if (!in_array(strtolower($scheme), ['http', 'https'])) {
            return false;
        }

        if (strlen($url) > 2048) {
            return false;
        }

        return true;
    }

    /**
     * Check if a URL is a duplicate within the same sitemap.
     */
    public function isDuplicate(int $sitemapId, string $url, ?int $excludeLinkId = null): bool
    {
        $query = SitemapLink::where('sitemap_id', $sitemapId)
            ->where('url', $url);

        if ($excludeLinkId) {
            $query->where('id', '!=', $excludeLinkId);
        }

        return $query->exists();
    }

    /**
     * Analyze URL structure for SEO bottlenecks.
     *
     * @return array List of bottleneck findings
     */
    public function analyzeUrlStructure(string $url): array
    {
        $bottlenecks = [];
        $path = parse_url($url, PHP_URL_PATH) ?: '/';
        $segments = array_filter(explode('/', $path));

        // 1. Deep nesting (> 4 levels penalizes SEO)
        if (count($segments) > 4) {
            $bottlenecks[] = [
                'type' => 'deep_nesting',
                'severity' => 'warning',
                'message' => 'URL depth exceeds 4 levels — harder for search engine crawlers to discover',
            ];
        }

        // 2. Long slugs (> 75 chars in last segment)
        $lastSegment = !empty($segments) ? end($segments) : '';
        if ($lastSegment && strlen($lastSegment) > 75) {
            $bottlenecks[] = [
                'type' => 'long_slug',
                'severity' => 'warning',
                'message' => 'URL slug exceeds 75 characters — may be truncated in SERPs',
            ];
        }

        // 3. Numeric/ID-only slugs
        if ($lastSegment && preg_match('/^\d+$/', $lastSegment)) {
            $bottlenecks[] = [
                'type' => 'numeric_slug',
                'severity' => 'info',
                'message' => 'URL uses numeric ID instead of a descriptive keyword-rich slug',
            ];
        }

        // 4. Underscores instead of hyphens (Google treats hyphens as word separators)
        if (str_contains($path, '_')) {
            $bottlenecks[] = [
                'type' => 'underscores',
                'severity' => 'info',
                'message' => 'URL uses underscores — Google treats hyphens as word separators, not underscores',
            ];
        }

        // 5. Uppercase characters in URL
        if ($path !== strtolower($path)) {
            $bottlenecks[] = [
                'type' => 'uppercase_chars',
                'severity' => 'info',
                'message' => 'URL contains uppercase characters — URLs are case-sensitive and may cause duplicate content',
            ];
        }

        // 6. Double extensions or suspicious patterns
        if (preg_match('/\.[a-z]+\.[a-z]+$/i', $path)) {
            $bottlenecks[] = [
                'type' => 'double_extension',
                'severity' => 'warning',
                'message' => 'URL contains double file extension — may indicate misconfigured routing',
            ];
        }

        // 7. Session-like parameters in path
        if (preg_match('/[a-f0-9]{32,}/i', $path)) {
            $bottlenecks[] = [
                'type' => 'hash_in_url',
                'severity' => 'warning',
                'message' => 'URL appears to contain a session hash or token — not indexable',
            ];
        }

        // 8. Overall URL length
        if (strlen($url) > 200) {
            $bottlenecks[] = [
                'type' => 'long_url',
                'severity' => 'info',
                'message' => 'Total URL exceeds 200 characters — keep URLs concise for better UX and sharing',
            ];
        }

        return $bottlenecks;
    }

    /**
     * Assess overall slug quality from bottleneck analysis.
     *
     * @return string 'good', 'warning', or 'poor'
     */
    public function assessSlugQuality(string $url): string
    {
        $bottlenecks = $this->analyzeUrlStructure($url);
        $warnings = count(array_filter($bottlenecks, fn($b) => $b['severity'] === 'warning'));
        
        if ($warnings >= 2) return 'poor';
        if ($warnings >= 1) return 'warning';
        return 'good';
    }
}
