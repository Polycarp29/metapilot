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
        Schema::create('pique_knowledge', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('question_hash')->index();
            $table->text('question_text');
            $table->longText('answer_text');
            $table->json('metadata')->nullable(); // For TTL, context hashes, etc.
            $table->unsignedInteger('hits')->default(1);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            
            $table->unique(['organization_id', 'question_hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pique_knowledge');
    }
};
