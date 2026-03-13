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
        Schema::create('cdn_page_schemas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pixel_site_id')->constrained()->onDelete('cascade');
            $table->string('url', 2048);
            $table->string('url_hash', 64)->index();
            $table->string('schema_type')->nullable();
            $table->json('schema_json')->nullable();
            $table->boolean('is_auto_generated')->default(true);
            $table->boolean('has_conflict')->default(false);
            $table->unsignedInteger('injected_count')->default(0);
            $table->timestamp('last_injected_at')->nullable();
            $table->timestamps();

            $table->unique(['pixel_site_id', 'url_hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cdn_page_schemas');
    }
};
