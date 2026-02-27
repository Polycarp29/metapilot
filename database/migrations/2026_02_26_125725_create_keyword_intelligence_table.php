<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keyword_intelligence', function (Blueprint $table) {
            $table->id();
            $table->string('keyword')->unique(); // canonical lower-cased keyword
            $table->string('language', 5)->default('en');
            $table->enum('origin', ['pytrends', 'gsc', 'ads', 'serper', 'manual'])->default('serper');
            $table->string('category')->nullable(); // niche / vertical
            $table->boolean('is_active')->default(true);

            // Aggregate metrics updated rolling-average style
            $table->float('global_score')->default(0);  // 0–100 normalized interest
            $table->integer('search_volume_est')->nullable();
            $table->float('click_through_est')->nullable(); // avg CTR from GSC
            $table->float('relevance_score')->nullable();   // ML-predicted content value

            // Decay / lifecycle tracking
            $table->enum('decay_status', ['rising', 'stable', 'decaying', 'dormant', 'resurgent'])->default('stable');
            $table->float('trend_velocity')->default(0);    // rate of change (positive = rising)
            $table->json('related_queries')->nullable();
            $table->json('rising_queries')->nullable();

            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->index(['category', 'is_active']);
            $table->index('decay_status');
            $table->index('global_score');
            $table->index('trend_velocity');
            $table->index('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keyword_intelligence');
    }
};
