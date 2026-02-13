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
        try {
            \Illuminate\Support\Facades\DB::statement('DROP INDEX schemas_schema_id_unique ON schemas');
        } catch (\Exception $e) {
            // Index might not exist
        }

        Schema::table('schemas', function (Blueprint $table) {
            $table->unique(['organization_id', 'schema_id']);
        });

        try {
            \Illuminate\Support\Facades\DB::statement('DROP INDEX sitemaps_filename_unique ON sitemaps');
        } catch (\Exception $e) {
            // Index might not exist
        }

        Schema::table('sitemaps', function (Blueprint $table) {
            $table->unique(['organization_id', 'filename']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schemas', function (Blueprint $table) {
            $table->dropUnique(['organization_id', 'schema_id']);
            $table->unique(['schema_id']);
        });

        Schema::table('sitemaps', function (Blueprint $table) {
            $table->dropUnique(['organization_id', 'filename']);
            $table->unique(['filename']);
        });
    }
};
