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
            // Index for organization-wide analytics (30d windows)
            $table->index(['organization_id', 'created_at'], 'idx_org_events_time');
            
            // Index for site-specific analytics
            $table->index(['pixel_site_id', 'created_at'], 'idx_site_events_time');
            
            // Index for page-specific analytics (Top Pages)
            $table->index(['page_url'], 'idx_page_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->dropIndex('idx_org_events_time');
            $table->dropIndex('idx_site_events_time');
            $table->dropIndex('idx_page_url');
        });
    }
};
