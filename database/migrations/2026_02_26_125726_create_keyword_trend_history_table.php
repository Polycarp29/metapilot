<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keyword_trend_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('keyword_intelligence_id')
                  ->constrained('keyword_intelligence')
                  ->onDelete('cascade');
            $table->string('region', 10)->default('GLOBAL'); // ISO country code or 'GLOBAL'
            $table->date('date');

            // Pytrends / Serper data
            $table->float('interest_value')->default(0);    // 0–100 Pytrends normalized
            $table->float('trend_velocity')->default(0);    // delta vs prev recorded period
            $table->integer('search_volume')->nullable();   // derived from GSC impressions

            // Serper enrichment
            $table->float('ads_cpc')->nullable();           // from Google Ads via Serper
            $table->float('competition_score')->nullable(); // SERP competition density
            $table->float('seo_strength')->nullable();      // derived from crawler data

            $table->boolean('relevance_flag')->default(true);
            $table->timestamps();

            // Enforce one record per keyword × region × date
            $table->unique(['keyword_intelligence_id', 'region', 'date'], 'ki_region_date_unique');
            $table->index(['region', 'date']);
            $table->index('trend_velocity');
            $table->index('interest_value');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keyword_trend_history');
    }
};
