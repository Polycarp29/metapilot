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
        Schema::create('trending_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('keyword');
            $table->string('niche'); // e.g., 'ecommerce', 'saas'
            $table->string('country_code', 2); // ISO 2-letter code
            $table->string('city')->nullable();
            $table->decimal('growth_rate', 5, 2); // Percentage growth
            $table->integer('current_interest'); // 0-100 Google Trends interest score
            $table->json('related_queries')->nullable();
            $table->enum('recommendation_type', ['high_potential', 'rising', 'seasonal']);
            $table->date('trending_date'); // When it was trending
            $table->boolean('used_in_campaign')->default(false);
            $table->timestamps();
            
            $table->index(['organization_id', 'country_code']);
            $table->index(['niche', 'country_code']);
            $table->index('trending_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trending_keywords');
    }
};
