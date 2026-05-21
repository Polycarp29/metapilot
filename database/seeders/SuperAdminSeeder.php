<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@admin.com'],
            [
                'name'              => 'Super Admin',
                'email'             => 'superadmin@admin.com',
                'password'          => Hash::make('Nm643Ppq$$'),
                'is_admin'          => true,
                'is_active'         => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ Super admin seeded successfully.');
    }
}
