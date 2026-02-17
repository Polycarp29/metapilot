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
        Schema::create('keyword_researches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('query');
            $table->string('gl', 5)->default('us');
            $table->string('hl', 5)->default('en');
            $table->string('niche')->nullable();
            $table->string('intent')->nullable();
            $table->json('results')->nullable();
            $table->timestamp('last_searched_at')->useCurrent();
            $table->timestamps();

            $table->index(['query', 'gl', 'hl', 'niche']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('keyword_researches');
    }
};
