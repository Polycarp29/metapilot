<?php

namespace App\Traits;

trait KeywordIntelligence
{
    /**
     * Detect intent based on search results.
     */
    protected function detectIntentFromSerp(array $organicResults): string
    {
        if (empty($organicResults)) return 'Unknown';

        $text = '';
        foreach (array_slice($organicResults, 0, 5) as $result) {
            $text .= ($result['title'] ?? '') . ' ' . ($result['snippet'] ?? '') . ' ';
        }
        $text = strtolower($text);

        if (preg_match('/buy|price|shop|discount|coupon|shipping|store|cheap/', $text)) return 'Commercial';
        if (preg_match('/how to|what is|guide|tutorial|steps|learn|meaning|why/', $text)) return 'Informational';
        if (preg_match('/best|review|top|comparison|vs|rating/', $text)) return 'Transactional';
        if (preg_match('/login|sign in|official|portal|dashboard/', $text)) return 'Navigational';

        return 'Informational'; // Default fallback
    }
}
