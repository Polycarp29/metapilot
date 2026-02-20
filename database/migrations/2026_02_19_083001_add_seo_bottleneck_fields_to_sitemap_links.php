<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->json('seo_bottlenecks')->nullable()->after('extracted_json_ld');
            $table->string('url_slug_quality')->nullable()->after('seo_bottlenecks');
            $table->integer('depth_from_root')->default(0)->after('url_slug_quality');
            $table->integer('internal_links_in')->default(0)->after('depth_from_root');
            $table->integer('internal_links_out')->default(0)->after('internal_links_in');
        });
    }

    public function down(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->dropColumn([
                'seo_bottlenecks',
                'url_slug_quality',
                'depth_from_root',
                'internal_links_in',
                'internal_links_out',
            ]);
        });
    }
};
