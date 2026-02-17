<?php

namespace App\Http\Controllers;

use App\Models\SavedKeyword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KeywordWalletController extends Controller
{
    /**
     * Get saved keywords for the current organization.
     */
    public function index(Request $request)
    {
        $organization = auth()->user()->currentOrganization();
        
        $keywords = SavedKeyword::where('organization_id', $organization->id)
            ->latest()
            ->paginate(20);

        return response()->json($keywords);
    }

    /**
     * Save a keyword to the wallet.
     */
    public function store(Request $request)
    {
        $request->validate([
            'keyword' => 'required|string|max:255',
            'source' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $organization = auth()->user()->currentOrganization();

        try {
            $saved = SavedKeyword::updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'keyword' => $request->keyword,
                ],
                [
                    'source' => $request->source,
                    'metadata' => $request->metadata,
                ]
            );

            return response()->json([
                'message' => 'Keyword saved to wallet',
                'keyword' => $saved
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to save keyword to wallet", [
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Failed to save keyword'], 500);
        }
    }

    /**
     * Remove a keyword from the wallet.
     */
    public function destroy(SavedKeyword $savedKeyword)
    {
        $organization = auth()->user()->currentOrganization();

        if ($savedKeyword->organization_id !== $organization->id) {
            abort(403);
        }

        $savedKeyword->delete();

        return response()->json(['message' => 'Keyword removed from wallet']);
    }
}
