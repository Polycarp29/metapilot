<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KeywordIntelligence;
use App\Models\KeywordTrendHistory;
use App\Models\UserKeywordBookmark;
use App\Services\KeywordIntelligenceService;
use App\Services\PythonEngineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class KeywordIntelligenceController extends Controller
{
    protected KeywordIntelligenceService $kiService;
    protected PythonEngineService $pythonEngine;

    public function __construct(KeywordIntelligenceService $kiService, PythonEngineService $pythonEngine)
    {
        $this->kiService = $kiService;
        $this->pythonEngine = $pythonEngine;
    }

    /**
     * List and search keywords.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['niche', 'status', 'min_score', 'search', 'region', 'sort_by', 'sort_order']);
        
        $query = $this->kiService->buildSearchQuery($filters);
        
        $keywords = $query->paginate(24);

        // Append bookmark status for current user if applicable
        if (Auth::check()) {
            $userBookmarks = UserKeywordBookmark::where('user_id', Auth::id())
                ->pluck('keyword_intelligence_id')
                ->toArray();
                
            $keywords->getCollection()->transform(function ($ki) use ($userBookmarks) {
                $ki->is_bookmarked = in_array($ki->id, $userBookmarks);
                return $ki;
            });
        }

        return response()->json($keywords);
    }

    /**
     * Get trend history for a keyword.
     */
    public function history(KeywordIntelligence $ki)
    {
        $history = $ki->trendHistory()
            ->orderBy('date', 'asc')
            ->get();
            
        return response()->json($history);
    }

    /**
     * Bookmark a keyword.
     */
    public function bookmark(Request $request, KeywordIntelligence $ki)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'custom_label' => 'nullable|string|max:255',
            'use_case' => 'required|in:blog,campaign,seo,research,other',
            'notes' => 'nullable|string',
        ]);

        $bookmark = UserKeywordBookmark::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'keyword_intelligence_id' => $ki->id,
                'organization_id' => $validated['organization_id'],
            ],
            [
                'custom_label' => $validated['custom_label'],
                'use_case' => $validated['use_case'],
                'notes' => $validated['notes'],
            ]
        );

        return response()->json([
            'status' => 'success',
            'bookmark' => $bookmark
        ]);
    }

    /**
     * Remove a bookmark.
     */
    public function destroyBookmark(KeywordIntelligence $ki, Request $request)
    {
        UserKeywordBookmark::where('user_id', Auth::id())
            ->where('keyword_intelligence_id', $ki->id)
            ->delete();

        return response()->json(['status' => 'success']);
    }

    /**
     * List user bookmarks.
     */
    public function bookmarks(Request $request)
    {
        $bookmarks = UserKeywordBookmark::with('intelligence.trendHistory')
            ->where('user_id', Auth::id())
            ->where('organization_id', $request->header('X-Organization-Id'))
            ->get();
            
        return response()->json($bookmarks);
    }

    /**
     * Trigger ML decay prediction.
     */
    public function predictDecay(KeywordIntelligence $ki)
    {
        $history = $ki->trendHistory()
            ->orderBy('date', 'asc')
            ->limit(90)
            ->get(['date', 'interest_value'])
            ->toArray();

        // Call Python Engine
        $prediction = $this->pythonEngine->predictKeywordDecay($ki->id, $history);

        if ($prediction && isset($prediction['prediction'])) {
            $data = $prediction['prediction'];
            
            // Update the Intelligence model with ML findings
            $ki->update([
                'decay_status' => $data['decay_status'],
                'trend_velocity' => $data['velocity'],
                'relevance_score' => $data['resurgence_probability'] * 100, // normalized to 0-100
            ]);

            return response()->json([
                'status' => 'success',
                'keyword' => $ki->keyword,
                'ml_result' => $data
            ]);
        }

        return response()->json(['error' => 'ML engine failed to return prediction'], 500);
    }
}
