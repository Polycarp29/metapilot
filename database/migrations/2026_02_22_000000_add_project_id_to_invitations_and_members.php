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
        Schema::table('organization_invitations', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->constrained('seo_campaigns')->nullOnDelete()->after('organization_id');
        });

        Schema::table('organization_user', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->constrained('seo_campaigns')->nullOnDelete()->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_invitations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_id');
        });

        Schema::table('organization_user', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_id');
        });
    }
};
