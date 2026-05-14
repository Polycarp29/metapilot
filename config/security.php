<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Database Backup Settings
    |--------------------------------------------------------------------------
    */

    'backup_retention_days' => (int) env('BACKUP_RETENTION_DAYS', 30),

    'backup_path' => env('DB_BACKUP_PATH', storage_path('backups')),

    /*
    |--------------------------------------------------------------------------
    | Archive Engine Settings
    |--------------------------------------------------------------------------
    */

    // How old (in days) a row must be before it is eligible for archiving.
    'archive_threshold_days' => (int) env('ARCHIVE_THRESHOLD_DAYS', 50),

    // Number of rows processed per INSERT/DELETE cycle (prevents OOM on large tables).
    'archive_chunk_size' => (int) env('ARCHIVE_CHUNK_SIZE', 500),

    // Tables to stream into the archive database.
    // Each table must have a `created_at` column.
    'archive_tables' => [
        'ad_track_events',
        'metric_snapshots',
        'user_activities',
        'cdn_errors',
        'search_console_metrics',
    ],

    /*
    |--------------------------------------------------------------------------
    | Bot Firewall Settings
    |--------------------------------------------------------------------------
    */

    // Maximum requests per minute allowed per IP before the firewall scores +60.
    // Tightened from 300 → 60: a real browser page fires the tracker once on load,
    // so even 60/min is extremely generous for a single IP.
    'bot_rate_limit_rpm' => (int) env('BOT_RATE_LIMIT_RPM', 60),

    // Per-token rate limit (RPM) to catch bot storms hitting a specific site.
    // Legitimate high-traffic sites may require 300+ RPM.
    'cdn_token_rate_limit_rpm' => (int) env('CDN_TOKEN_RATE_LIMIT_RPM', 300),

    // Cumulative score threshold above which a request is blocked.
    'bot_score_threshold' => (int) env('BOT_SCORE_THRESHOLD', 80),

    // Maximum hits allowed per pixel site per day.
    // Set high enough for legitimate SaaS customers (e.g. 1 Million).
    'cdn_max_daily_hits_per_site' => (int) env('CDN_MAX_DAILY_HITS', 1000000),

    // When true, requests with _sig=nosig are rejected with 403.
    // nosig was a debug fallback; it must never be accepted in production.
    'cdn_reject_nosig' => (bool) env('CDN_REJECT_NOSIG', true),

    // User-agent substrings that trigger an immediate hard block (score 100+).
    'bot_attack_tools' => [
        // Classic security scanners
        'sqlmap', 'nikto', 'masscan', 'zgrab', 'nuclei',
        'dirbuster', 'nmap', 'havij', 'acunetix', 'nessus',
        'openvas', 'w3af', 'metasploit', 'burpsuite', 'hydra',
        // Headless/scripted HTTP clients — no legitimate browser sends these
        'python-requests', 'python-urllib',
        'go-http-client',
        'curl/', 'libcurl',
        'wget/',
        'axios/', 'node-fetch', 'got/',
        'java/', 'okhttp/',
        'scrapy', 'mechanize', 'httpclient',
        'phantomjs', 'headlesschrome', 'headless chrome',
    ],

    // User-agent substrings that are always allowlisted (never blocked).
    'bot_allowlist' => [
        'googlebot', 'bingbot', 'duckduckbot', 'slurp',
        'twitterbot', 'facebookexternalhit', 'linkedinbot',
        'applebot', 'yandexbot',
    ],

    // URL path patterns that add to the fingerprint score (+80 each match).
    'bot_probe_paths' => [
        '/.env', '/wp-admin', '/wp-login', '/phpMyAdmin',
        '/phpmyadmin', '/etc/passwd', '/etc/shadow',
        '/config.php', '/xmlrpc.php', '/admin/config',
        '/.git/config', '/web.config', '/server-status',
    ],

    // Referrer host keyword patterns (Deprecated - Behavioral defense preferred)
    'cdn_referrer_blocklist' => [],

];
