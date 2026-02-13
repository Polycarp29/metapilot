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
        // Default fallback
        $this->model = 'gpt-4o'; 
    }

    public static function getAvailableModels()
    {
        return [
            ['id' => 'gpt-4o', 'name' => 'GPT-4o (Best Architecture)'],
            ['id' => 'gpt-4-turbo', 'name' => 'GPT-4 Turbo'],
            ['id' => 'gpt-4', 'name' => 'GPT-4 (Standard)'],
            ['id' => 'gpt-3.5-turbo', 'name' => 'GPT-3.5 Turbo (Fastest)'],
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
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }

            Log::error('OpenAI API Error: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error('OpenAI Exception: ' . $e->getMessage());
            return null;
        }
    }
}
