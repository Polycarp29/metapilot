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
        Schema::create('lead_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analytics_property_id')->constrained()->cascadeOnDelete();
            $table->timestamp('event_at');
            
            // Lead details
            $table->string('event_name'); // e.g., "form_submit", "newsletter_signup"
            $table->string('form_name')->nullable();
            $table->string('page_url');
            
            // Attribution
            $table->string('source')->nullable();
            $table->string('medium')->nullable();
            $table->string('campaign')->nullable();
            $table->string('device_category')->nullable();
            
            // Custom data
            $table->json('event_params')->nullable();
            
            $table->timestamps();
            $table->index(['analytics_property_id', 'event_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_events');
    }
};
