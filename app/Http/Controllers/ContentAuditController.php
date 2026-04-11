<?php

namespace App\Http\Controllers;

use App\Services\OpenAIService;
use App\Services\AI\Agent\PiqueCreditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ContentAuditController extends Controller
{
    protected $openAi;
    protected $credits;

    public function __construct(OpenAIService $openAi, PiqueCreditService $credits)
    {
        $this->openAi = $openAi;
        $this->credits = $credits;
    }

    /**
     * Run an SEO audit on a URL or pasted content.
     */
    public function audit(Request $request)
    {
        $org = auth()->user()->currentOrganization();
        $cost = 2.0;

        $request->validate([
            'content' => 'nullable|string',
            'url' => 'nullable|url',
            'target_keywords' => 'required|array|min:1'
        ]);

        if (!$this->credits->hasEnoughCredits($org, $cost)) {
            return response()->json(['error' => 'Insufficient credits', 'balance_needed' => $cost], 402);
        }

        $content = $request->content;

        if ($request->url && empty($content)) {
            try {
                if (extension_loaded('curl')) {
                    $response = Http::get($request->url);
                    if ($response->successful()) {
                        $content = $response->body();
                    } else {
                        return response()->json(['error' => 'Failed to fetch content from URL (HTTP Error).'], 422);
                    }
                } else {
                    // Fallback to file_get_contents if curl is missing
                    $opts = [
                        "http" => [
                            "method" => "GET",
                            "header" => "User-Agent: MetapilotBot/1.0\r\n",
                            "timeout" => 15,
                            "ignore_errors" => true
                        ],
                        "ssl" => [
                            "verify_peer" => false,
                            "verify_peer_name" => false,
                        ],
                    ];
                    $context = stream_context_create($opts);
                    $content = @file_get_contents($request->url, false, $context);
                    
                    if ($content === false) {
                        return response()->json(['error' => 'URL fetch failed (CURL missing and fallback failed).'], 422);
                    }
                }
            } catch (\Exception $e) {
                return response()->json(['error' => 'URL connection failed: ' . $e->getMessage()], 422);
            }
        }

        if (empty($content)) {
            return response()->json(['error' => 'No content provided for audit.'], 422);
        }

        $result = $this->openAi->auditContentForSeo($content, $request->target_keywords);
        
        $this->credits->deductCredits($org, auth()->user(), $cost, 'pique-gpt', 'Deep SEO Audit: ' . ($request->url ?? 'Pasted Content'));

        return response()->json($result);
    }
}
