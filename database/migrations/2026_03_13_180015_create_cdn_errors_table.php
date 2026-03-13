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
        Schema::create('cdn_errors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pixel_site_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('page_view_id', 50)->nullable();
            $table->string('url')->nullable();
            $table->text('message')->nullable();
            $table->longText('stack')->nullable();
            $table->string('source', 20)->default('window'); // window, promise
            $table->integer('line')->nullable();
            $table->integer('col')->nullable();
            $table->string('filename')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('ip_hash')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cdn_errors');
    }
};
