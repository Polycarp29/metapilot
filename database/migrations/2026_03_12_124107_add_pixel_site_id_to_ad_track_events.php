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
        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->foreignId('pixel_site_id')->nullable()->after('organization_id')->constrained('pixel_sites')->nullOnDelete();
        });

        // Update existing events to point to their new pixel_sites
        DB::statement('UPDATE ad_track_events e 
                       JOIN pixel_sites s ON e.site_token = s.ads_site_token 
                       SET e.pixel_site_id = s.id');
    }

    public function down(): void
    {
        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->dropForeign(['pixel_site_id']);
            $table->dropColumn('pixel_site_id');
        });
    }
};
