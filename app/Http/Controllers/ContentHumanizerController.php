<?php

namespace App\Http\Controllers;

use App\Services\ContentHumanizerService;
use App\Services\AiContentDetectionService;
use App\Services\AI\Agent\PiqueCreditService;
use Illuminate\Http\Request;

class ContentHumanizerController extends Controller
{
    protected $humanizer;
    protected $detector;
    protected $credits;

    public function __construct(
        ContentHumanizerService $humanizer, 
        AiContentDetectionService $detector,
        PiqueCreditService $credits
    ) {
        $this->humanizer = $humanizer;
        $this->detector = $detector;
        $this->credits = $credits;
    }

    /**
     * Humanize AI text.
     */
    public function humanize(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        $cost = 3.0;

        $request->validate([
            'content' => 'required|string|min:100',
            'tone' => 'required|in:professional,conversational,academic,creative'
        ]);

        if (!$this->credits->hasEnoughCredits($org, $cost)) {
            return response()->json(['error' => 'Insufficient credits', 'balance_needed' => $cost], 402);
        }

        $result = $this->humanizer->humanize($request->content, $request->tone);
        
        $this->credits->deductCredits($org, auth()->user(), $cost, 'pique-gpt', 'Content Humanization');

        return response()->json($result);
    }

    /**
     * Standalone AI detection check.
     */
    public function detectAi(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        $cost = 1.0;

        $request->validate([
            'content' => 'required|string|min:50'
        ]);

        if (!$this->credits->hasEnoughCredits($org, $cost)) {
            return response()->json(['error' => 'Insufficient credits', 'balance_needed' => $cost], 402);
        }

        $result = $this->detector->analyze($request->content);
        
        $this->credits->deductCredits($org, auth()->user(), $cost, 'pique-gpt', 'AI Detection Analysis');

        return response()->json($result);
    }
}
