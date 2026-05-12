<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'archive';

    public function up(): void
    {
        Schema::connection('archive')->create('ad_track_events', function (Blueprint $table) {
            $table->id();
            // organization_id stored as plain unsignedBigInteger (no FK constraint in archive)
            $table->unsignedBigInteger('organization_id')->index();
            $table->uuid('site_token')->index();
            $table->string('google_campaign_id')->nullable();
            $table->string('page_url', 2048)->nullable();
            $table->string('gclid')->nullable()->index();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('ip_hash');
            // Extended fields added in later migrations
            $table->string('country', 10)->nullable();
            $table->string('city')->nullable();
            $table->string('device_type', 20)->nullable();
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->decimal('revenue', 10, 2)->nullable();
            $table->integer('clicks')->nullable();
            $table->integer('conversions')->nullable();
            $table->boolean('is_bot')->default(false);
            $table->integer('max_scroll_depth')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('pixel_site_id')->nullable()->index();
            $table->timestamps();

            $table->index(['organization_id', 'created_at']);
            $table->index(['site_token', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::connection('archive')->dropIfExists('ad_track_events');
    }
};
