<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_keyword_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('keyword_intelligence_id')
                  ->constrained('keyword_intelligence')
                  ->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('custom_label')->nullable();
            $table->enum('use_case', ['blog', 'campaign', 'seo', 'research', 'other'])->default('research');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Each user can bookmark a keyword only once per org
            $table->unique(['user_id', 'keyword_intelligence_id', 'organization_id'], 'user_ki_org_unique');
            $table->index(['user_id', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_keyword_bookmarks');
    }
};
