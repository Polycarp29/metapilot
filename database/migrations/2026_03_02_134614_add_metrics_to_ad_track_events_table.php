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
            $table->string('page_view_id')->nullable()->unique()->after('id');
            $table->integer('duration_seconds')->default(0)->after('screen_resolution');
            $table->integer('click_count')->default(0)->after('duration_seconds');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->dropColumn(['page_view_id', 'duration_seconds', 'click_count']);
        });
    }
};
