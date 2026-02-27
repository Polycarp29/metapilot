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
        Schema::table('saved_keywords', function (Blueprint $table) {
            $table->foreignId('keyword_intelligence_id')
                  ->nullable()
                  ->after('organization_id')
                  ->constrained('keyword_intelligence')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saved_keywords', function (Blueprint $table) {
            $table->dropForeign(['keyword_intelligence_id']);
            $table->dropColumn('keyword_intelligence_id');
        });
    }
};
