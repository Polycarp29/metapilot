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
            // Drop index first because VARCHAR(2048) / TEXT cannot be fully indexed in some MySQL configs
            $table->dropIndex(['url']);
            
            // Change to TEXT to handle virtually any URL length
            $table->text('url')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->string('url', 255)->change();
            $table->index(['url']);
        });
    }
};
