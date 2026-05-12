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
    'archive_threshold_days' => (int) env('ARCHIVE_THRESHOLD_DAYS', 90),

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

    // Maximum requests per minute allowed per IP before blocking.
    'bot_rate_limit_rpm' => (int) env('BOT_RATE_LIMIT_RPM', 300),

    // Cumulative score threshold above which a request is blocked.
    'bot_score_threshold' => (int) env('BOT_SCORE_THRESHOLD', 80),

    // User-agent substrings that trigger an immediate hard block (score 100+).
    'bot_attack_tools' => [
        'sqlmap', 'nikto', 'masscan', 'zgrab', 'nuclei',
        'dirbuster', 'nmap', 'havij', 'acunetix', 'nessus',
        'openvas', 'w3af', 'metasploit', 'burpsuite', 'hydra',
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

];
