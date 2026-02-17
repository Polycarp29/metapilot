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
        Schema::table('metric_snapshots', function (Blueprint $table) {
            $table->json('by_audience')->nullable()->after('by_event');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metric_snapshots', function (Blueprint $table) {
            $table->dropColumn('by_audience');
        });
    }
};
