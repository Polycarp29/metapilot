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
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('blog_category_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->json('meta_keywords')->nullable();
            
            $table->string('focus_keyword')->nullable();
            $table->json('secondary_keywords')->nullable();
            $table->json('long_tail_keywords')->nullable();
            
            $table->integer('seo_score')->default(0);
            $table->integer('readability_score')->default(0);
            $table->integer('ai_content_score')->default(0);
            $table->boolean('ai_detected')->default(false);
            $table->text('ai_detection_notes')->nullable();
            
            $table->integer('word_count')->default(0);
            $table->integer('reading_time_minutes')->default(0);
            
            $table->enum('status', ['draft', 'review', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image')->nullable();
            $table->string('canonical_url')->nullable();
            $table->string('schema_type')->nullable();
            $table->string('featured_image_url')->nullable();
            
            $table->timestamps();

            $table->unique(['organization_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
