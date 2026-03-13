<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds live-discovery fields to sitemaps:
     *  - is_discovery : marks sitemaps that were auto-created by CDN pixel hits
     *  - crawl_mode   : 'python' = active/aggressive Scrapy crawl,
     *                   'cdn'    = passive/silent discovery via pixel traffic
     */
    public function up(): void
    {
        Schema::table('sitemaps', function (Blueprint $table) {
            $table->boolean('is_discovery')->default(false)->after('is_index')
                  ->comment('Auto-created from CDN pixel discovery');
            $table->enum('crawl_mode', ['python', 'cdn'])->default('python')->after('is_discovery')
                  ->comment('python = aggressive Scrapy crawl | cdn = silent pixel-based discovery');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sitemaps', function (Blueprint $table) {
            $table->dropColumn(['is_discovery', 'crawl_mode']);
        });
    }
};
