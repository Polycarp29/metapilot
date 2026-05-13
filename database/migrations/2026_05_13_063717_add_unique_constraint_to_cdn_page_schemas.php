<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cdn_page_schemas', function (Blueprint $table) {
            // Drop index if it already exists (safe re-run)
            try {
                $table->unique(['pixel_site_id', 'url_hash'], 'cdn_page_schemas_site_url_unique');
            } catch (\Exception $e) {
                // Index already exists — skip
            }
        });
    }

    public function down(): void
    {
        Schema::table('cdn_page_schemas', function (Blueprint $table) {
            $table->dropUnique('cdn_page_schemas_site_url_unique');
        });
    }
};
