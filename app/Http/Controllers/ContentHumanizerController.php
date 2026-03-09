<?php

namespace App\Http\Controllers;

use App\Services\ContentHumanizerService;
use App\Services\AiContentDetectionService;
use Illuminate\Http\Request;

class ContentHumanizerController extends Controller
{
    protected $humanizer;
    protected $detector;

    public function __construct(ContentHumanizerService $humanizer, AiContentDetectionService $detector)
    {
        $this->humanizer = $humanizer;
        $this->detector = $detector;
    }

    /**
     * Humanize AI text.
     */
    public function humanize(Request $request)
    {
        $request->validate([
            'content' => 'required|string|min:100',
            'tone' => 'required|in:professional,conversational,academic,creative'
        ]);

        $result = $this->humanizer->humanize($request->content, $request->tone);

        return response()->json($result);
    }

    /**
     * Standalone AI detection check.
     */
    public function detectAi(Request $request)
    {
        $request->validate([
            'content' => 'required|string|min:50'
        ]);

        $result = $this->detector->analyze($request->content);

        return response()->json($result);
    }
}
