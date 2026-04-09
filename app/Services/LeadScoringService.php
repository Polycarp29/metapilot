<?php

namespace App\Services;

use App\Models\AdTrackEvent;

class LeadScoringService
{
    /**
     * Score a visitor session based on behavioral signals.
     * Returns an array with score (0-100) and label (cold, warm, hot).
     */
    public function scoreSession(string $sessionId): array
    {
        $events = AdTrackEvent::where('session_id', $sessionId)->get();
        if ($events->isEmpty()) {
            return ['score' => 0, 'label' => 'cold', 'signals' => []];
        }

        $totalDuration = $events->sum('duration_seconds');
        $maxScroll     = $events->max('max_scroll_depth');
        $totalClicks   = $events->sum('click_count');
        $pageCount     = $events->count();
        
        $signals = [];
        $score = 0;

        // 1. Duration (0-30 points)
        // 10s = 5pt, 30s = 15pt, 60s+ = 30pt
        $durationPoints = min(30, ($totalDuration / 60) * 30);
        $score += $durationPoints;
        if ($totalDuration >= 30) $signals[] = 'Engaged Duration';

        // 2. Scroll Depth (0-30 points)
        // 25% = 5pt, 50% = 15pt, 100% = 30pt
        $scrollPoints = ($maxScroll / 100) * 30;
        $score += $scrollPoints;
        if ($maxScroll >= 50) $signals[] = 'Deep Content Consumer';

        // 3. Interaction (0-20 points)
        // Each click is 2pts, cap at 20
        $clickPoints = min(20, $totalClicks * 2);
        $score += $clickPoints;
        if ($totalClicks >= 3) $signals[] = 'High Interaction';

        // 4. Recency & Depth (0-20 points)
        // Each unique page is 5pts, cap at 20
        $depthPoints = min(20, $pageCount * 5);
        $score += $depthPoints;
        if ($pageCount >= 2) $signals[] = 'Multi-page Journey';

        $score = round($score);
        $label = 'cold';
        if ($score >= 70) {
            $label = 'hot';
        } elseif ($score >= 30) {
            $label = 'warm';
        }

        return [
            'score' => $score,
            'label' => $label,
            'signals' => $signals,
            'metrics' => [
                'total_duration' => $totalDuration,
                'max_scroll' => $maxScroll,
                'total_clicks' => $totalClicks,
                'page_count' => $pageCount,
            ]
        ];
    }
}
