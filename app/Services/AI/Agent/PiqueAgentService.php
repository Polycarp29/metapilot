<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;
use App\Models\User;
use App\Models\AIAgent\AgentSession;
use Illuminate\Support\Str;

class PiqueAgentService
{
    public function __construct(
        protected PiqueCreditService      $credits,
        protected PiqueContextService     $context,
        protected PiqueSystemPromptBuilder $promptBuilder,
        protected PiqueActionDispatcher   $dispatcher,
    ) {}

    /**
     * Process a prompt for the Pique agent.
     */
    public function process(Organization $organization, User $user, string $prompt, string $modelType = 'pique-gpt', ?string $sessionId = null): array
    {
        // 1. Resolve Session (null-safe: create new if not found)
        $session = null;
        if ($sessionId) {
            $session = AgentSession::where('session_id', $sessionId)
                ->where('organization_id', $organization->id)
                ->first();
        }
        if (!$session) {
            $session = AgentSession::create([
                'session_id'       => (string) Str::uuid(),
                'organization_id'  => $organization->id,
                'user_id'          => $user->id,
                'task_type'        => 'chat',
                'context_snapshot' => [],
                'recommendations'  => [],
                'status'           => 'active',
                'message'          => [],
            ]);
        }

        // 2. Select Driver
        $driver = $this->getDriver($modelType);
        $cost   = $driver->getCreditCost();

        // 3. Check & Deduct Credits
        if (!$this->credits->hasEnoughCredits($organization, $cost)) {
            return [
                'error'          => 'Insufficient credits',
                'balance_needed' => $cost,
            ];
        }
        $this->credits->deductCredits($organization, $user, $cost, $modelType, 'Pique Prompt: ' . Str::limit($prompt, 50));

        // 4. Gather Context
        $metapilotContext = $this->context->getContext($organization);

        // 5. Build System Prompt
        $systemPrompt = $this->promptBuilder->build($organization, $metapilotContext);

        // 6. Build Conversation History (prior turns)
        $history = collect($session->message ?? [])
            ->filter(fn($m) => in_array($m['role'] ?? '', ['user', 'assistant']))
            ->map(fn($m) => ['role' => $m['role'], 'content' => $m['content']])
            ->values()
            ->toArray();

        // 7. Dispatch Action (BEFORE successful LLM response so the agent can see the results)
        $actionResult = $this->dispatcher->dispatch($prompt, $organization, $user);

        // 8. Generate LLM Response (informed by action results)
        $response = $driver->generateResponse($prompt, $metapilotContext, $history, $systemPrompt, $actionResult);

        // 9. Auto-generate Title if missing (first turn)
        $title = $session->title ?? Str::limit($prompt, 40);

        // 10. Update Session with both user + assistant turns
        $session->update([
            'title'            => $title,
            'message'          => array_merge($session->message ?? [], [
                ['role' => 'user',      'content' => $prompt],
                ['role' => 'assistant', 'content' => $response, 'model' => $modelType, 'action' => $actionResult],
            ]),
            'context_snapshot' => $metapilotContext,
        ]);

        return [
            'session_id' => $session->session_id,
            'response'   => $response,
            'action'     => $actionResult,
        ];
    }

    protected function getDriver(string $type): ModelDriverInterface
    {
        return match ($type) {
            'pique-claude'  => app(ClaudeDriver::class),
            'pique-gemini'  => app(GeminiDriver::class),
            default         => app(GptDriver::class),
        };
    }
}
