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
        Schema::create('insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analytics_property_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('body'); // AI-generated narrative
            $table->json('context')->nullable(); // Metric data that triggered insight
            $table->string('type')->nullable(); // 'weekly', 'anomaly', 'suggestion', 'alert'
            $table->string('severity')->default('info'); // 'success', 'info', 'warning', 'danger'
            $table->timestamp('insight_at');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insights');
    }
};
