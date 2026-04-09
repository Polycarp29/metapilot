<?php

namespace App\Http\Controllers\AI\Agent;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class PiqueTheAgentController extends Controller
{
    protected $agent;
    protected $credits;

    public function __construct(
        \App\Services\AI\Agent\PiqueAgentService $agent,
        \App\Services\AI\Agent\PiqueCreditService $credits
    ) {
        $this->agent = $agent;
        $this->credits = $credits;
    }

    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        $balance = $organization ? $this->credits->getCredits($organization)->balance : 0;

        return Inertia::render('Pique/Index', [
            'initialBalance' => (float) $balance,
        ]);
    }

    /**
     * Handle prompt submissions for the Pique agent.
     */
    public function ask(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
            'model' => 'required|string|in:pique-gpt,pique-claude,pique-gemini',
            'session_id' => 'nullable|string',
        ]);

        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return response()->json(['error' => 'No organization selected'], 400);
        }

        $result = $this->agent->process(
            $organization,
            auth()->user(),
            $request->prompt,
            $request->model,
            $request->session_id
        );

        if (isset($result['error'])) {
            return response()->json($result, 402); // Payment Required equivalent
        }

        return response()->json($result);
    }

    /**
     * Get the current credit balance for the organization.
     */
    public function credits()
    {
        $organization = auth()->user()->currentOrganization();
        $balance = $organization ? $this->credits->getCredits($organization)->balance : 0;

        return response()->json(['balance' => (float) $balance]);
    }

    /**
     * Get all active sessions for the organization.
     */
    public function history()
    {
        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return response()->json([]);
        }

        $sessions = \App\Models\AIAgent\AgentSession::where('organization_id', $organization->id)
            ->orderBy('updated_at', 'desc')
            ->get(['session_id', 'title', 'task_type', 'updated_at'])
            ->map(function ($s) {
                return [
                    'id' => $s->session_id,
                    'title' => $s->title ?? 'New Conversation',
                    'updated_at' => $s->updated_at->diffForHumans(),
                ];
            });

        return response()->json($sessions);
    }

    /**
     * Get detailed messages for a specific session.
     */
    public function showSession($sessionId)
    {
        $organization = auth()->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'No organization selected'], 400);
        }

        $session = \App\Models\AIAgent\AgentSession::where('session_id', $sessionId)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        return response()->json([
            'session_id' => $session->session_id,
            'messages'   => $session->message,
        ]);
    }

    /**
     * Delete a specific conversation session.
     */
    public function destroySession($sessionId)
    {
        $organization = auth()->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'No organization selected'], 400);
        }

        $session = \App\Models\AIAgent\AgentSession::where('session_id', $sessionId)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        $session->delete();

        return response()->json(['success' => true]);
    }
}
