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
            $table->json('seo_audit')->nullable()->after('status');
            $table->json('ssl_info')->nullable()->after('seo_audit');
            $table->json('request_analysis')->nullable()->after('ssl_info');
            $table->json('extracted_json_ld')->nullable()->after('request_analysis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->dropColumn([
                'seo_audit',
                'ssl_info',
                'request_analysis',
                'extracted_json_ld'
            ]);
        });
    }
};
