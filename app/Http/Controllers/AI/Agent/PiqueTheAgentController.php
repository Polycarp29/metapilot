<?php

namespace App\Http\Controllers\AI\Agent;

use App\Http\Controllers\Controller;
use App\Models\Sitemap;
use App\Services\Crawler\CrawlerManager;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PiqueTheAgentController extends Controller
{
    protected $agent;
    protected $credits;

    public function __construct(
        \App\Services\AI\Agent\PiqueAgentService $agent,
        \App\Services\AI\Agent\PiqueCreditService $credits,
        \App\Services\AI\Agent\PiqueContextService $context
    ) {
        $this->agent = $agent;
        $this->credits = $credits;
        $this->context = $context;
    }

    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        $balance = $organization ? $this->credits->getCredits($organization)->balance : 0;
        $context = $organization ? $this->context->getContext($organization) : null;

        return Inertia::render('Pique/Index', [
            'initialBalance'   => (float) $balance,
            'metapilotContext' => $context,
        ]);
    }

    /**
     * Handle prompt submissions for the Pique agent.
     */
    public function ask(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'prompt'     => 'required|string',
            'model'      => 'required|string|in:pique-gpt,pique-claude,pique-gemini',
            'session_id' => 'nullable|string',
            'stream'     => 'nullable|boolean',
        ]);

        $organization = auth()->user()->currentOrganization();
        
        if (!$organization) {
            return response()->json(['error' => 'No organization selected'], 400);
        }

        if ($request->boolean('stream')) {
            return response()->stream(function () use ($organization, $request) {
                // We wrap the process call to catch the metadata
                $fullResult = $this->agent->process(
                    $organization,
                    auth()->user(),
                    $request->prompt,
                    $request->model,
                    $request->session_id,
                    true, // stream
                    function ($chunk) {
                        echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";
                        if (ob_get_level() > 0) ob_flush();
                        flush();
                    }
                );
                
                // Check if process returned an error instead of a session
                if (isset($fullResult['error'])) {
                     echo "data: " . json_encode(['error' => $fullResult['error']]) . "\n\n";
                     if (ob_get_level() > 0) ob_flush();
                     flush();
                     return;
                }

                // Finally send the full result metadata (session_id, action) so the frontend can finalize
                echo "data: " . json_encode([
                    'session_id' => $fullResult['session_id'] ?? null,
                    'action'     => $fullResult['action'] ?? null,
                    'done'       => true
                ]) . "\n\n";
                if (ob_get_level() > 0) ob_flush();
                flush();
            }, 200, [
                'Content-Type'      => 'text/event-stream',
                'X-Accel-Buffering' => 'no',
                'Cache-Control'     => 'no-cache',
            ]);
        }

        $result = $this->agent->process(
            $organization,
            auth()->user(),
            $request->prompt,
            $request->model,
            $request->session_id
        );

        if (isset($result['error'])) {
            return response()->json($result, 402);
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

    // ─── Container-Aware Crawl API ────────────────────────────────────────────

    /**
     * List sitemap containers for the current organization.
     */
    public function listContainers()
    {
        $organization = auth()->user()->currentOrganization();
        if (!$organization) {
            return response()->json([]);
        }

        $sitemaps = Sitemap::where('organization_id', $organization->id)
            ->withCount('links')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn ($s) => [
                'id'               => $s->id,
                'name'             => $s->name,
                'site_url'         => $s->site_url,
                'last_crawl_status'=> $s->last_crawl_status,
                'last_crawl_job_id'=> $s->last_crawl_job_id,
                'links_count'      => $s->links_count,
                'manage_url'       => route('sitemaps.show', $s->id),
            ]);

        return response()->json($sitemaps);
    }

    /**
     * Create a new sitemap container for the current organization.
     */
    public function createContainer(Request $request)
    {
        $organization = auth()->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'No organization selected'], 400);
        }

        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'sitemap_name' => 'required|string|max:100',
            'site_url'     => 'required|url|max:500',
        ]);

        $filename = Str::slug($validated['sitemap_name']) . '.xml';

        $sitemap = Sitemap::create([
            'user_id'         => auth()->id(),
            'organization_id' => $organization->id,
            'name'            => $validated['name'],
            'site_url'        => rtrim($validated['site_url'], '/'),
            'filename'        => $filename,
        ]);

        return response()->json([
            'id'          => $sitemap->id,
            'name'        => $sitemap->name,
            'site_url'    => $sitemap->site_url,
            'links_count' => 0,
            'manage_url'  => route('sitemaps.show', $sitemap->id),
        ], 201);
    }

    /**
     * Dispatch a crawl for a specific sitemap container.
     */
    public function startContainerCrawl(Request $request, $sitemapId)
    {
        $organization = auth()->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'No organization selected'], 400);
        }

        $sitemap = Sitemap::where('id', $sitemapId)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        if (!$sitemap->site_url) {
            return response()->json(['error' => 'This container has no site URL configured.'], 422);
        }

        $crawler = app(CrawlerManager::class);
        $result  = $crawler->dispatch($sitemap->id, $sitemap->site_url, 3, [
            'render_js'           => false,
            'individual_results'  => true,
        ]);

        if (!$result) {
            return response()->json(['error' => 'Failed to dispatch crawl job. Ensure the crawler service is reachable.'], 503);
        }

        $sitemap->update([
            'last_crawl_status'  => 'dispatched',
            'last_crawl_job_id'  => $result['job_id'] ?? null,
        ]);

        return response()->json([
            'job_id'     => $result['job_id'] ?? null,
            'sitemap_id' => $sitemap->id,
            'status'     => 'dispatched',
            'manage_url' => route('sitemaps.show', $sitemap->id),
        ]);
    }

    /**
     * Poll the crawl progress for a given sitemap / job.
     */
    public function getContainerCrawlStatus(Request $request, $sitemapId)
    {
        $organization = auth()->user()->currentOrganization();
        if (!$organization) {
            return response()->json(['error' => 'No organization selected'], 400);
        }

        $sitemap = Sitemap::where('id', $sitemapId)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        // If there's a job ID, poll the external crawler service
        if ($sitemap->last_crawl_job_id) {
            $crawler = app(CrawlerManager::class);
            $progress = $crawler->getStatus($sitemap->last_crawl_job_id);
            if ($progress) {
                return response()->json(array_merge($progress, [
                    'manage_url'  => route('sitemaps.show', $sitemap->id),
                    'links_count' => $sitemap->links()->count(),
                ]));
            }
        }

        // Fallback: report from local DB
        return response()->json([
            'status'           => $sitemap->last_crawl_status ?? 'unknown',
            'total_crawled'    => $sitemap->links()->whereNotNull('last_crawl_status')->count(),
            'total_discovered' => $sitemap->links()->count(),
            'current_url'      => null,
            'manage_url'       => route('sitemaps.show', $sitemap->id),
            'links_count'      => $sitemap->links()->count(),
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
