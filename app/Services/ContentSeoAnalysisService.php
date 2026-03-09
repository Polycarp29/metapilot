<?php

namespace App\Services;

use App\Models\BlogPost;
use Illuminate\Support\Str;

class ContentSeoAnalysisService
{
    /**
     * Analyze a blog post or raw content for SEO.
     */
    public function analyze($postOrData): array
    {
        $data = $postOrData instanceof BlogPost ? $postOrData->toArray() : $postOrData;
        $content = $data['content'] ?? '';
        $title = $data['title'] ?? '';
        $metaDesc = $data['meta_description'] ?? '';
        $focusKeyword = $data['focus_keyword'] ?? '';
        
        $results = [
            'score' => 0,
            'checks' => [],
        ];

        if (empty($focusKeyword)) {
            return [
                'score' => 0,
                'checks' => [['id' => 'no_keyword', 'status' => 'error', 'message' => 'No focus keyword defined.']],
            ];
        }

        // 1. Title Checks
        $titleScore = 0;
        if (Str::contains(strtolower($title), strtolower($focusKeyword))) {
            $titleScore += 15;
            $results['checks'][] = ['id' => 'title_keyword', 'status' => 'success', 'message' => 'Keyword found in title.'];
        } else {
            $results['checks'][] = ['id' => 'title_keyword', 'status' => 'error', 'message' => 'Keyword not found in title.'];
        }

        $titleLen = strlen($title);
        if ($titleLen >= 50 && $titleLen <= 65) {
            $titleScore += 10;
            $results['checks'][] = ['id' => 'title_length', 'status' => 'success', 'message' => 'Title length is ideal.'];
        } else {
            $results['checks'][] = ['id' => 'title_length', 'status' => 'warning', 'message' => 'Title length should be 50-65 chars.'];
        }

        // 2. Meta Description Checks
        $metaScore = 0;
        if (Str::contains(strtolower($metaDesc), strtolower($focusKeyword))) {
            $metaScore += 10;
            $results['checks'][] = ['id' => 'meta_keyword', 'status' => 'success', 'message' => 'Keyword found in meta description.'];
        } else {
            $results['checks'][] = ['id' => 'meta_keyword', 'status' => 'warning', 'message' => 'Keyword missing from meta description.'];
        }

        $metaLen = strlen($metaDesc);
        if ($metaLen >= 120 && $metaLen <= 160) {
            $metaScore += 10;
            $results['checks'][] = ['id' => 'meta_length', 'status' => 'success', 'message' => 'Meta description length is ideal.'];
        } else {
            $results['checks'][] = ['id' => 'meta_length', 'status' => 'warning', 'message' => 'Meta description should be 120-160 chars.'];
        }

        // 3. Content Checks
        $contentScore = 0;
        $cleanContent = strip_tags($content);
        $wordCount = str_word_count($cleanContent);
        
        if ($wordCount >= 900) {
            $contentScore += 15;
            $results['checks'][] = ['id' => 'word_count', 'status' => 'success', 'message' => "Great depth! Word count: $wordCount."];
        } elseif ($wordCount >= 600) {
            $contentScore += 10;
            $results['checks'][] = ['id' => 'word_count', 'status' => 'warning', 'message' => "Content is a bit short ($wordCount words)."];
        } else {
            $results['checks'][] = ['id' => 'word_count', 'status' => 'error', 'message' => "Content is too short ($wordCount words)."];
        }

        // Keyword Density
        if ($wordCount > 0) {
            $occurrences = substr_count(strtolower($cleanContent), strtolower($focusKeyword));
            $density = ($occurrences * str_word_count($focusKeyword)) / $wordCount * 100;
            
            if ($density >= 1 && $density <= 3) {
                $contentScore += 15;
                $results['checks'][] = ['id' => 'density', 'status' => 'success', 'message' => 'Keyword density is perfect (' . round($density, 1) . '%).'];
            } elseif ($density > 3) {
                $contentScore += 5;
                $results['checks'][] = ['id' => 'density', 'status' => 'warning', 'message' => 'Keyword density is too high (' . round($density, 1) . '%). Possible stuffing.'];
            } else {
                $results['checks'][] = ['id' => 'density', 'status' => 'warning', 'message' => 'Keyword density is low (' . round($density, 1) . '%).'];
            }
        }

        // First paragraph
        $paragraphs = explode("\n", $cleanContent);
        $firstPara = $paragraphs[0] ?? '';
        if (Str::contains(strtolower($firstPara), strtolower($focusKeyword))) {
            $contentScore += 10;
            $results['checks'][] = ['id' => 'first_para', 'status' => 'success', 'message' => 'Keyword found in first paragraph.'];
        } else {
            $results['checks'][] = ['id' => 'first_para', 'status' => 'warning', 'message' => 'Keyword missing from introduction.'];
        }

        // Images and Links (simplified)
        if (Str::contains($content, '<img')) {
            $contentScore += 5;
            $results['checks'][] = ['id' => 'has_images', 'status' => 'success', 'message' => 'Content contains images.'];
        } else {
            $results['checks'][] = ['id' => 'has_images', 'status' => 'warning', 'message' => 'Consider adding images.'];
        }

        if (Str::contains($content, '<a href')) {
            $contentScore += 10;
            $results['checks'][] = ['id' => 'has_links', 'status' => 'success', 'message' => 'Content contains links.'];
        } else {
            $results['checks'][] = ['id' => 'has_links', 'status' => 'warning', 'message' => 'No links detected.'];
        }

        $results['score'] = $titleScore + $metaScore + $contentScore;
        $results['scores_breakdown'] = [
            'title' => $titleScore,
            'meta' => $metaScore,
            'content' => $contentScore,
        ];

        return $results;
    }
}
