<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    protected $apiKey;
    protected $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
        if (empty($this->apiKey)) {
            Log::warning("OpenAIService initialized without an API key. Check config/services.php and .env");
        }
        $this->model = config('services.openai.model', 'gpt-4-turbo'); 
    }

    public static function getAvailableModels()
    {
        return [
            ['id' => 'gpt-4o-2024-05-13', 'name' => 'GPT-4o (2024-05-13)'],
            ['id' => 'gpt-4o', 'name' => 'GPT-4o (Latest)'],
            ['id' => 'gpt-4-turbo', 'name' => 'GPT-4 Turbo'],
            ['id' => 'gpt-3.5-turbo-0125', 'name' => 'GPT-3.5 Turbo (v0125)'],
            ['id' => 'gpt-3.5-turbo', 'name' => 'GPT-3.5 Turbo (Latest)'],
        ];
    }

    public function setModel(string $model)
    {
        $this->model = $model;
        return $this;
    }

    public function generateSchemaSuggestions(string $url, string $content)
    {
        if (empty($this->apiKey)) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a Senior SEO Technical Analyst. Your goal is to analyze website content and identify the most appropriate Schema.org types to implement. 
                        
                        Return a JSON object with this structure:
                        {
                            "summary": "Brief analysis of the page type",
                            "recommended_types": ["Article", "FAQPage", "Product", etc],
                            "rationale": "Why these types fit",
                            "detected_entities": {
                                "brands": ["BrandName"],
                                "products": ["Product Name"],
                                "events": ["Event Name"]
                            }
                        }
                        
                        Strictly return JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Analyze this page ({$url}):\n\n" . mb_substr($content, 0, 8000)
                    ]
                ],
                'temperature' => 0.3,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                Log::info("OpenAI Schema Suggestion successful for URL: {$url}");
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }

            Log::error("OpenAI Schema Suggestion API Error [URL: {$url}]: " . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Schema Suggestion Exception [URL: {$url}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Analyze Google Analytics data and return insights.
     */
    public function analyzeAnalyticsData(string $propertyName, array $currentPeriod, array $previousPeriod)
    {
        if (empty($this->apiKey)) {
            return null;
        }

        Log::info("Starting AI analytics analysis for property: {$propertyName}");

        try {
            $response = Http::withToken($this->apiKey)->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a Senior SEO Data Analyst. Your goal is to analyze Google Analytics 4 performance data and provide actionable insights.
                        
                        Focus on:
                        1. Traffic trends (Users, Sessions)
                        2. Search visibility (Impressions, Avg. Position)
                        3. Click-through performance (Clicks, CTR)
                        4. Keyword performance and opportunities
                        5. Conversion performance
                        
                        Return a JSON object with this structure:
                        {
                            "summary": "High-level summary of performance",
                            "key_findings": ["Finding 1", "Finding 2"],
                            "recommendations": ["Recommendation 1", "Recommendation 2"],
                            "keyword_strategy": ["Strategy for specific high-potential keywords"],
                            "report_enhancements": ["Suggestions for what other data could make this report better"],
                            "severity": "low|medium|high"
                        }
                        
                        Strictly return JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Analyze performance for '{$propertyName}'.
                        
                        Current Period:
                        " . json_encode($currentPeriod) . "
                        
                        Previous Period:
                        " . json_encode($previousPeriod) . "
                        
                        Provide a technical comparison and SEO strategy recommendations."
                    ]
                ],
                'temperature' => 0.4,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                Log::info("OpenAI Analytics Analysis successful for property: {$propertyName}");
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }

            Log::error("OpenAI Analytics Analysis API Error [Property: {$propertyName}]: " . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Analytics Analysis Exception [Property: {$propertyName}]: " . $e->getMessage());
            return null;
        }
    }
}
