<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            // The domain the pixel is authorised to fire from (e.g. "example.com").
            // Hits originating from a different domain are rejected with 403.
            $table->string('allowed_domain')->nullable()->after('ads_site_token');

            // Set the first time a valid, domain-matched hit is received, confirming
            // the pixel is correctly installed on the registered site.
            $table->timestamp('pixel_verified_at')->nullable()->after('allowed_domain');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['allowed_domain', 'pixel_verified_at']);
        });
    }
};
