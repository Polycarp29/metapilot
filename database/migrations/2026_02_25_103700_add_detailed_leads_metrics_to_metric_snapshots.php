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
        Schema::table('metric_snapshots', function (Blueprint $blueprint) {
            $blueprint->integer('returning_users')->default(0)->after('new_users');
            $blueprint->json('first_user_channel_group')->nullable()->after('by_first_source');
            $blueprint->json('manual_source_sessions')->nullable()->after('by_source');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metric_snapshots', function (Blueprint $blueprint) {
            $blueprint->dropColumn(['returning_users', 'first_user_channel_group', 'manual_source_sessions']);
        });
    }
};
