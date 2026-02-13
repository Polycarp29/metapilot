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
        Schema::table('schema_containers', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->after('user_id')->nullable()->constrained()->cascadeOnDelete();
            
            // identifier should be unique per organization, not globally
            // We need to drop the existing unique index on identifier if it exists
            $table->dropUnique(['identifier']);
            $table->unique(['organization_id', 'identifier']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_containers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['organization_id']);
            $table->dropUnique(['organization_id', 'identifier']);
            $table->dropColumn(['user_id', 'organization_id']);
            
            // Restore original unique constraint (might fail if duplicates exist now)
            $table->unique('identifier');
        });
    }
};
