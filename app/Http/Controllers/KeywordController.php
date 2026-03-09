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
        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return redirect()->route('organizations.select');
        }

        return Inertia::render('Keywords/Trending', [
            'organization' => $organization
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

        $organization = auth()->user()->currentOrganization();
        if (!$organization) {
            return redirect()->route('organizations.select');
        }

        $data = null;
        if ($query) {
            $data = $this->keywordService->research(
                $organization,
                $query,
                $gl,
                $hl
            );

            auth()->user()->logActivity('keyword_research', "Performed keyword research for: {$query}", [
                'query' => $query,
                'location' => $gl,
                'language' => $hl,
                'cached' => $data['cached'] ?? false
            ], $organization->id);
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

    /**
     * Display the keyword intelligence hub.
     */
    public function intelligence()
    {
        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return redirect()->route('organizations.select');
        }

        return Inertia::render('Keywords/Intelligence', [
            'organization' => $organization,
            'industries' => \App\Models\Industry::orderBy('name')->get(['name', 'slug']),
        ]);
    }
}
