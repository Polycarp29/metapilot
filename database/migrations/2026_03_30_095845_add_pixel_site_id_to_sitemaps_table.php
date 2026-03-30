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
        Schema::table('sitemaps', function (Blueprint $table) {
            $table->foreignId('pixel_site_id')->nullable()->after('organization_id')->constrained()->nullOnDelete();
            $table->index('pixel_site_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sitemaps', function (Blueprint $table) {
            $table->dropForeign(['pixel_site_id']);
            $table->dropColumn('pixel_site_id');
        });
    }
};
