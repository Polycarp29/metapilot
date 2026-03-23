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
        Schema::table('crawl_schedules', function (Blueprint $table) {
            $table->boolean('render_js')->default(false)->after('max_depth');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crawl_schedules', function (Blueprint $table) {
            $table->dropColumn('render_js');
        });
    }
};
