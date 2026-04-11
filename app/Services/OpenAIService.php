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
        $this->model = config('services.openai.model'); 
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

    /**
     * Set the AI model based on the organization's settings.
     */
    public function setModelFromOrganization(\App\Models\Organization $organization)
    {
        $model = $organization->settings['ai_model'] ?? config('services.openai.model');
        $this->model = $model;
        return $this;
    }

    /**
     * Check if a model is currently set.
     */
    public function hasModel(): bool
    {
        return !empty($this->model);
    }

    public function generateSchemaSuggestions(string $url, string $content)
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a Senior SEO Technical Analyst. Your goal is to analyze website content and identify the most appropriate Schema.org types to implement. 
                    Return a JSON object with this structure:
                    {"summary": "...", "recommended_types": ["Article", ...], "rationale": "...", "detected_entities": {"brands": [...], "products": [...], "events": [...]}}
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

        return $response ? $this->parseAiResponse($response) : null;
    }

    public function analyzeAnalyticsData(string $propertyName, array $currentPeriod, array $previousPeriod)
    {
        if (!$this->hasModel()) return null;

        Log::info("Starting AI analytics analysis for property: {$propertyName}");

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a Senior SEO Data Analyst. Analyze GA4 performance data and provide insights.
                    Return JSON: {"summary": "...", "key_findings": [...], "recommendations": [...], "keyword_strategy": [...], "report_enhancements": [...], "severity": "low|medium|high"}
                    Strictly return JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => "Analyze performance for '{$propertyName}'.\nCurrent: " . json_encode($currentPeriod) . "\nPrevious: " . json_encode($previousPeriod)
                ]
            ],
            'temperature' => 0.4,
            'response_format' => ['type' => 'json_object']
        ]);

        return $response ? $this->parseAiResponse($response) : null;
    }
    public function analyzeAdPerformance(string $propertyName, array $dataContext)
    {
        if (!$this->hasModel()) return null;

        Log::info("Starting AI Ad Performance analysis for property: {$propertyName}");

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a Digital Marketing Expert specializing in Google Ads Optimization. Analyze campaign data.
                    Return JSON: {"summary": "...", "strategic_opportunities": [...], "budget_recommendations": "...", "keyword_insights": "...", "industry_benchmark_comparison": "...", "severity": "info|warning|critical"}
                    Strictly return JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => "Analyze Google Ads campaigns for '{$propertyName}':\n\n" . json_encode($dataContext['campaigns'])
                ]
            ],
            'temperature' => 0.4,
            'response_format' => ['type' => 'json_object']
        ]);

        return $response ? $this->parseAiResponse($response) : null;
    }

    public function generateCampaignProposal(string $propertyName, array $dataContext)
    {
        if (!$this->hasModel()) return null;

        Log::info("Starting AI Campaign Proposal for property: {$propertyName}");

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a Senior SEO Strategist. Propose a high-impact SEO Campaign.
                    Return JSON: {"campaign_name": "...", "objective": "...", "target_urls": [...], "keywords": [...], "strategic_rationale": "...", "priority": "low|medium|high"}
                    Strictly return JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => "Analyze performance for '{$propertyName}' and suggest a campaign. Stats: " . json_encode($dataContext['stats'])
                ]
            ],
            'temperature' => 0.5,
            'response_format' => ['type' => 'json_object']
        ]);

        return $response ? $this->parseAiResponse($response) : null;
    }
    public function extractProfessionalSchemaData(string $url, string $content)
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a Senior Technical SEO Specialist. Extract professional Schema.org JSON-LD data.
                    Return JSON: {"type": "...", "data": {...}}
                    Strictly return JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => "Extract for ({$url}):\n\n" . mb_substr($content, 0, 15000)
                ]
            ],
            'temperature' => 0.2,
            'response_format' => ['type' => 'json_object']
        ], 'https://api.openai.com/v1/chat/completions', 60);

        return $response ? $this->parseAiResponse($response) : null;
    }

    public function generateBlogOutline(string $topic, array $keywords): ?array
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a Senior SEO Content Strategist. Create a high-impact blog outline.
                    Return JSON: {"title": "...", "meta_description": "...", "outline": [{"heading": "...", "subsections": ["..."]}], "target_audience": "...", "estimated_reading_time": "..."}
                    Strictly return JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => "Create an outline for: '$topic'. Keywords: " . implode(', ', $keywords)
                ]
            ],
            'temperature' => 0.7,
            'response_format' => ['type' => 'json_object']
        ]);

        return $response ? $this->parseAiResponse($response) : null;
    }

    public function analyzeContentForAi(string $content): ?array
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an AI Content Detector. Analyze text for robotic patterns.
                    Return JSON: {"ai_probability": 0-100, "reasoning": "...", "flags": [...], "human_score": 0-100}
                    Strictly return JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => "Analyze text: \n\n" . mb_substr($content, 0, 10000)
                ]
            ],
            'temperature' => 0.2,
            'response_format' => ['type' => 'json_object']
        ]);

        return $response ? $this->parseAiResponse($response) : null;
    }

    public function humanizeContent(string $text, string $style = 'professional'): ?array
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => "You are a Content Humanizer. Rewrite AI text to sound human. Style: $style.
                    Return JSON: {\"text\": \"...\", \"changes\": [...]}
                    Strictly return JSON only."
                ],
                [
                    'role' => 'user',
                    'content' => "Humanize this: \n\n" . mb_substr($text, 0, 10000)
                ]
            ],
            'temperature' => 0.8,
            'response_format' => ['type' => 'json_object']
        ], 'https://api.openai.com/v1/chat/completions', 60);

        return $response ? $this->parseAiResponse($response) : null;
    }

    public function auditContentForSeo(string $content, array $targetKeywords): ?array
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a Technical SEO Auditor. Analyze content against keywords.
                    Return JSON: {"seo_score": 0-100, "summary": "...", "keyword_gaps": [...], "optimization_tips": [...], "readability_analysis": "...", "fix_priorities": [...]}
                    Strictly return JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => "Analyze against: " . implode(', ', $targetKeywords) . "\n\nContent:\n" . mb_substr($content, 0, 12000)
                ]
            ],
            'temperature' => 0.3,
            'response_format' => ['type' => 'json_object']
        ], 'https://api.openai.com/v1/chat/completions', 45);

        return $response ? $this->parseAiResponse($response) : null;
    }

    public function generateIntroduction(string $title, string $focusKeyword): ?string
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a professional copywriter. Write a compelling introduction (100-150 words). Return only plain text.'
                ],
                [
                    'role' => 'user',
                    'content' => "Title: '$title'. Focus Keyword: '$focusKeyword'"
                ]
            ],
            'temperature' => 0.7,
        ]);

        return $response ? $this->parseAiResponse($response, false) : null;
    }

    public function refineContent(string $text, string $instruction): ?string
    {
        if (!$this->hasModel()) return null;

        $response = $this->callApi([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an expert editor. Refine text based on instruction. Return only refined text.'
                ],
                [
                    'role' => 'user',
                    'content' => "Text: \"$text\" \nInstruction: $instruction"
                ]
            ],
            'temperature' => 0.6,
        ], 'https://api.openai.com/v1/chat/completions', 45);

        return $response ? $this->parseAiResponse($response, false) : null;
    }

    /**
     * Centralized method to handle OpenAI API calls with CURL fallback.
     */
    protected function callApi(array $payload, string $endpoint = 'https://api.openai.com/v1/chat/completions', int $timeout = 30)
    {
        if (empty($this->apiKey)) {
            Log::error("OpenAI API Key is missing.");
            return null;
        }

        if (extension_loaded('curl')) {
            try {
                return Http::withToken($this->apiKey)
                    ->retry(3, 200)
                    ->timeout($timeout)
                    ->post($endpoint, $payload);
            } catch (\Exception $e) {
                Log::error("OpenAI CURL Request Failed: " . $e->getMessage());
                return null;
            }
        }

        // Fallback to file_get_contents if curl is missing
        Log::warning("CURL extension not loaded. Using fallback for OpenAI API: {$endpoint}");
        
        $opts = [
            "http" => [
                "method" => "POST",
                "header" => "Authorization: Bearer {$this->apiKey}\r\n" .
                            "Content-Type: application/json\r\n",
                "content" => json_encode($payload),
                "timeout" => $timeout,
                "ignore_errors" => true
            ],
            "ssl" => [
                "verify_peer" => false,
                "verify_peer_name" => false,
            ],
        ];

        try {
            $context = stream_context_create($opts);
            $result = @file_get_contents($endpoint, false, $context);
            
            if ($result === false) {
                Log::error("OpenAI Fallback Request Failed.");
                return null;
            }

            // Create a fake response object that behaves like Laravel's Http response for parseAiResponse
            return new class($result) {
                protected $body;
                protected $json;
                public function __construct($body) { 
                    $this->body = $body; 
                    $this->json = json_decode($body, true);
                }
                public function successful() { 
                    return !isset($this->json['error']) && !empty($this->json['choices']);
                }
                public function json($key = null) { 
                    return $key ? data_get($this->json, $key) : $this->json;
                }
                public function body() { return $this->body; }
            };
        } catch (\Exception $e) {
            Log::error("OpenAI Fallback Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Safely parse the OpenAI response and return the message content or decoded JSON.
     */
    protected function parseAiResponse($response, bool $asJson = true)
    {
        if (!$response) {
            Log::error("OpenAI Response is null.");
            return null;
        }

        if (method_exists($response, 'successful') && !$response->successful()) {
            Log::error("OpenAI Request failed with body: " . $response->body());
            return null;
        }

        $json = method_exists($response, 'json') ? $response->json() : json_decode($response, true);
        
        $content = data_get($json, 'choices.0.message.content');
        
        if ($content === null) {
            Log::error("OpenAI Response Content is Null. Full Body: " . $response->body());
            return null;
        }

        if (!$asJson) {
            return trim($content);
        }

        return json_decode($content, true);
    }
}
