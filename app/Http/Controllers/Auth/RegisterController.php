<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

use App\Services\AuthService;

class RegisterController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

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
            [$user, $organization] = $this->authService->registerUser($request->validated());

            // Log user in
            Auth::login($user);

            // Fire registered event for email verification
            event(new Registered($user));

            // Set organization context
            session(['current_organization_id' => $organization->id]);

            return redirect()->route('dashboard')->with('success', 'Welcome to Metapilot! Your workspace has been created.');
        } catch (\Exception $e) {
            return back()->withErrors([
                'email' => 'An error occurred during registration. Please try again.'
            ]);
        }
    }
}
