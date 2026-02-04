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
        Schema::create('sitemap_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sitemap_id')->constrained()->onDelete('cascade');
            $table->string('url');
            $table->date('lastmod')->nullable();
            $table->string('changefreq')->default('daily');
            $table->decimal('priority', 2, 1)->default(0.5);
            $table->boolean('is_canonical')->default(true);
            $table->string('canonical_url')->nullable();
            $table->timestamps();

            $table->index('url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sitemap_links');
    }
};
