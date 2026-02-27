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
        Schema::table('keyword_intelligence', function (Blueprint $table) {
            $table->string('origin', 50)->default('serper')->change();
            $table->string('decay_status', 30)->default('stable')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('keyword_intelligence', function (Blueprint $table) {
            $table->enum('origin', ['pytrends', 'gsc', 'ads', 'serper', 'manual'])->default('serper')->change();
            $table->enum('decay_status', ['rising', 'stable', 'decaying', 'dormant', 'resurgent'])->default('stable')->change();
        });
    }
};
