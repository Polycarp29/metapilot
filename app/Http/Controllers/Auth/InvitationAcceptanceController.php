<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InvitationAcceptanceController extends Controller
{
    /**
     * Show the invitation acceptance page or handle auto-acceptance.
     */
    public function show(string $token)
    {
        $invitation = OrganizationInvitation::where('token', $token)
            ->where('expires_at', '>', now())
            ->whereNull('accepted_at')
            ->firstOrFail();

        $user = User::where('email', $invitation->email)->first();

        // If user already exists and is logged in as that user, auto-accept
        if (Auth::check() && Auth::user()->email === $invitation->email) {
            return $this->accept($invitation, Auth::user());
        }

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
        $invitation = OrganizationInvitation::where('token', $token)
            ->where('expires_at', '>', now())
            ->whereNull('accepted_at')
            ->firstOrFail();

        $request->validate([
            'password' => 'required_if:user_exists,false|string|min:8|confirmed',
            'name' => 'required_if:user_exists,false|string|max:255',
        ]);

        $user = User::where('email', $invitation->email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $request->name,
                'email' => $invitation->email,
                'password' => bcrypt($request->password),
                'email_verified_at' => now(), // Auto-verify since they followed an invite link
            ]);
        }

        return $this->accept($invitation, $user);
    }

    /**
     * Internal accept logic.
     */
    protected function accept(OrganizationInvitation $invitation, User $user)
    {
        $organization = $invitation->organization;

        // Attach user to organization with project restriction if applicable
        $organization->users()->syncWithoutDetaching([
            $user->id => [
                'role' => $invitation->role,
                'project_id' => $invitation->project_id,
            ]
        ]);

        $invitation->accept();

        if (!Auth::check() || Auth::id() !== $user->id) {
            Auth::login($user);
        }

        session(['current_organization_id' => $organization->id]);

        return redirect()->route('dashboard')->with('success', "You have joined {$organization->name}!");
    }
}
