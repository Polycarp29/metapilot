<?php

namespace App\Http\Controllers;

use App\Services\SerperService;
use App\Services\KeywordService;
use Inertia\Inertia;
use Illuminate\Http\Request;

class KeywordController extends Controller
{
    protected KeywordService $keywordService;

    public function __construct(KeywordService $keywordService)
    {
        $this->keywordService = $keywordService;
    }

    /**
     * Display the trending keywords hub.
     */
    public function trending()
    {
        return Inertia::render('Keywords/Trending', [
            'organization' => auth()->user()->currentOrganization()
        ]);
    }

    /**
     * Display the keyword research tool or handle research request.
     */
    public function research(Request $request)
    {
        $query = $request->input('q');
        $gl = $request->input('gl', 'ke');
        $hl = $request->input('hl', 'en');

        $data = null;
        if ($query) {
            $data = $this->keywordService->research(
                auth()->user()->currentOrganization(),
                $query,
                $gl,
                $hl
            );
        }

        return Inertia::render('Keywords/Research', [
            'results' => $data['results'] ?? null,
            'intent' => $data['intent'] ?? null,
            'niche' => $data['niche'] ?? null,
            'growth_rate' => $data['growth_rate'] ?? null,
            'current_interest' => $data['current_interest'] ?? null,
            'cached' => $data['cached'] ?? false,
            'last_searched' => $data['last_searched_at'] ?? null,
            'filters' => [
                'q' => $query,
                'gl' => $gl,
                'hl' => $hl,
            ]
        ]);
    }
}
