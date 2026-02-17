<?php

namespace App\Services;

use App\Models\SitemapLink;
use Illuminate\Support\Facades\Log;

class SitemapService
{
    /**
     * Sanitize a URL according to sitemap best practices.
     * Removes query parameters and fragments.
     *
     * @param string $url
     * @return string|null
     */
    public function sanitizeUrl(string $url): ?string
    {
        $url = trim($url);
        if (empty($url)) {
            return null;
        }

        // Basic protocol check/fix - if it looks like a domain but lacks protocol
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
            // Normalize path: remove double slashes, etc.
            $path = preg_replace('#/+#', '/', $parts['path']);
            $sanitized .= $path;
        } else {
            $sanitized .= '/';
        }

        // We explicitly EXCLUDE 'query' and 'fragment' as per requirement

        return $sanitized;
    }

    /**
     * Validate if a URL is suitable for a sitemap.
     *
     * @param string $url
     * @return bool
     */
    public function isValidUrl(string $url): bool
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Sitemap URLs should be absolute and use http/https
        $scheme = parse_url($url, PHP_URL_SCHEME);
        if (!in_array(strtolower($scheme), ['http', 'https'])) {
            return false;
        }

        // Additional validation: length, invalid characters in host, etc.
        if (strlen($url) > 2048) {
            return false;
        }

        return true;
    }

    /**
     * Check if a URL is a duplicate within the same sitemap.
     *
     * @param int $sitemapId
     * @param string $url
     * @param int|null $excludeLinkId
     * @return bool
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
}
