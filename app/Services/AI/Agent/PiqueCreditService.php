<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;
use App\Models\User;
use App\Models\AIAgent\OrganizationCredit;
use App\Models\AIAgent\CreditTransaction;
use Illuminate\Support\Facades\DB;

class PiqueCreditService
{
    /**
     * Get or create credit record for organization.
     */
    public function getCredits(Organization $organization): OrganizationCredit
    {
        return OrganizationCredit::firstOrCreate(
            ['organization_id' => $organization->id],
            ['balance' => 0, 'total_used' => 0]
        );
    }

    /**
     * Check if organization has enough credits.
     */
    public function hasEnoughCredits(Organization $organization, float $amount): bool
    {
        $credits = $this->getCredits($organization);
        return $credits->balance >= $amount;
    }

    /**
     * Deduct credits for a prompt.
     */
    public function deductCredits(Organization $organization, User $user, float $amount, string $model, string $description = 'Pique Prompt'): bool
    {
        return DB::transaction(function () use ($organization, $user, $amount, $model, $description) {
            $credits = $this->getCredits($organization);

            if ($credits->balance < $amount) {
                return false;
            }

            $credits->decrement('balance', $amount);
            $credits->increment('total_used', $amount);

            CreditTransaction::create([
                'organization_id' => $organization->id,
                'user_id' => $user->id,
                'amount' => -$amount,
                'type' => 'usage',
                'description' => $description,
                'model_used' => $model,
            ]);

            return true;
        });
    }

    /**
     * Add credits to an organization (Top-up).
     */
    public function addCredits(Organization $organization, float $amount, string $description = 'Credit Top-up'): OrganizationCredit
    {
        return DB::transaction(function () use ($organization, $amount, $description) {
            $credits = $this->getCredits($organization);
            $credits->increment('balance', $amount);
            $credits->update(['last_topup_at' => now()]);

            CreditTransaction::create([
                'organization_id' => $organization->id,
                'amount' => $amount,
                'type' => 'topup',
                'description' => $description,
            ]);

            return $credits;
        });
    }
}
