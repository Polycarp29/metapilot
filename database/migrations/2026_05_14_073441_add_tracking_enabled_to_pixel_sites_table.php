<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a per-pixel-site on/off toggle for CDN hit ingestion.
     * When disabled, trackHit() and verifyConnection() return immediately
     * without writing anything to the database.
     */
    public function up(): void
    {
        Schema::table('pixel_sites', function (Blueprint $table) {
            // Default true so existing sites are unaffected by the migration.
            $table->boolean('tracking_enabled')->default(true)->after('enabled_modules');
        });
    }

    public function down(): void
    {
        Schema::table('pixel_sites', function (Blueprint $table) {
            $table->dropColumn('tracking_enabled');
        });
    }
};
