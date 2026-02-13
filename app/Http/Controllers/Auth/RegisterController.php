<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RegisterController extends Controller
{
    /**
     * Show the registration form.
     */
    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle registration request.
     */
    public function store(RegisterRequest $request)
    {
        try {
            DB::beginTransaction();

            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
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

            DB::commit();

            // Log user in
            Auth::login($user);

            // Set organization context
            session(['current_organization_id' => $organization->id]);

            return redirect()->route('dashboard')->with('success', 'Welcome to Metapilot! Your workspace has been created.');
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->withErrors([
                'email' => 'An error occurred during registration. Please try again.'
            ]);
        }
    }
}
