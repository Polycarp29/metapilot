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
        Schema::table('keyword_researches', function (Blueprint $table) {
            $table->decimal('growth_rate', 8, 2)->nullable()->after('hl');
            $table->integer('current_interest')->nullable()->after('growth_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('keyword_researches', function (Blueprint $table) {
            $table->dropColumn(['growth_rate', 'current_interest']);
        });
    }
};
