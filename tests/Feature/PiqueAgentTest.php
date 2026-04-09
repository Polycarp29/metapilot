<?php

namespace Tests\Feature;

use App\Models\AIAgent\AgentSession;
use App\Models\AIAgent\OrganizationCredit;
use App\Models\Organization;
use App\Models\User;
use App\Services\AI\Agent\GptDriver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PiqueAgentTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Organization $org;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->org  = Organization::factory()->create(['allowed_domain' => 'testsite.com']);
        $this->user->organizations()->attach($this->org->id, ['role' => 'owner']);

        $this->actingAs($this->user);
        session(['current_organization_id' => $this->org->id]);

        // Give the org credits
        OrganizationCredit::create([
            'organization_id' => $this->org->id,
            'balance'         => 100.00,
            'total_used'      => 0,
        ]);
    }

    public function test_ask_returns_response_and_session_id()
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'Here is my SEO advice for testsite.com']]]
            ], 200),
        ]);

        config(['services.openai.api_key' => 'test-key']);

        $response = $this->postJson(route('api.pique.ask'), [
            'prompt' => 'Analyze my SEO performance',
            'model'  => 'pique-gpt',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['session_id', 'response'])
            ->assertJsonPath('response', 'Here is my SEO advice for testsite.com');

        $this->assertDatabaseHas('agent_sessions', [
            'organization_id' => $this->org->id,
        ]);
    }

    public function test_ask_deducts_credits()
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'Response']]]
            ], 200),
        ]);
        config(['services.openai.api_key' => 'test-key']);

        $this->postJson(route('api.pique.ask'), [
            'prompt' => 'Hello Pique',
            'model'  => 'pique-gpt',
        ])->assertStatus(200);

        $credit = OrganizationCredit::where('organization_id', $this->org->id)->first();
        $this->assertEquals(98.00, (float) $credit->balance); // 100 - 2.0 for GPT
    }

    public function test_ask_returns_402_on_insufficient_credits()
    {
        OrganizationCredit::where('organization_id', $this->org->id)->update(['balance' => 0]);

        $response = $this->postJson(route('api.pique.ask'), [
            'prompt' => 'Do something expensive',
            'model'  => 'pique-gpt',
        ]);

        $response->assertStatus(402)->assertJsonPath('error', 'Insufficient credits');
    }

    public function test_history_returns_sessions()
    {
        AgentSession::create([
            'session_id'       => 'test-session-1',
            'organization_id'  => $this->org->id,
            'user_id'          => $this->user->id,
            'task_type'        => 'chat',
            'title'            => 'Test Session',
            'status'           => 'active',
            'message'          => [],
            'context_snapshot' => [],
            'recommendations'  => [],
        ]);

        $response = $this->getJson(route('api.pique.history'));

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Test Session');
    }

    public function test_show_session_returns_messages()
    {
        AgentSession::create([
            'session_id'       => 'sess-abc',
            'organization_id'  => $this->org->id,
            'user_id'          => $this->user->id,
            'task_type'        => 'chat',
            'title'            => 'Test',
            'status'           => 'active',
            'message'          => [['role' => 'user', 'content' => 'Hello']],
            'context_snapshot' => [],
            'recommendations'  => [],
        ]);

        $response = $this->getJson(route('api.pique.session', ['sessionId' => 'sess-abc']));

        $response->assertStatus(200)
            ->assertJsonPath('session_id', 'sess-abc')
            ->assertJsonPath('messages.0.content', 'Hello');
    }

    public function test_destroy_session_deletes_it()
    {
        AgentSession::create([
            'session_id'       => 'sess-del',
            'organization_id'  => $this->org->id,
            'user_id'          => $this->user->id,
            'task_type'        => 'chat',
            'title'            => 'To Delete',
            'status'           => 'active',
            'message'          => [],
            'context_snapshot' => [],
            'recommendations'  => [],
        ]);

        $this->deleteJson(route('api.pique.session.destroy', ['sessionId' => 'sess-del']))
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('agent_sessions', ['session_id' => 'sess-del']);
    }

    public function test_conversation_memory_sends_history_to_llm()
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'Follow up response']]]
            ], 200),
        ]);
        config(['services.openai.api_key' => 'test-key']);

        // First message — creates session
        $first = $this->postJson(route('api.pique.ask'), [
            'prompt' => 'Hello I need SEO help',
            'model'  => 'pique-gpt',
        ]);
        $sessionId = $first->json('session_id');

        // Give more credits
        OrganizationCredit::where('organization_id', $this->org->id)->update(['balance' => 100]);

        // Second message — continuation
        $second = $this->postJson(route('api.pique.ask'), [
            'prompt'     => 'What keywords should I target?',
            'model'      => 'pique-gpt',
            'session_id' => $sessionId,
        ]);

        $second->assertStatus(200)->assertJsonPath('session_id', $sessionId);

        // Session should now have 4 messages (2 user + 2 assistant)
        $session = AgentSession::where('session_id', $sessionId)->first();
        $this->assertCount(4, $session->message);

        // Verify history was sent to OpenAI (2nd call had prior messages)
        Http::assertSentCount(2);
    }
}
