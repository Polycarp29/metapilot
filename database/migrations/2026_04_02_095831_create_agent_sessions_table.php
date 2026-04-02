<?php

use App\Models\Organization;
use App\Models\User;
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
        Schema::create('agent_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id');
            $table->foreignIdFor(Organization::class);
            $table->foreignIdFor(User::class);
            $table->string('task_type');
            $table->json('message');
            $table->json('context_snapshot');
            $table->json('recommendations');
            $table->enum('status', ['active', 'completed', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_sessions');
    }
};
