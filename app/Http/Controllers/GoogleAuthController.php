<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\AnalyticsProperty;
use Illuminate\Support\Facades\Log;

use App\Models\User;
use App\Services\AuthService;
use Illuminate\Support\Facades\Auth;

class GoogleAuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/analytics.readonly',
                'https://www.googleapis.com/auth/webmasters.readonly',
                'openid',
                'profile',
                'email'
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            $currentUser = Auth::user();
            
            if ($currentUser) {
                // User is already logged in, just connecting their Google account
                if (!$currentUser->google_id) {
                    $currentUser->update([
                        'google_id' => $googleUser->id,
                        'avatar' => $googleUser->avatar,
                    ]);
                }
                $user = $currentUser;
                $organization = $user->currentOrganization();
            } else {
                // Guest is logging in or registering
                $user = User::where('google_id', $googleUser->id)
                    ->orWhere('email', $googleUser->email)
                    ->first();

                if (!$user) {
                    // Register new user via Google
                    [$user, $organization] = $this->authService->registerUser([
                        'name' => $googleUser->name,
                        'email' => $googleUser->email,
                        'google_id' => $googleUser->id,
                        'avatar' => $googleUser->avatar,
                    ], true);
                } else {
                    // Update existing user if they don't have google_id linked yet
                    if (!$user->google_id) {
                        $user->update([
                            'google_id' => $googleUser->id,
                            'avatar' => $googleUser->avatar,
                        ]);
                    }
                    
                    $organization = $user->organizations()->first();
                }

                // Log user in
                Auth::login($user);
            }

            // Store tokens for analytics integration (needed by AnalyticsPropertyController)
            session([
                'google_access_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
            ]);

            // Set organization context if not already set
            if ($organization && !session('current_organization_id')) {
                session(['current_organization_id' => $organization->id]);
            }

            // Redirect based on whether it was a connection or a login
            if ($currentUser) {
                return redirect()->route('organization.settings', ['tab' => 'analytics'])
                    ->with('message', 'Google account connected! You can now add your GA4 property.');
            }

            // Set organization context
            if ($user->organizations()->count() > 1 && !session('current_organization_id')) {
                return redirect()->route('organizations.select');
            }

            return redirect()->intended(route('dashboard'));
                
        } catch (\Exception $e) {
            Log::error('Google Auth Failed: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'Google authentication failed.');
        }
    }
}
