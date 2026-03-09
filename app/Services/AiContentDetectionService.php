<?php

namespace App\Services;

class AiContentDetectionService
{
    protected OpenAIService $openAi;

    public function __construct(OpenAIService $openAi)
    {
        $this->openAi = $openAi;
    }

    /**
     * Analyze content for AI probability.
     */
    public function analyze(string $content): array
    {
        if (strlen($content) < 100) {
            return [
                'ai_score' => 0,
                'ai_detected' => false,
                'notes' => 'Content too short for reliable analysis.',
                'flags' => []
            ];
        }

        // Layer 1: Statistical Analysis
        $stats = $this->runStatisticalAnalysis($content);
        
        // Layer 2: AI Classification (only if statistically ambiguous or high confidence requested)
        // If burstiness is very low and sentence variance is low, it's a high signal.
        $aiResult = null;
        if ($stats['burstiness'] < 15 || $stats['sentence_variance'] < 5) {
            $aiResult = $this->openAi->analyzeContentForAi($content);
        }

        $score = $aiResult['ai_probability'] ?? ($stats['burstiness'] < 10 ? 80 : 30);
        
        return [
            'ai_score' => $score,
            'ai_detected' => $score > 70,
            'notes' => $aiResult['reasoning'] ?? 'Statistical analysis suggests low variation in sentence structure.',
            'flags' => $this->generateFlags($stats, $aiResult)
        ];
    }

    /**
     * Run high-level statistical profile on content.
     */
    protected function runStatisticalAnalysis(string $content): array
    {
        $sentences = preg_split('/[.!?]+/', strip_tags($content), -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCounts = array_map(fn($s) => str_word_count($s), $sentences);
        
        if (empty($sentenceCounts)) return ['burstiness' => 0, 'sentence_variance' => 0];

        $avg = array_sum($sentenceCounts) / count($sentenceCounts);
        
        // Burstiness (variance in sentence length)
        $variance = 0;
        foreach ($sentenceCounts as $count) {
            $variance += pow($count - $avg, 2);
        }
        $stdDev = sqrt($variance / count($sentenceCounts));

        return [
            'avg_length' => $avg,
            'sentence_variance' => $stdDev,
            'burstiness' => ($stdDev / $avg) * 100, // Higher is more human
            'sentence_count' => count($sentences)
        ];
    }

    protected function generateFlags(array $stats, ?array $aiResult): array
    {
        $flags = [];
        if ($stats['burstiness'] < 20) $flags[] = 'Low burstiness (robotic flow)';
        if ($stats['sentence_variance'] < 8) $flags[] = 'Highly repetitive sentence lengths';
        if (isset($aiResult['flags'])) $flags = array_merge($flags, $aiResult['flags']);

        return array_unique($flags);
    }
}
