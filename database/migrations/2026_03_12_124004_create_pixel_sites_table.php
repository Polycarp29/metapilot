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
        Schema::create('pixel_sites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->uuid('ads_site_token')->unique();
            $table->string('allowed_domain')->nullable();
            $table->timestamp('pixel_verified_at')->nullable();
            $table->timestamps();
        });

        // Data migration: Move existing organization tokens to pixel_sites
        $organizations = DB::table('organizations')
            ->whereNotNull('ads_site_token')
            ->get();

        foreach ($organizations as $org) {
            DB::table('pixel_sites')->insert([
                'organization_id'   => $org->id,
                'label'             => 'Default Site',
                'ads_site_token'    => $org->ads_site_token,
                'allowed_domain'    => $org->allowed_domain,
                'pixel_verified_at' => $org->pixel_verified_at,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pixel_sites');
    }
};
