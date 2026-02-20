<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->json('ai_schema_data')->nullable()->after('seo_bottlenecks');
        });
    }

    public function down(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->dropColumn('ai_schema_data');
        });
    }
};
