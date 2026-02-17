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
        Schema::create('trend_patterns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('pattern_type'); // 'acquisition', 'engagement', 'conversion', 'traffic_source'
            $table->string('niche')->nullable(); // Auto-detected niche/industry
            $table->json('pattern_data'); // Statistical pattern (mean, std, seasonality)
            $table->json('triggers'); // Conditions that match this pattern
            $table->decimal('confidence_score', 5, 2); // 0-100
            $table->integer('occurrence_count')->default(1);
            $table->timestamp('last_matched_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trend_patterns');
    }
};
