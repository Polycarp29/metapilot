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
        Schema::table('search_console_metrics', function (Blueprint $table) {
            $table->json('sitemaps')->nullable()->after('top_pages');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('search_console_metrics', function (Blueprint $table) {
            $table->dropColumn('sitemaps');
        });
    }
};
