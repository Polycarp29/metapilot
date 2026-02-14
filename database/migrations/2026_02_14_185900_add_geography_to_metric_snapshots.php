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
            $table->json('by_country')->nullable()->after('by_device');
            $table->json('by_city')->nullable()->after('by_country');
            $table->decimal('bounce_rate', 8, 4)->nullable()->after('engagement_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metric_snapshots', function (Blueprint $table) {
            $table->dropColumn(['by_country', 'by_city', 'bounce_rate']);
        });
    }
};
