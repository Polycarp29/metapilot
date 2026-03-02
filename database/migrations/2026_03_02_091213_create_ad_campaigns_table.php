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
        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('analytics_property_id')->constrained()->onDelete('cascade');
            $table->string('google_ads_customer_id');
            $table->string('google_campaign_id');
            $table->string('name');
            $table->string('status');
            $table->string('campaign_type');
            $table->bigInteger('budget_micros');
            $table->json('metrics');
            $table->string('date_range');
            $table->timestamp('synced_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ad_campaigns');
    }
};
