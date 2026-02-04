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
        Schema::create('schema_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_field_id')->nullable()->constrained('schema_fields')->onDelete('cascade');
            $table->string('field_path');
            $table->string('field_type');
            $table->text('field_value')->nullable();
            $table->json('field_config')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['schema_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_fields');
    }
};
