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
        Schema::table('pixel_sites', function (Blueprint $table) {
            $table->json('enabled_modules')->nullable()->after('allowed_domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pixel_sites', function (Blueprint $table) {
            $table->dropColumn('enabled_modules');
        });
    }
};
