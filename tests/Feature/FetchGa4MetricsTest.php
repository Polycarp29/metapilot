<?php

namespace Tests\Feature;

use App\Models\AnalyticsProperty;
use App\Models\MetricSnapshot;
use App\Models\Organization;
use App\Models\User;
use App\Services\Ga4Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class FetchGa4MetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_fetch_metrics_command_saves_data()
    {
        $user = User::factory()->create();
        $organization = Organization::create([
            'name' => 'Test Org',
            'slug' => 'test-org',
        ]);
        
        // Pivot link if necessary, but AnalyticsProperty belongsTo Organization directly
        
        $property = AnalyticsProperty::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'name' => 'Test Property',
            'property_id' => '123456',
            'is_active' => true,
            'access_token' => 'fake-access-token',
            'refresh_token' => 'fake-refresh-token',
            'token_expires_at' => now()->addHour(),
        ]);

        $this->mock(Ga4Service::class, function (MockInterface $mock) use ($property) {
            $mock->shouldReceive('fetchDailyMetrics')
                ->once()
                ->with(Mockery::on(function ($arg) use ($property) {
                    return $arg->id === $property->id;
                }), Mockery::any(), Mockery::any())
                ->andReturn([
                    [
                        'date' => '2026-02-13',
                        'users' => 100,
                        'sessions' => 150,
                        'engagement_rate' => 0.65,
                        'conversions' => 5,
                    ]
                ]);

            $mock->shouldReceive('fetchBreakdowns')
                ->once()
                ->andReturn([]);
        });

        $this->artisan('analytics:fetch-metrics --days=1')
            ->assertExitCode(0)
            ->expectsOutputToContain('Successfully saved metrics and breakdowns for: Test Property');

        $this->assertDatabaseHas('metric_snapshots', [
            'analytics_property_id' => $property->id,
            'snapshot_date' => '2026-02-13',
            'users' => 100,
        ]);
    }
}
