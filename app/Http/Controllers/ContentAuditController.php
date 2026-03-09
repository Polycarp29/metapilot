<?php

namespace App\Http\Controllers;

use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ContentAuditController extends Controller
{
    protected $openAi;

    public function __construct(OpenAIService $openAi)
    {
        $this->openAi = $openAi;
    }

    /**
     * Run an SEO audit on a URL or pasted content.
     */
    public function audit(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string',
            'url' => 'nullable|url',
            'target_keywords' => 'required|array|min:1'
        ]);

        $content = $request->content;

        if ($request->url && empty($content)) {
            try {
                $response = Http::get($request->url);
                if ($response->successful()) {
                    $content = $response->body();
                } else {
                    return response()->json(['error' => 'Failed to fetch content from URL.'], 422);
                }
            } catch (\Exception $e) {
                return response()->json(['error' => 'URL connection failed.'], 422);
            }
        }

        if (empty($content)) {
            return response()->json(['error' => 'No content provided for audit.'], 422);
        }

        $result = $this->openAi->auditContentForSeo($content, $request->target_keywords);

        return response()->json($result);
    }
}
