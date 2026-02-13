<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google Analytics 4 Credentials
    |--------------------------------------------------------------------------
    |
    | The path to the JSON file containing your Google Service Account credentials.
    |
    */
    'credentials_path' => env('GA4_CREDENTIALS_JSON_PATH'),

    /*
    |--------------------------------------------------------------------------
    | Default GA4 Property ID
    |--------------------------------------------------------------------------
    |
    | The default property ID to use if none is specified for a request.
    |
    */
    'default_property_id' => env('GA4_PROPERTY_ID'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI API Key
    |--------------------------------------------------------------------------
    |
    | Used for generating AI-powered insights and reports.
    |
    */
    'openai_api_key' => env('OPENAI_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Retention and Cache
    |--------------------------------------------------------------------------
    |
    | Control how long analytics data is kept and cached.
    |
    */
    'retention_days' => env('ANALYTICS_RETENTION_DAYS', 365),
    'cache_ttl' => env('ANALYTICS_CACHE_TTL', 3600), // 1 hour
];
