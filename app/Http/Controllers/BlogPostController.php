<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Organization;
use App\Services\ContentManagementService;
use App\Services\AiContentDetectionService;
use App\Services\ContentSeoAnalysisService;
use App\Services\OpenAIService;
use App\Services\AI\Agent\PiqueCreditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlogPostController extends Controller
{
    protected $contentService;
    protected $aiDetector;
    protected $seoService;
    protected $openAi;
    protected $credits;

    public function __construct(
        ContentManagementService $contentService,
        AiContentDetectionService $aiDetector,
        ContentSeoAnalysisService $seoService,
        OpenAIService $openAi,
        PiqueCreditService $credits
    ) {
        $this->contentService = $contentService;
        $this->aiDetector = $aiDetector;
        $this->seoService = $seoService;
        $this->openAi = $openAi;
        $this->credits = $credits;
    }

    public function index(Request $request)
    {
        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return redirect()->route('organizations.select');
        }

        $posts = BlogPost::where('organization_id', $organization->id)
            ->with(['category', 'author:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Content/Index', [
            'posts' => $posts,
            'organization' => $organization,
            'categories' => \App\Models\BlogCategory::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        
        if (!$org) {
            return response()->json(['error' => 'Organization context required.'], 422);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'focus_keyword' => 'nullable|string|max:100',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'secondary_keywords' => 'nullable|array',
            'long_tail_keywords' => 'nullable|array',
            'status' => 'required|in:draft,review,published,archived',
        ]);

        $post = $this->contentService->createPost($data, $org, auth()->id());
        
        $this->contentService->syncKeywordMappings($post);
        
        return response()->json([
            'success' => true,
            'post' => $post->load('category')
        ]);
    }

    public function update(Request $request, BlogPost $post)
    {
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'nullable|string',
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'focus_keyword' => 'nullable|string|max:100',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'secondary_keywords' => 'nullable|array',
            'long_tail_keywords' => 'nullable|array',
            'status' => 'sometimes|required|in:draft,review,published,archived',
        ]);

        $this->contentService->updatePost($post, $data);
        
        if (isset($data['content']) || isset($data['focus_keyword'])) {
            $this->contentService->syncKeywordMappings($post);
        }

        return response()->json([
            'success' => true,
            'post' => $post->fresh(['category'])
        ]);
    }

    public function analyze(BlogPost $post)
    {
        $org = auth()->user()->currentOrganization();
        $cost = 2.0;

        if (!$this->credits->hasEnoughCredits($org, $cost)) {
            return response()->json(['error' => 'Insufficient credits', 'balance_needed' => $cost], 402);
        }

        $seoResult = $this->seoService->analyze($post);
        $aiResult = $this->aiDetector->analyze($post->content);

        $this->credits->deductCredits($org, auth()->user(), $cost, 'pique-gpt', 'Content SEO & AI Analysis: ' . $post->title);

        $metrics = $this->contentService->calculateMetrics($post->content);

        $post->update([
            'seo_score' => $seoResult['score'],
            'ai_content_score' => $aiResult['ai_score'],
            'ai_detected' => $aiResult['ai_detected'],
            'ai_detection_notes' => $aiResult['notes'],
            'word_count' => $metrics['word_count'],
            'reading_time_minutes' => $metrics['reading_time_minutes'],
        ]);

        return response()->json([
            'success' => true,
            'seo' => $seoResult,
            'ai' => $aiResult,
            'post' => $post->fresh()
        ]);
    }

    public function generateOutline(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        $cost = 1.0;

        $request->validate([
            'topic' => 'required|string|max:255',
            'keywords' => 'nullable|array'
        ]);

        if (!$this->credits->hasEnoughCredits($org, $cost)) {
            return response()->json(['error' => 'Insufficient credits', 'balance_needed' => $cost], 402);
        }

        $outline = $this->openAi->generateBlogOutline($request->topic, $request->keywords ?? []);
        
        $this->credits->deductCredits($org, auth()->user(), $cost, 'pique-gpt', 'Generated Outline: ' . $request->topic);

        return response()->json($outline);
    }

    public function generateIntro(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        $cost = 1.0;

        $request->validate([
            'title' => 'required|string|max:255',
            'focus_keyword' => 'required|string|max:100'
        ]);

        if (!$this->credits->hasEnoughCredits($org, $cost)) {
            return response()->json(['error' => 'Insufficient credits', 'balance_needed' => $cost], 402);
        }

        $intro = $this->openAi->generateIntroduction($request->title, $request->focus_keyword);
        
        $this->credits->deductCredits($org, auth()->user(), $cost, 'pique-gpt', 'Generated Intro: ' . $request->title);

        return response()->json(['intro' => $intro]);
    }

    public function refineContent(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        $cost = 1.0;

        $request->validate([
            'content' => 'required|string',
            'instruction' => 'required|string|max:500'
        ]);

        if (!$this->credits->hasEnoughCredits($org, $cost)) {
            return response()->json(['error' => 'Insufficient credits', 'balance_needed' => $cost], 402);
        }

        $refined = $this->openAi->refineContent($request->content, $request->instruction);
        
        $this->credits->deductCredits($org, auth()->user(), $cost, 'pique-gpt', 'Refined Content Segment');

        return response()->json(['refined' => $refined]);
    }

    public function destroy(BlogPost $post)
    {
        $post->delete();
        return response()->json(['success' => true]);
    }
}
