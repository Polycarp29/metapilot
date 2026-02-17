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
        Schema::create('campaign_trending_keyword', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seo_campaign_id')->constrained()->onDelete('cascade');
            $table->foreignId('trending_keyword_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['seo_campaign_id', 'trending_keyword_id'], 'campaign_keyword_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaign_trending_keyword');
    }
};
