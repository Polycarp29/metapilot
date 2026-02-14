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
        Schema::create('search_console_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analytics_property_id')->constrained()->cascadeOnDelete();
            $table->date('snapshot_date')->index();
            $table->integer('clicks')->default(0);
            $table->integer('impressions')->default(0);
            $table->decimal('ctr', 10, 5)->default(0);
            $table->decimal('position', 10, 2)->default(0);
            $table->json('top_queries')->nullable();
            $table->json('top_pages')->nullable();
            $table->timestamps();

            $table->unique(['analytics_property_id', 'snapshot_date'], 'property_date_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('search_console_metrics');
    }
};
