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
        Schema::create('analytical_forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analytics_property_id')->constrained()->onDelete('cascade');
            $table->string('forecast_type'); // 'propensity', 'fatigue', 'ranking'
            $table->json('forecast_data');
            $table->decimal('confidence_score', 5, 2)->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();

            $table->index(['analytics_property_id', 'forecast_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytical_forecasts');
    }
};
