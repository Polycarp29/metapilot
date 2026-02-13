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
        Schema::create('analytics_properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('property_id')->unique(); // GA4 Property ID
            $table->string('website_url')->nullable();
            $table->json('config')->nullable(); // For storing credentials or settings
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Allow same property_id? No, GA4 property ID is unique globally usually.
            // But if user wants to map same property to multiple orgs? Probably not.
            // Keeping unique constraint on property_id for now as it makes sense.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics_properties');
    }
};
