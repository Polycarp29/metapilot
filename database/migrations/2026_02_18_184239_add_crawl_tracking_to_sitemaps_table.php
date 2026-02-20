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
        Schema::table('sitemaps', function (Blueprint $table) {
            $table->string('last_crawl_status')->nullable()->after('last_generated_at');
            $table->string('last_crawl_job_id')->nullable()->after('last_crawl_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sitemaps', function (Blueprint $table) {
            $table->dropColumn(['last_crawl_status', 'last_crawl_job_id']);
        });
    }

};
