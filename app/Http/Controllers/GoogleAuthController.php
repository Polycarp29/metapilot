<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\AnalyticsProperty;
use Illuminate\Support\Facades\Log;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/analytics.readonly',
                'https://www.googleapis.com/auth/webmasters.readonly',
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
            $user = Socialite::driver('google')->user();
            
            // This is a simple implementation: we store the tokens in the session 
            // and then use them when the user creates/updates a property.
            // Or we could list properties here.
            
            session([
                'google_access_token' => $user->token,
                'google_refresh_token' => $user->refreshToken,
                'google_token_expires_at' => now()->addSeconds($user->expiresIn),
            ]);

            return redirect()->route('organization.settings', ['tab' => 'analytics'])
                ->with('message', 'Google account connected. You can now select a property.');
                
        } catch (\Exception $e) {
            Log::error('Google Auth Failed: ' . $e->getMessage());
            return redirect()->route('analytics.index')->with('error', 'Google authentication failed.');
        }
    }
}
