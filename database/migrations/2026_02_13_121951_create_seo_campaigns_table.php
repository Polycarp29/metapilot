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
        Schema::create('seo_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('analytics_property_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('objective')->nullable();
            $table->enum('status', ['draft', 'active', 'paused', 'completed'])->default('draft');
            $table->json('target_urls')->nullable(); // List of URLs
            $table->json('keywords')->nullable(); // Target keywords
            $table->json('strategy_data')->nullable(); // AI-generated strategy details
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seo_campaigns');
    }
};
