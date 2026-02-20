<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE sitemap_links MODIFY COLUMN status ENUM('pending', 'crawling', 'completed', 'failed', 'discovered') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE sitemap_links MODIFY COLUMN status ENUM('pending', 'crawling', 'completed', 'failed') NOT NULL DEFAULT 'pending'");
    }
};
