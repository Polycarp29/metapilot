<?php

namespace App\Services\AI\Agent;

use App\Services\OpenAIService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GptDriver implements ModelDriverInterface
{
    protected string $apiKey;
    protected string $model = 'gpt-4o-2024-05-13';

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', '');
    }

    public function generateResponse(string $prompt, array $context = [], array $history = [], string $systemPrompt = '', ?array $actionResult = null): string
    {
        if (empty($this->apiKey)) {
            return $this->simulateResponse($prompt, $context);
        }

        $messages = [];

        // 1. System prompt with live org context
        if ($systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $systemPrompt];
        }

        // 2. Conversation history (prior turns)
        foreach ($history as $turn) {
            if (in_array($turn['role'] ?? '', ['user', 'assistant'])) {
                $messages[] = [
                    'role'    => $turn['role'],
                    'content' => $turn['content'],
                ];
            }
        }

        // 3. Action Result (if any)
        if ($actionResult) {
            $messages[] = [
                'role'    => 'system',
                'content' => "[ACTION RESULT]: " . json_encode($actionResult) . "\n\nUse this data to inform your response. Restructure and format this information for the user.",
            ];
        }

        // 4. Current user prompt
        $messages[] = ['role' => 'user', 'content' => $prompt];

        try {
            $response = Http::withToken($this->apiKey)
                ->retry(2, 300)
                ->timeout(60)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'       => $this->model,
                    'messages'    => $messages,
                    'temperature' => 0.5,
                    'max_tokens'  => 1500,
                ]);

            if ($response->successful()) {
                return trim($response->json('choices.0.message.content', ''));
            }

            Log::error('Pique GptDriver API error', ['status' => $response->status(), 'body' => $response->body()]);
            return 'I encountered an error reaching GPT-4o. Please try again shortly.';
        } catch (\Exception $e) {
            Log::error('Pique GptDriver exception: ' . $e->getMessage());
            return 'I encountered a connection error. Please try again.';
        }
    }

    public function getModelName(): string
    {
        return 'pique-gpt';
    }

    public function getCreditCost(): float
    {
        return 2.0;
    }

    protected function simulateResponse(string $prompt, array $context): string
    {
        $org     = $context['organization']['name'] ?? 'your organisation';
        $niche   = $context['niche_intelligence']['detected_niche'] ?? ($context['organization']['industry'] ?? 'your niche');
        $schemas = count($context['schemas'] ?? []);

        return "[Simulation — GPT-4o key not configured]\n\nI am Pique GPT. "
            . "For **{$org}** in the **{$niche}** space, I can see you have {$schemas} active schemas. "
            . "Set `OPENAI_API_KEY` in your .env to enable live responses.";
    }
}
