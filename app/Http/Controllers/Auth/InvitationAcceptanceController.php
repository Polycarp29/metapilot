<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InvitationAcceptanceController extends Controller
{
    /**
     * Show the invitation acceptance page or handle auto-acceptance.
     */
    public function show(string $token)
    {
        Log::info("Invitation check: Token received: {$token}");

        $invitation = OrganizationInvitation::where('token', $token)->first();

        if (!$invitation) {
            Log::warning("Invitation 404: Token '{$token}' not found in database.");
            abort(404, 'Invitation not found.');
        }

        if ($invitation->isExpired()) {
            Log::warning("Invitation 404: Token '{$token}' is expired. Email: {$invitation->email}, Expires at: {$invitation->expires_at}");
            abort(404, 'Invitation has expired.');
        }

        if ($invitation->isAccepted()) {
            Log::warning("Invitation 404: Token '{$token}' already accepted. Email: {$invitation->email}, Accepted at: {$invitation->accepted_at}");
            abort(404, 'Invitation has already been accepted.');
        }

        $user = User::where('email', $invitation->email)->first();

        // Do not auto-accept on GET show() to avoid reload loops.
        // The frontend will determine if the user is logged in and matches the invitation email
        // and can then offer an explicit "Accept" action.

        return Inertia::render('Auth/AcceptInvitation', [
            'invitation' => $invitation->load('organization', 'project'),
            'userExists' => !is_null($user),
        ]);
    }

    /**
     * Accept the invitation.
     */
    public function store(Request $request, string $token)
    {
        Log::info("Invitation acceptance initiated for token: {$token}");

        $invitation = OrganizationInvitation::where('token', $token)
            ->where('expires_at', '>', now())
            ->whereNull('accepted_at')
            ->firstOrFail();

        $user = User::where('email', $invitation->email)->first();
        $userExists = !is_null($user);

        $request->validate([
            'name'     => !$userExists ? 'required|string|max:255' : 'nullable|string|max:255',
            'password' => !$userExists ? 'required|string|min:8|confirmed' : 'nullable',
        ]);

        if (!$user) {
            Log::info("Creating new user for invitation acceptance. Email: {$invitation->email}");
            $user = User::create([
                'name' => $request->name,
                'email' => $invitation->email,
                'password' => bcrypt($request->password),
                'email_verified_at' => now(), // Auto-verify since they followed an invite link
            ]);
        } else {
            Log::info("Existing user accepting invitation. Email: {$invitation->email}");
            // Ensure existing users get email_verified_at set if it's null
            if (is_null($user->email_verified_at)) {
                $user->forceFill(['email_verified_at' => now()])->save();
                Log::info("Set email_verified_at for existing user: {$user->email}");
            }
        }

        return $this->accept($invitation, $user);
    }

    /**
     * Internal accept logic.
     */
    protected function accept(OrganizationInvitation $invitation, User $user)
    {
        $organization = $invitation->organization;

        Log::info("Processing invitation acceptance for user '{$user->email}' to organization '{$organization->name}' (ID: {$organization->id})");

        // Attach user to organization with project restriction if applicable
        $organization->users()->syncWithoutDetaching([
            $user->id => [
                'role' => $invitation->role,
                'project_id' => $invitation->project_id,
            ]
        ]);
        Log::info("User '{$user->email}' synced with organization '{$organization->name}'. Role: {$invitation->role}, Project ID: {$invitation->project_id}");

        $invitation->accept();
        Log::info("Invitation '{$invitation->token}' marked as accepted.");

        $user->logActivity('invitation_accepted', "Accepted invitation to join {$organization->name}", [
            'organization_id' => $organization->id,
            'role' => $invitation->role
        ], $organization->id);
        Log::info("Activity logged for user '{$user->email}': invitation_accepted.");

        // Login the user if they are not already logged in or if the logged-in user is different
        if (!Auth::check() || Auth::id() !== $user->id) {
            Auth::login($user);
            Log::info("User '{$user->email}' logged in after invitation acceptance.");
        }

        // Set the current organization in the session AFTER logging in
        session(['current_organization_id' => $organization->id]);
        Log::info("Session 'current_organization_id' set to '{$organization->id}' for user '{$user->email}'.");

        return redirect()->route('dashboard')->with('success', "You have joined {$organization->name}!");
    }
}
