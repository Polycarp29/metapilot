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
                'checks' => [[
                    'id' => 'no_keyword', 
                    'status' => 'error', 
                    'message' => 'No focus keyword defined.',
                    'action' => 'Set a focus keyword to see detailed SEO analysis.'
                ]],
            ];
        }

        $kw = strtolower($focusKeyword);
        $cleanContent = strip_tags($content);
        $wordCount = str_word_count($cleanContent);

        // 1. Title Checks (Max 20)
        $titleScore = 0;
        if (Str::contains(strtolower($title), $kw)) {
            $titleScore += 12;
            $results['checks'][] = [
                'id' => 'title_keyword', 
                'category' => 'Title',
                'status' => 'success', 
                'message' => 'Keyword found in title.',
                'action' => 'Good job! Your title is well-optimized.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'title_keyword', 
                'category' => 'Title',
                'status' => 'error', 
                'message' => 'Keyword not found in title.',
                'action' => "Try adding '$focusKeyword' to your title."
            ];
        }

        $titleLen = strlen($title);
        if ($titleLen >= 50 && $titleLen <= 65) {
            $titleScore += 8;
            $results['checks'][] = [
                'id' => 'title_length', 
                'category' => 'Title',
                'status' => 'success', 
                'message' => 'Title length is ideal.',
                'action' => 'Perfect length for SERP display.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'title_length', 
                'category' => 'Title',
                'status' => 'warning', 
                'message' => 'Title length is outside ideal range (50-65).',
                'action' => 'Keep title between 50-65 characters to avoid truncation.'
            ];
        }

        // 2. Meta Description Checks (Max 20)
        $metaScore = 0;
        if (Str::contains(strtolower($metaDesc), $kw)) {
            $metaScore += 12;
            $results['checks'][] = [
                'id' => 'meta_keyword', 
                'category' => 'Meta',
                'status' => 'success', 
                'message' => 'Keyword found in meta description.',
                'action' => 'Well optimized for CTR.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'meta_keyword', 
                'category' => 'Meta',
                'status' => 'warning', 
                'message' => 'Keyword missing from meta description.',
                'action' => "Add '$focusKeyword' to increase relevance."
            ];
        }

        $metaLen = strlen($metaDesc);
        if ($metaLen >= 120 && $metaLen <= 160) {
            $metaScore += 8;
            $results['checks'][] = [
                'id' => 'meta_length', 
                'category' => 'Meta',
                'status' => 'success', 
                'message' => 'Meta description length is ideal.',
                'action' => 'Optimal length for search engines.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'meta_length', 
                'category' => 'Meta',
                'status' => 'warning', 
                'message' => 'Meta description length is suboptimal.',
                'action' => 'Aim for 120-160 characters for best visibility.'
            ];
        }

        // 3. Content & Structure (Max 60)
        $contentScore = 0;
        
        // Word Count
        if ($wordCount >= 900) {
            $contentScore += 15;
            $results['checks'][] = [
                'id' => 'word_count', 
                'category' => 'Content',
                'status' => 'success', 
                'message' => "Excellent depth ($wordCount words).",
                'action' => 'High word count is great for ranking for long-tail keywords.'
            ];
        } elseif ($wordCount >= 600) {
            $contentScore += 10;
            $results['checks'][] = [
                'id' => 'word_count', 
                'category' => 'Content',
                'status' => 'warning', 
                'message' => "Content length is decent ($wordCount words).",
                'action' => 'Try expanding to 900+ words for better authority.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'word_count', 
                'category' => 'Content',
                'status' => 'error', 
                'message' => "Content is too short ($wordCount words).",
                'action' => 'Add more detail to provide more value and rank better.'
            ];
        }

        // Keyword Density
        if ($wordCount > 0) {
            $occurrences = substr_count(strtolower($cleanContent), $kw);
            $densityData = ($occurrences * str_word_count($kw)) / $wordCount * 100;
            
            if ($densityData >= 1 && $densityData <= 3) {
                $contentScore += 10;
                $results['checks'][] = [
                    'id' => 'density', 
                    'category' => 'Content',
                    'status' => 'success', 
                    'message' => 'Perfect keyword density (' . round($densityData, 1) . '%).',
                    'action' => 'Maintains natural flow while signaling relevance.'
                ];
            } elseif ($densityData > 3) {
                $contentScore += 2;
                $results['checks'][] = [
                    'id' => 'density', 
                    'category' => 'Content',
                    'status' => 'warning', 
                    'message' => 'Keyword density is too high (' . round($densityData, 1) . '%).',
                    'action' => 'Reduce keyword count to avoid "Keyword Stuffing" penalties.'
                ];
            } else {
                $results['checks'][] = [
                    'id' => 'density', 
                    'category' => 'Content',
                    'status' => 'warning', 
                    'message' => 'Keyword density is low (' . round($densityData, 1) . '%).',
                    'action' => "Naturally mention '$focusKeyword' a few more times."
                ];
            }
        }

        // Header Check
        preg_match_all('/<h([1-6])>(.*?)<\/h\1>/i', $content, $headers);
        $hasH2 = in_array('2', $headers[1] ?? []);
        $kwInHeader = false;
        foreach ($headers[2] ?? [] as $headerText) {
            if (Str::contains(strtolower(strip_tags($headerText)), $kw)) {
                $kwInHeader = true;
                break;
            }
        }

        if ($kwInHeader) {
            $contentScore += 10;
            $results['checks'][] = [
                'id' => 'header_keyword', 
                'category' => 'Structure',
                'status' => 'success', 
                'message' => 'Keyword found in subheaders.',
                'action' => 'Signals hierarchy to search engines.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'header_keyword', 
                'category' => 'Structure',
                'status' => 'warning', 
                'message' => 'Keyword missing from subheaders.',
                'action' => "Add '$focusKeyword' to an H2 or H3 tag."
            ];
        }

        if ($hasH2) {
            $contentScore += 5;
            $results['checks'][] = [
                'id' => 'has_h2', 
                'category' => 'Structure',
                'status' => 'success', 
                'message' => 'Structure is good (H2 found).',
                'action' => 'Headers improve readability and SEO.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'has_h2', 
                'category' => 'Structure',
                'status' => 'error', 
                'message' => 'No H2 headers found.',
                'action' => 'Use H2 headers to break up your content.'
            ];
        }

        // Image Alt Texts
        preg_match_all('/<img[^>]+>/i', $content, $images);
        if (count($images[0] ?? []) > 0) {
            $allHaveAlt = true;
            foreach ($images[0] ?? [] as $img) {
                if (!preg_match('/alt=["\'][^"\']+["\']/i', $img)) {
                    $allHaveAlt = false;
                    break;
                }
            }

            if ($allHaveAlt) {
                $contentScore += 10;
                $results['checks'][] = [
                    'id' => 'image_alt', 
                    'category' => 'Media',
                    'status' => 'success', 
                    'message' => 'All images have alt text.',
                    'action' => 'Great for accessibility and image search.'
                ];
            } else {
                $contentScore += 5;
                $results['checks'][] = [
                    'id' => 'image_alt', 
                    'category' => 'Media',
                    'status' => 'warning', 
                    'message' => 'Some images missing alt text.',
                    'action' => 'Add descriptive ALT attributes to all images.'
                ];
            }
        } else {
            $results['checks'][] = [
                'id' => 'no_images', 
                'category' => 'Media',
                'status' => 'warning', 
                'message' => 'No images found.',
                'action' => 'Add relevant images to engage readers.'
            ];
        }

        // Links
        $hasInternal = Str::contains($content, 'href="/') || Str::contains($content, 'href="' . config('app.url'));
        $hasExternal = preg_match('/href=["\']https?:\/\/(?!(?:www\.)?' . preg_quote(parse_url(config('app.url'), PHP_URL_HOST) ?? '', '/') . ')/i', $content);

        if ($hasInternal && $hasExternal) {
            $contentScore += 10;
            $results['checks'][] = [
                'id' => 'links', 
                'category' => 'Links',
                'status' => 'success', 
                'message' => 'Excellent link diversity.',
                'action' => 'Balanced internal and external signals.'
            ];
        } elseif ($hasInternal || $hasExternal) {
            $contentScore += 5;
            $results['checks'][] = [
                'id' => 'links', 
                'category' => 'Links',
                'status' => 'warning', 
                'message' => 'Missing link type.',
                'action' => $hasInternal ? 'Add an external source.' : 'Link to your other content.'
            ];
        } else {
            $results['checks'][] = [
                'id' => 'links', 
                'category' => 'Links',
                'status' => 'error', 
                'message' => 'No links found.',
                'action' => 'Add at least one internal and one external link.'
            ];
        }

        // Readability (Max 10)
        $sentences = preg_split('/[.!?]+/', $cleanContent, -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCount = count($sentences);
        if ($sentenceCount > 0) {
            $avgSentenceLength = $wordCount / $sentenceCount;
            if ($avgSentenceLength <= 20) {
                $contentScore += 10;
                $results['checks'][] = [
                    'id' => 'readability', 
                    'category' => 'Readability',
                    'status' => 'success', 
                    'message' => 'Text is easy to read.',
                    'action' => 'Sentences are concise and clear.'
                ];
            } elseif ($avgSentenceLength <= 25) {
                $contentScore += 5;
                $results['checks'][] = [
                    'id' => 'readability', 
                    'category' => 'Readability',
                    'status' => 'warning', 
                    'message' => 'Readability could be improved.',
                    'action' => 'Try shortening some of your longer sentences.'
                ];
            } else {
                $results['checks'][] = [
                    'id' => 'readability', 
                    'category' => 'Readability',
                    'status' => 'error', 
                    'message' => 'Text is difficult to read.',
                    'action' => 'Break down long sentences to improve flow.'
                ];
            }
        }

        $results['score'] = min(max($titleScore + $metaScore + $contentScore, 0), 100);
        $results['scores_breakdown'] = [
            'title' => $titleScore,
            'meta' => $metaScore,
            'content' => $contentScore,
        ];

        return $results;
    }
}
