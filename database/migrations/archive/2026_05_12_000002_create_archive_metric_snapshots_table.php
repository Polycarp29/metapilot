<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'archive';

    public function up(): void
    {
        Schema::connection('archive')->create('metric_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id')->index();
            $table->unsignedBigInteger('analytics_property_id')->index();
            $table->date('snapshot_date')->index();

            // Core metrics
            $table->integer('users')->nullable();
            $table->integer('new_users')->nullable();
            $table->integer('sessions')->nullable();
            $table->integer('engaged_sessions')->nullable();
            $table->decimal('engagement_rate', 5, 2)->nullable();
            $table->decimal('avg_session_duration', 8, 2)->nullable();
            $table->integer('total_users')->nullable();

            // Conversion metrics
            $table->integer('conversions')->nullable();
            $table->integer('lead_submissions')->nullable();
            $table->integer('signups')->nullable();
            $table->decimal('conversion_rate', 5, 2)->nullable();
            $table->integer('form_starts')->nullable();
            $table->integer('form_completions')->nullable();
            $table->decimal('form_completion_rate', 5, 2)->nullable();
            $table->integer('phone_clicks')->nullable();
            $table->decimal('revenue', 14, 2)->nullable();

            // Breakdown data (JSON)
            $table->json('by_source')->nullable();
            $table->json('by_medium')->nullable();
            $table->json('by_campaign')->nullable();
            $table->json('by_page')->nullable();
            $table->json('by_device')->nullable();
            $table->json('by_geography')->nullable();
            $table->json('by_audience')->nullable();
            $table->json('raw_response')->nullable();

            $table->timestamps();
            $table->index(['analytics_property_id', 'snapshot_date']);
        });
    }

    public function down(): void
    {
        Schema::connection('archive')->dropIfExists('metric_snapshots');
    }
};
