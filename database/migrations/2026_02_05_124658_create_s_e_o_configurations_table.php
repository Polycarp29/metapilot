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
        Schema::create('s_e_o_configurations', function (Blueprint $table) {
            $table->id();
             // Page identification
            $table->string('page_url')->unique()->index();
            $table->string('route_name')->nullable()->index();
            $table->boolean('is_active')->default(true);
            
            // Basic Meta Tags
            $table->string('title', 60)->nullable(); // Google displays ~60 chars
            $table->text('meta_description')->nullable(); // Up to 160 chars recommended
            $table->text('meta_keywords')->nullable(); // Less important but still useful
            
            // Favicon
            $table->string('favicon_path')->nullable();
            $table->string('favicon_type', 20)->default('image/x-icon'); // MIME type
            
            // Open Graph Tags (Social Media)
            $table->string('og_title', 60)->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image')->nullable();
            $table->string('og_type', 50)->default('website');
            $table->string('og_url')->nullable();
            $table->string('og_site_name')->nullable();
            
            // Twitter Card Tags
            $table->string('twitter_card', 50)->default('summary');
            $table->string('twitter_title', 60)->nullable();
            $table->text('twitter_description')->nullable();
            $table->string('twitter_image')->nullable();
            $table->string('twitter_site')->nullable(); // @username
            $table->string('twitter_creator')->nullable(); // @username
            
            // Technical SEO
            $table->string('robots_meta')->default('index,follow');
            $table->string('canonical_url')->nullable();
            $table->json('hreflang')->nullable(); // For multilingual sites
            
            // Schema.org structured data
            $table->json('schema_markup')->nullable();
            
            // Additional SEO settings
            $table->string('author')->nullable();
            $table->string('publisher')->nullable();
            $table->date('publish_date')->nullable();
            $table->date('modified_date')->nullable();
            $table->text('custom_head_tags')->nullable(); // For custom HTML in head
            // Google and Bing Tags
            $table->mediumText('gtm_head')->nullable();
            $table->mediumText('gtm_body')->nullable();
            $table->mediumText('microsoft_tag')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('s_e_o_configurations');
    }
};
