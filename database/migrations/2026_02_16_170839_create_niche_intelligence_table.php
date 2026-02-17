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
        Schema::create('niche_intelligence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('detected_niche');
            $table->decimal('confidence', 5, 2); // 0-100
            $table->json('evidence'); // Keywords, topics, audience data
            $table->json('industry_benchmarks')->nullable(); // CTR, bounce rate, etc.
            $table->json('trend_keywords'); // Top trending keywords in this niche
            $table->json('seasonal_patterns')->nullable();
            $table->timestamp('last_updated_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('niche_intelligence');
    }
};
