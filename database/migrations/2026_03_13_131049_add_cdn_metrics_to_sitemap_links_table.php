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
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->unsignedInteger('cdn_hit_count')->default(0)->after('http_status');
            $table->decimal('cdn_engagement_score', 5, 2)->default(0.00)->after('cdn_hit_count');
            $table->timestamp('cdn_last_seen_at')->nullable()->after('cdn_engagement_score');
            $table->boolean('cdn_active')->default(false)->after('cdn_last_seen_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->dropColumn(['cdn_hit_count', 'cdn_engagement_score', 'cdn_last_seen_at', 'cdn_active']);
        });
    }
};
