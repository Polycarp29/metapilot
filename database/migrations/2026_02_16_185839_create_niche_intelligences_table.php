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
        Schema::create('niche_intelligences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('detected_niche');
            $table->decimal('confidence', 5, 2)->default(0);
            $table->json('evidence')->nullable();
            $table->json('industry_benchmarks')->nullable();
            $table->json('trend_keywords')->nullable();
            $table->json('seasonal_patterns')->nullable();
            $table->timestamp('last_updated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('niche_intelligences');
    }
};
