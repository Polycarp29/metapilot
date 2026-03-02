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
            $table->string('country_code', 2)->nullable()->after('site_token');
            $table->string('city')->nullable()->after('country_code');
            $table->string('browser')->nullable()->after('city');
            $table->string('platform')->nullable()->after('browser');
            $table->string('device_type')->nullable()->after('platform');
            $table->string('screen_resolution')->nullable()->after('device_type');
            $table->string('referrer', 2048)->nullable()->after('page_url');
            $table->string('session_id')->nullable()->index()->after('referrer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->dropColumn([
                'country_code',
                'city',
                'browser',
                'platform',
                'device_type',
                'screen_resolution',
                'referrer',
                'session_id'
            ]);
        });
    }
};
