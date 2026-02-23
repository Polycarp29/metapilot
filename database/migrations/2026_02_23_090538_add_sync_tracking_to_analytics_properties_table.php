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
        Schema::table('analytics_properties', function (Blueprint $column) {
            $column->string('sync_status')->default('pending')->after('gsc_permission_error');
            $column->timestamp('last_sync_at')->nullable()->after('sync_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('analytics_properties', function (Blueprint $column) {
            $column->dropColumn(['sync_status', 'last_sync_at']);
        });
    }
};
