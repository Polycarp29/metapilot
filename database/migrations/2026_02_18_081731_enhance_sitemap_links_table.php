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
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->string('title')->nullable()->after('url');
            $table->text('description')->nullable()->after('title');
            $table->string('h1')->nullable()->after('description');
            $table->string('canonical')->nullable()->after('h1');
            $table->json('keywords')->nullable()->after('canonical');
            $table->integer('structure_level')->default(0)->after('keywords');
            $table->string('parent_url')->nullable()->after('structure_level');
            $table->float('load_time')->nullable()->after('parent_url');
            $table->json('schema_suggestions')->nullable()->after('load_time');
            $table->enum('status', ['pending', 'crawling', 'completed', 'failed'])->default('pending')->after('schema_suggestions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sitemap_links', function (Blueprint $table) {
            $table->dropColumn([
                'title',
                'description',
                'h1',
                'canonical',
                'keywords',
                'structure_level',
                'parent_url',
                'load_time',
                'schema_suggestions',
                'status'
            ]);
        });
    }
};
