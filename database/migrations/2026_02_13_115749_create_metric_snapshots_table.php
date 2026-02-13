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
        Schema::create('metric_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analytics_property_id')->constrained()->cascadeOnDelete();
            $table->date('snapshot_date')->index();
            
            // Core metrics
            $table->integer('users')->nullable();
            $table->integer('new_users')->nullable();
            $table->integer('sessions')->nullable();
            $table->integer('engaged_sessions')->nullable();
            $table->decimal('engagement_rate', 5, 2)->nullable();
            $table->decimal('avg_session_duration', 8, 2)->nullable();
            
            // Conversion metrics
            $table->integer('conversions')->nullable();
            $table->integer('lead_submissions')->nullable();
            $table->integer('signups')->nullable();
            $table->decimal('conversion_rate', 5, 2)->nullable();
            
            // Breakdown data (JSON)
            $table->json('by_source')->nullable();
            $table->json('by_medium')->nullable();
            $table->json('by_campaign')->nullable();
            $table->json('by_page')->nullable();
            $table->json('by_device')->nullable();
            $table->json('raw_response')->nullable();
            
            $table->timestamps();
            $table->unique(['analytics_property_id', 'snapshot_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metric_snapshots');
    }
};
