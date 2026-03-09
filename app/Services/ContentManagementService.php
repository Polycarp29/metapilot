<?php

namespace App\Services;

use App\Models\BlogPost;
use App\Models\Organization;
use App\Models\ContentKeywordMapping;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ContentManagementService
{
    /**
     * Create a new blog post.
     */
    public function createPost(array $data, Organization $org, int $userId): BlogPost
    {
        $data['organization_id'] = $org->id;
        $data['user_id'] = $userId;
        
        if (!isset($data['slug']) || empty($data['slug'])) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], $org->id);
        }

        return BlogPost::create($data);
    }

    /**
     * Update an existing blog post.
     */
    public function updatePost(BlogPost $post, array $data): bool
    {
        if (isset($data['title']) && $data['title'] !== $post->title && (!isset($data['slug']) || empty($data['slug']))) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], $post->organization_id, $post->id);
        }

        return $post->update($data);
    }

    /**
     * Generate a unique slug for an organization.
     */
    protected function generateUniqueSlug(string $title, int $orgId, ?int $ignoreId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $count = 1;

        while (true) {
            $query = BlogPost::where('organization_id', $orgId)->where('slug', $slug);
            if ($ignoreId) {
                $query->where('id', '!=', $ignoreId);
            }

            if (!$query->exists()) {
                break;
            }

            $slug = $originalSlug . '-' . $count++;
        }

        return $slug;
    }

    /**
     * Sync keyword density mappings for a post.
     */
    public function syncKeywordMappings(BlogPost $post): void
    {
        $content = strip_tags($post->content);
        if (empty($content)) {
            ContentKeywordMapping::where('blog_post_id', $post->id)->delete();
            return;
        }

        $wordCount = str_word_count(strtolower($content));
        if ($wordCount === 0) return;

        $keywords = [];
        
        // Primary
        if ($post->focus_keyword) {
            $keywords[] = ['text' => $post->focus_keyword, 'type' => 'primary'];
        }

        // Secondary
        if (is_array($post->secondary_keywords)) {
            foreach ($post->secondary_keywords as $kw) {
                $keywords[] = ['text' => $kw, 'type' => 'secondary'];
            }
        }

        // Long-tail
        if (is_array($post->long_tail_keywords)) {
            foreach ($post->long_tail_keywords as $kw) {
                $keywords[] = ['text' => $kw, 'type' => 'long_tail'];
            }
        }

        DB::transaction(function () use ($post, $content, $wordCount, $keywords) {
            ContentKeywordMapping::where('blog_post_id', $post->id)->delete();

            foreach ($keywords as $kw) {
                $occurrences = substr_count(strtolower($content), strtolower($kw['text']));
                $density = ($occurrences * str_word_count(strtolower($kw['text']))) / $wordCount * 100;

                ContentKeywordMapping::create([
                    'blog_post_id' => $post->id,
                    'keyword' => $kw['text'],
                    'keyword_type' => $kw['type'],
                    'occurrences' => $occurrences,
                    'density' => round($density, 2),
                ]);
            }
        });
    }

    /**
     * Calculate word count and estimated reading time.
     */
    public function calculateMetrics(string $content): array
    {
        $cleanContent = strip_tags($content);
        $wordCount = str_word_count($cleanContent);
        
        // Average reading speed: 200 words per minute
        $readingTime = ceil($wordCount / 200);

        return [
            'word_count' => $wordCount,
            'reading_time_minutes' => $readingTime,
        ];
    }
}
