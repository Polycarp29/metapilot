<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cdn_errors', function (Blueprint $table) {
            // Performance tracking fields
            $table->integer('load_time_ms')->nullable()->after('ip_hash');
            // error_type: 'js_error' | 'slow_load' | 'http_error'
            $table->string('error_type', 30)->nullable()->default('js_error')->after('load_time_ms');
            $table->smallInteger('http_status')->nullable()->after('error_type');
        });
    }

    public function down(): void
    {
        Schema::table('cdn_errors', function (Blueprint $table) {
            $table->dropColumn(['load_time_ms', 'error_type', 'http_status']);
        });
    }
};
