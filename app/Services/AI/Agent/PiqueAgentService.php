<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;
use App\Models\User;
use App\Models\AIAgent\AgentSession;
use App\Models\AIAgent\PiqueKnowledge;
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
     * 
     * @param string|null $sessionId
     * @param bool $stream
     * @param callable|null $onChunk
     */
    public function process(Organization $organization, User $user, string $prompt, string $modelType = 'pique-gpt', ?string $sessionId = null, bool $stream = false, ?callable $onChunk = null): array
    {
        // 1. Resolve Session
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

        // 1.5 Check Knowledge Base (Semantic Cache)
        $knowledge = $this->checkKnowledge($organization, $prompt);
        if ($knowledge) {
            $answer = $knowledge->answer_text;
            if ($stream && $onChunk) {
                // If streaming, "simulate" streaming for the cached answer for consistent UI feel
                $words = explode(' ', $answer);
                foreach ($words as $word) {
                    $onChunk($word . ' ');
                    usleep(20000); // 20ms delay
                }
            }
            return [
                'session_id' => $session->session_id,
                'response'   => $answer,
                'action'     => $knowledge->metadata['action'] ?? null,
                'is_cached'  => true,
            ];
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

        // 6. Build Conversation History
        $history = collect($session->message ?? [])
            ->filter(fn($m) => in_array($m['role'] ?? '', ['user', 'assistant', 'agent']))
            ->map(fn($m) => ['role' => $m['role'], 'content' => $m['content']])
            ->values()
            ->toArray();

        // 7. Dispatch Action
        $actionResult = $this->dispatcher->dispatch($prompt, $organization, $user);

        $response = '';
        if ($stream) {
            // 8. Generate Streamed Response
            $driver->generateStreamedResponse($prompt, $metapilotContext, $history, $systemPrompt, $actionResult, function($chunk) use (&$response, $onChunk) {
                $response .= $chunk;
                if ($onChunk) $onChunk($chunk);
            });
        } else {
            // 8. Generate Full Response
            $response = $driver->generateResponse($prompt, $metapilotContext, $history, $systemPrompt, $actionResult);
        }

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

        // 11. Save to Knowledge Base for future similar queries
        $this->saveKnowledge($organization, $prompt, $response, $actionResult);

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

    protected function checkKnowledge(Organization $organization, string $prompt): ?PiqueKnowledge
    {
        $hash = md5(Str::lower(trim($prompt)));
        
        $knowledge = PiqueKnowledge::where('organization_id', $organization->id)
            ->where('question_hash', $hash)
            ->first();

        // Check if TTL is still valid (Metadata context check could go here too)
        if ($knowledge) {
            $ttl = $knowledge->metadata['ttl'] ?? 7; // days
            if ($knowledge->created_at->addDays($ttl)->isPast()) {
                return null;
            }

            $knowledge->increment('hits');
            $knowledge->update(['last_used_at' => now()]);
            return $knowledge;
        }

        return null;
    }

    protected function saveKnowledge(Organization $organization, string $prompt, string $answer, ?array $action = null): void
    {
        $hash = md5(Str::lower(trim($prompt)));

        // Only save if it's long enough to be an "insight" and not a simple "hello"
        if (strlen($prompt) < 10 || strlen($answer) < 50) return;

        PiqueKnowledge::updateOrCreate(
            ['organization_id' => $organization->id, 'question_hash' => $hash],
            [
                'question_text' => $prompt,
                'answer_text'   => $answer,
                'metadata'      => [
                    'action' => $action,
                    'ttl'    => 7, // Default 7 days
                    'source' => 'ai_generation'
                ],
                'last_used_at'  => now(),
            ]
        );
    }
}
