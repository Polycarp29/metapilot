<?php

namespace App\Services;

class ContentHumanizerService
{
    protected OpenAIService $openAi;
    protected AiContentDetectionService $detector;

    public function __construct(OpenAIService $openAi, AiContentDetectionService $detector)
    {
        $this->openAi = $openAi;
        $this->detector = $detector;
    }

    /**
     * Rewrite content to sound more human and bypass detection.
     */
    public function humanize(string $content, string $tone = 'professional'): array
    {
        $initialState = $this->detector->analyze($content);
        
        $humanizedContent = $this->openAi->humanizeContent($content, $tone);
        
        if (!$humanizedContent) {
            return [
                'success' => false,
                'message' => 'Humanizing failed via OpenAI.'
            ];
        }

        $finalState = $this->detector->analyze($humanizedContent['text']);

        return [
            'success' => true,
            'original_text' => $content,
            'humanized_text' => $humanizedContent['text'],
            'initial_ai_score' => $initialState['ai_score'],
            'final_ai_score' => $finalState['ai_score'],
            'improvement' => $initialState['ai_score'] - $finalState['ai_score'],
            'changes_made' => $humanizedContent['changes'] ?? [],
            'tone' => $tone
        ];
    }
}
