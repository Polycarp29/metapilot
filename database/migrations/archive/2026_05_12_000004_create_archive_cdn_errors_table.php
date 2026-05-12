<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'archive';

    public function up(): void
    {
        Schema::connection('archive')->create('cdn_errors', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pixel_site_id')->index();
            $table->unsignedBigInteger('organization_id')->index();
            $table->string('page_view_id', 50)->nullable();
            $table->string('url')->nullable();
            $table->text('message')->nullable();
            $table->longText('stack')->nullable();
            $table->string('source', 20)->default('window');
            $table->integer('line')->nullable();
            $table->integer('col')->nullable();
            $table->string('filename')->nullable();
            $table->string('user_agent', 512)->nullable(); // expanded per migration
            $table->string('ip_hash')->nullable();
            // perf fields added in later migration
            $table->integer('ttfb_ms')->nullable();
            $table->integer('fcp_ms')->nullable();
            $table->integer('lcp_ms')->nullable();
            $table->integer('cls_score')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::connection('archive')->dropIfExists('cdn_errors');
    }
};
