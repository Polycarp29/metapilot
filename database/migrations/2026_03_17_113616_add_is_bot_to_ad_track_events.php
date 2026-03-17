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
            $table->boolean('is_bot')->default(false)->after('device_type');
            $table->index('is_bot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->dropIndex(['is_bot']);
            $table->dropColumn('is_bot');
        });
    }
};
