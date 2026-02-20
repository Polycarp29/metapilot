<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crawl_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sitemap_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->enum('frequency', ['hourly', 'daily', 'weekly', 'monthly']);
            $table->time('run_at')->nullable();
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('max_depth')->default(3);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->string('last_run_status')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'next_run_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crawl_schedules');
    }
};
