<?php

namespace App\Services;

use App\Models\User;
use App\Models\Organization;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Register a new user and create their personal organization.
     */
    public function registerUser(array $data, bool $isSocial = false)
    {
        return DB::transaction(function () use ($data, $isSocial) {
            // Create user
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => isset($data['password']) ? Hash::make($data['password']) : null,
                'google_id' => $data['google_id'] ?? null,
                'avatar' => $data['avatar'] ?? null,
            ]);

            // Auto-create personal organization
            $organization = Organization::create([
                'name' => "{$user->name}'s Workspace",
                'slug' => Str::slug($user->name) . '-' . Str::random(6),
                'description' => 'Personal SEO workspace',
                'settings' => [],
            ]);

            // Attach user as owner
            $organization->users()->attach($user->id, ['role' => 'owner']);

            return [$user, $organization];
        });
    }
}
