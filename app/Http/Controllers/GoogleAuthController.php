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
            
            // Try to find the user by google_id or email
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

            // Store tokens for analytics integration
            session([
                'google_access_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
            ]);

            // Log user in
            Auth::login($user);

            // Set organization context
            if ($user->organizations()->count() > 1) {
                return redirect()->route('organizations.select');
            }

            if ($organization) {
                session(['current_organization_id' => $organization->id]);
            }

            return redirect()->intended(route('dashboard'));
                
        } catch (\Exception $e) {
            Log::error('Google Auth Failed: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'Google authentication failed.');
        }
    }
}
