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
        $organizations = \App\Models\Organization::all();

        foreach ($organizations as $organization) {
            \App\Models\AIAgent\OrganizationCredit::updateOrCreate(
                ['organization_id' => $organization->id],
                [
                    'balance' => 2000,
                    'total_used' => 0,
                    'last_topup_at' => now(),
                ]
            );

            \App\Models\AIAgent\CreditTransaction::create([
                'organization_id' => $organization->id,
                'amount' => 2000,
                'type' => 'topup',
                'description' => 'Initial credit seed',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No easy way to reverse this cleanly without affecting other transactions, 
        // but we could set balance to 0 if needed.
    }
};
