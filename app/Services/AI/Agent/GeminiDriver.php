<?php

namespace App\Services\AI\Agent;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiDriver implements ModelDriverInterface
{
    protected string $apiKey;
    protected string $model = 'gemini-1.5-flash-latest';

    public function __construct()
    {
        $this->apiKey = config('services.google_ai.key', '');
    }

    public function generateResponse(string $prompt, array $context = [], array $history = [], string $systemPrompt = '', ?array $actionResult = null): string
    {
        if (empty($this->apiKey)) {
            return $this->simulateResponse($prompt, $context);
        }

        // Build Gemini contents array from history
        $contents = [];
        foreach ($history as $turn) {
            if (!in_array($turn['role'] ?? '', ['user', 'assistant'])) continue;
            $contents[] = [
                'role'  => $turn['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $turn['content']]],
            ];
        }
        // Add current prompt + action result
        $fullPrompt = $prompt;
        if ($actionResult) {
            $fullPrompt .= "\n\n[ACTION RESULT]: " . json_encode($actionResult) . "\n(Incorporate this into your structured response)";
        }

        $contents[] = [
            'role'  => 'user',
            'parts' => [['text' => $fullPrompt]],
        ];

        $body = ['contents' => $contents];

        // System instruction (Gemini 1.5 supports systemInstruction)
        if ($systemPrompt) {
            $body['systemInstruction'] = [
                'parts' => [['text' => $systemPrompt]],
            ];
        }

        $body['generationConfig'] = [
            'temperature'     => 0.5,
            'maxOutputTokens' => 1500,
        ];

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

            $response = Http::retry(2, 300)
                ->timeout(60)
                ->post($url, $body);

            if ($response->successful()) {
                $text = $response->json('candidates.0.content.parts.0.text', '');
                return trim($text) ?: 'Gemini returned an empty response.';
            }

            Log::error('Pique GeminiDriver API error', ['status' => $response->status(), 'body' => $response->body()]);
            return 'I encountered an error reaching Gemini. Please try again shortly.';
        } catch (\Exception $e) {
            Log::error('Pique GeminiDriver exception: ' . $e->getMessage());
            return 'I encountered a connection error. Please try again.';
        }
    }

    public function getModelName(): string
    {
        return 'pique-gemini';
    }

    public function getCreditCost(): float
    {
        return 1.0;
    }

    protected function simulateResponse(string $prompt, array $context): string
    {
        $propCount = count($context['properties'] ?? []);
        $niche     = $context['niche_intelligence']['detected_niche'] ?? 'your niche';

        return "[Simulation — Gemini API key not configured]\n\nI am Pique Gemini. "
            . "I have analysed your {$propCount} analytics propert" . ($propCount === 1 ? 'y' : 'ies') . " in the **{$niche}** space. "
            . "Set `GOOGLE_AI_KEY` in your .env to enable live responses.";
    }
}
