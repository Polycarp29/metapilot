<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'archive';

    public function up(): void
    {
        Schema::connection('archive')->create('search_console_metrics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id')->index();
            $table->unsignedBigInteger('analytics_property_id')->index();
            $table->date('snapshot_date')->index();
            $table->integer('clicks')->default(0);
            $table->integer('impressions')->default(0);
            $table->decimal('ctr', 10, 5)->default(0);
            $table->decimal('position', 10, 2)->default(0);
            $table->json('top_queries')->nullable();
            $table->json('top_pages')->nullable();
            $table->json('sitemaps')->nullable(); // added in later migration
            $table->timestamps();

            $table->index(['analytics_property_id', 'snapshot_date']);
        });
    }

    public function down(): void
    {
        Schema::connection('archive')->dropIfExists('search_console_metrics');
    }
};
