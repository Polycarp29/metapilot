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
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->retry(3, 200)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
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
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error("OpenAI Connection Refused/Timeout [URL: {$url}]: " . $e->getMessage());
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
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        Log::info("Starting AI analytics analysis for property: {$propertyName}");

        try {
            $response = Http::withToken($this->apiKey)
                ->retry(3, 200)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
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
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error("OpenAI Connection Refused/Timeout [Property: {$propertyName}]: " . $e->getMessage());
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Analytics Analysis Exception [Property: {$propertyName}]: " . $e->getMessage());
            return null;
        }
    }
    /**
     * Analyze Google Ads specific performance data.
     */
    public function analyzeAdPerformance(string $propertyName, array $dataContext)
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        Log::info("Starting AI Ad Performance analysis for property: {$propertyName}");

        try {
            $response = Http::withToken($this->apiKey)
                ->retry(3, 200)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a Digital Marketing Expert specializing in Google Ads Optimization. 
                        Your goal is to analyze ad campaign performance data against industry trends and provide actionable strategic advice.
                        
                        Context:
                        - Industry: ' . ($dataContext['industry'] ?? 'General') . '
                        - Target Audience: ' . ($dataContext['business_profile']['target_audience'] ?? 'General Audience') . '
                        - Value Proposition: ' . ($dataContext['business_profile']['value_proposition'] ?? 'N/A') . '
                        - Competitors: ' . ($dataContext['business_profile']['competitors'] ?? 'N/A') . '
                        - Current Year: ' . ($dataContext['trends_year'] ?? date('Y')) . '
                        
                        Focus on:
                        1. Cost Efficiency (ROAS, CPA)
                        2. Keyword Relevance and Negative Keyword opportunities
                        3. Budget Allocation recommendations
                        4. Ad Copy / Creative direction based on performance
                        
                        Return a JSON object with this structure:
                        {
                            "summary": "Executive summary of ad performance",
                            "strategic_opportunities": ["Opportunity 1", "Opportunity 2"],
                            "budget_recommendations": "Where to increase/decrease spend",
                            "keyword_insights": "Analysis of top keywords and gaps",
                            "industry_benchmark_comparison": "How this likely compares to industry averages (estimated)",
                            "severity": "info|warning|critical"
                        }
                        
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

            if ($response->successful()) {
                Log::info("OpenAI Ad Analysis successful for property: {$propertyName}");
                $content = $response->json()['choices'][0]['message']['content'];
                return json_decode($content, true);
            }

            Log::error("OpenAI Ad Analysis API Error [Property: {$propertyName}]: " . $response->body());
            return null;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error("OpenAI Connection Refused/Timeout [Property: {$propertyName}]: " . $e->getMessage());
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Ad Analysis Exception [Property: {$propertyName}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate an SEO Campaign proposal based on analytics performance data.
     */
    public function generateCampaignProposal(string $propertyName, array $dataContext)
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        Log::info("Starting AI Campaign Proposal for property: {$propertyName}");

        try {
            $response = Http::withToken($this->apiKey)
                ->retry(3, 200)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a Senior SEO Strategist. Your goal is to analyze Google Analytics 4 performance data and propose a high-impact SEO Campaign.

                        Identify "Low Hanging Fruit" by looking for:
                        1. Pages with high traffic but low conversion.
                        2. High-volume traffic sources with low engagement.
                        3. Sudden drops in performance for traditionally strong pages.
                        
                        Return a JSON object with this structure:
                        {
                            "campaign_name": "A catchy, professional campaign name",
                            "objective": "Clear, data-driven objective for the campaign",
                            "target_urls": ["/path1", "/path2"],
                            "keywords": ["keyword 1", "keyword 2"],
                            "strategic_rationale": "Detailed explanation of why this campaign was chosen based on the provided metrics",
                            "priority": "low|medium|high"
                        }
                        
                        Strictly return JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Analyze performance for '{$propertyName}' and suggest a campaign.

                        Analytics Overview:
                        " . json_encode($dataContext['stats']) . "

                        Top Pages Performance:
                        " . json_encode($dataContext['by_page'] ?? []) . "

                        Traffic Source Breakdown:
                        " . json_encode($dataContext['by_source'] ?? []) . "

                        Provide a specific, actionable campaign proposal."
                    ]
                ],
                'temperature' => 0.5,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                Log::info("OpenAI Campaign Proposal successful for property: {$propertyName}");
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }

            Log::error("OpenAI Campaign Proposal API Error [Property: {$propertyName}]: " . $response->body());
            return null;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error("OpenAI Connection Refused/Timeout [Property: {$propertyName}]: " . $e->getMessage());
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Campaign Proposal Exception [Property: {$propertyName}]: " . $e->getMessage());
            return null;
        }
    }
    /**
     * Extract rich, professional structured data from page content.
     */
    public function extractProfessionalSchemaData(string $url, string $content)
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->retry(3, 200)
                ->timeout(60) // High quality extraction takes longer
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a Senior Technical SEO & Schema.org Specialist. Your goal is to analyze the provided page content and synthesize a professional, highly-detailed JSON-LD representation.
                        
                        Instructions:
                        1. Identify the primary type (Article, Product, FAQPage, HowTo, LocalBusiness, Service, or Event).
                        2. Extract deep fields:
                           - For FAQ: All Q/A pairs.
                           - For Product: Name, description, image URL (if seen), price, currency, brand, SKU.
                           - For HowTo: All steps (name, text, url).
                           - For Article: Headline, description, author, datePublished.
                        3. Ensure the JSON follows Schema.org standards exactly.
                        4. DO NOT include the @context or @id here; return only the internal fields.
                        
                        Return a JSON object with this structure:
                        {
                            "type": "Article",
                            "data": {
                                "headline": "...",
                                "description": "...",
                                ... other fields ...
                            }
                        }
                        
                        Strictly return JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Synthesize professional schema data for this page ({$url}):\n\n" . mb_substr($content, 0, 15000)
                    ]
                ],
                'temperature' => 0.2,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                Log::info("OpenAI Professional Synthesis successful for URL: {$url}");
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }

            Log::error("OpenAI Professional Synthesis API Error [URL: {$url}]: " . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Professional Synthesis Exception [URL: {$url}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate a professional blog outline based on a topic and keywords.
     */
    public function generateBlogOutline(string $topic, array $keywords): ?array
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a Senior SEO Content Strategist. Your goal is to create a high-impact blog outline.
                        
                        Return a JSON object with this structure:
                        {
                            "title": "Suggested SEO Title",
                            "meta_description": "Suggested Meta Description",
                            "outline": [
                                {"heading": "Introduction", "subsections": ["..."]},
                                {"heading": "...", "subsections": ["..."]}
                            ],
                            "target_audience": "...",
                            "estimated_reading_time": "..."
                        }
                        
                        Strictly return JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Create an outline for: '$topic'. \nTarget Keywords: " . implode(', ', $keywords)
                    ]
                ],
                'temperature' => 0.7,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Outline Gen Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Analyze content for AI probability and robotic patterns.
     */
    public function analyzeContentForAi(string $content): ?array
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an AI Content Detector. Analyze the following text for robotic patterns.
                        
                        Return a JSON object with:
                        {
                            "ai_probability": 0-100,
                            "reasoning": "Brief explanation",
                            "flags": ["Flag 1", "Flag 2"],
                            "human_score": 0-100
                        }
                        
                        Strictly return JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Analyze this text: \n\n" . mb_substr($content, 0, 10000)
                    ]
                ],
                'temperature' => 0.2,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI AI Detection Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Humanize AI-generated content.
     */
    public function humanizeContent(string $text, string $style = 'professional'): ?array
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => "You are a Content Humanizer. Your goal is to rewrite AI-generated text to sound like it was written by a human. 
                        Style: $style.
                        
                        Rules:
                        1. Vary sentence length and structure.
                        2. Use active voice and natural contractions.
                        3. Introduce subtle human nuances (e.g. slight conversational shifts).
                        4. Maintain the same core information and SEO keywords.
                        
                        Return a JSON object with:
                        {
                            \"text\": \"The humanized text\",
                            \"changes\": [\"List of major changes made\"]
                        }
                        
                        Strictly return JSON only."
                    ],
                    [
                        'role' => 'user',
                        'content' => "Humanize this: \n\n" . mb_substr($text, 0, 10000)
                    ]
                ],
                'temperature' => 0.8,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Humanizer Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Audit existing content or a URL for SEO gaps.
     */
    public function auditContentForSeo(string $content, array $targetKeywords): ?array
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(45)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a Technical SEO Auditor. Analyze the content against the target keywords.
                        
                        Return a JSON object with:
                        {
                            "seo_score": 0-100,
                            "summary": "Overall health summary",
                            "keyword_gaps": ["Missing keywords", "Low density keywords"],
                            "optimization_tips": ["Tip 1", "Tip 2"],
                            "readability_analysis": "...",
                            "fix_priorities": ["High: ...", "Medium: ..."]
                        }
                        
                        Strictly return JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Analyze this content against: " . implode(', ', $targetKeywords) . "\n\nContent:\n" . mb_substr($content, 0, 12000)
                    ]
                ],
                'temperature' => 0.3,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                return json_decode($response->json()['choices'][0]['message']['content'], true);
            }
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Audit Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate a professional introduction for a blog post.
     */
    public function generateIntroduction(string $title, string $focusKeyword): ?string
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a professional copywriter. Write a compelling introduction for a blog post. 
                        Keep it between 100-150 words. Use a hook to engage the reader.
                        Return only the plain text of the introduction.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Write an introduction for a blog post titled: '$title'. \nFocus Keyword: '$focusKeyword'"
                    ]
                ],
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                return trim($response->json()['choices'][0]['message']['content']);
            }
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Intro Gen Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Refine or rewrite a piece of content based on specific instructions.
     */
    public function refineContent(string $text, string $instruction): ?string
    {
        if (empty($this->apiKey) || !$this->hasModel()) {
            return null;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(45)
                ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert editor. Rewrite or refine the provided text according to the user instruction.
                        Maintain the original meaning but improve flow, tone, or clarity as requested.
                        Return only the refined text.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Text to refine: \n\n\"$text\" \n\nInstruction: $instruction"
                    ]
                ],
                'temperature' => 0.6,
            ]);

            if ($response->successful()) {
                return trim($response->json()['choices'][0]['message']['content']);
            }
            return null;
        } catch (\Exception $e) {
            Log::error("OpenAI Refine Gen Exception: " . $e->getMessage());
            return null;
        }
    }
}
