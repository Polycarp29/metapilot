<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('control_engine_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('analytics_property_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('alert_type', [
                'critical_drop', 'unusual_spike', 'sitemap_failure', 
                'broken_links', 'crawl_error', 'acquisition_anomaly',
                'trend_opportunity', 'conversion_issue'
            ]);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->string('title');
            $table->text('description');
            $table->json('affected_metrics'); // Which metrics triggered this
            $table->json('recommendations'); // AI-generated action items
            $table->json('context_data'); // Supporting data/evidence
            $table->boolean('is_dismissed')->default(false);
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('control_engine_alerts');
    }
};
