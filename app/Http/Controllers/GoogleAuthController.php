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
    public function redirectToGoogle(Request $request)
    {
        if ($request->query('intent') === 'connect') {
            session(['is_connecting_google' => true]);
        }

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
            $isConnecting = session('is_connecting_google');
            session()->forget('is_connecting_google');

            if ($isConnecting) {
                // Reset stale-token flag on all org properties — user just re-authorized
                if ($organization) {
                    \App\Models\AnalyticsProperty::where('organization_id', $organization->id)
                        ->update(['google_token_invalid' => false]);
                }

                return redirect()->route('organization.settings', ['tab' => 'analytics'])
                    ->with('success', '✅ Google account connected! You can now add your GA4 property ID below.');
            }

            return redirect()->intended(route('dashboard'));
                
        } catch (\Exception $e) {
            $isConnecting = session('is_connecting_google');
            session()->forget('is_connecting_google');
            
            Log::error('Google Auth Failed: ' . $e->getMessage());
            
            if ($isConnecting) {
                return redirect()->route('organization.settings', ['tab' => 'analytics'])
                    ->with('error', 'Google connection failed: ' . $e->getMessage());
            }
            
            return redirect()->route('login')->with('error', 'Google authentication failed.');
        }
    }
}
