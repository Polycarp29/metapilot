<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Services\BlogTopicSuggestionService;
use Illuminate\Http\Request;

class BlogTopicController extends Controller
{
    protected $suggestionService;

    public function __construct(BlogTopicSuggestionService $suggestionService)
    {
        $this->suggestionService = $suggestionService;
    }

    /**
     * Get trending topic suggestions.
     */
    public function index(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        
        if (!$org) {
            return response()->json(['error' => 'Organization context required.'], 422);
        }

        $suggestions = $this->suggestionService->getSuggestions($org);

        return response()->json($suggestions);
    }
}
