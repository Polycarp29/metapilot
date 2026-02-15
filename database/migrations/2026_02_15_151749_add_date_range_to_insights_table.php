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
        Schema::table('insights', function (Blueprint $table) {
            $table->date('start_date')->nullable()->after('analytics_property_id');
            $table->date('end_date')->nullable()->after('start_date');
            
            // Add index for faster lookups by property and date range
            $table->index(['analytics_property_id', 'start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('insights', function (Blueprint $table) {
            $table->dropIndex(['analytics_property_id', 'start_date', 'end_date']);
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};
