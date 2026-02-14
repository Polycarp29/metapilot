<?php

namespace Tests\Unit;

use App\Services\OpenAIService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenAIServiceTest extends TestCase
{
    public function test_analyze_analytics_data_returns_structured_json()
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'summary' => 'Traffic is up 10%',
                                'key_findings' => ['Users increased'],
                                'recommendations' => ['Keep it up'],
                                'severity' => 'low'
                            ])
                        ]
                    ]
                ]
            ], 200)
        ]);

        config(['services.openai.api_key' => 'test-key']);

        $service = new OpenAIService();
        $result = $service->analyzeAnalyticsData('Test Property', ['users' => 100], ['users' => 90]);

        $this->assertIsArray($result);
        $this->assertEquals('Traffic is up 10%', $result['summary']);
        $this->assertEquals('low', $result['severity']);
    }
}
