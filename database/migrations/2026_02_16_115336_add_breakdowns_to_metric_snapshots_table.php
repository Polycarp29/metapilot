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
            $table->json('by_page_title')->nullable()->after('by_page');
            $table->json('by_first_source')->nullable()->after('by_source');
            $table->json('by_event')->nullable()->after('by_city');
            $table->json('by_screen')->nullable()->after('by_page_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metric_snapshots', function (Blueprint $table) {
            $table->dropColumn(['by_page_title', 'by_first_source', 'by_event', 'by_screen']);
        });
    }
};
