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
        Schema::create('google_trends_cache', function (Blueprint $table) {
            $table->id();
            $table->string('keyword');
            $table->string('geo')->default('US');
            $table->string('timeframe')->default('today 12-m');
            $table->json('trend_data'); // Time series data
            $table->json('related_queries')->nullable();
            $table->json('rising_queries')->nullable();
            $table->timestamp('fetched_at');
            $table->timestamps();
            
            $table->index(['keyword', 'geo', 'timeframe']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_trends_cache');
    }
};
