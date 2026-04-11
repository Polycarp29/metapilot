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
        Schema::create('pique_scheduled_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('task_type'); // crawl, analytics_alert, weekly_summary, etc.
            $table->string('frequency'); // hourly, daily, weekly, monthly
            $table->time('run_at')->nullable(); // time of day
            $table->integer('day_of_week')->nullable(); // 0 (Sunday) to 6 (Saturday)
            $table->json('payload')->nullable(); // task specific config
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->string('last_run_status')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pique_scheduled_tasks');
    }
};
