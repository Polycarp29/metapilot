<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Mail;
use App\Mail\InvitationMailable;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrganizationInvitationController extends Controller
{
    /**
     * Invite a new member to the organization.
     */
    public function store(Request $request)
    {
        $organization = auth()->user()->currentOrganization();

        // Ensure user can manage the organization
        if (auth()->user()->getRoleIn($organization) === 'member') {
            abort(403, 'You do not have permission to invite members.');
        }

        $validated = $request->validate([
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('organization_invitations')->where(function ($query) use ($organization) {
                    return $query->where('organization_id', $organization->id);
                }),
                function ($attribute, $value, $fail) use ($organization) {
                    if ($organization->users()->where('email', $value)->exists()) {
                        $fail('This user is already a member of the organization.');
                    }
                },
            ],
            'role' => 'required|in:admin,member',
            'project_id' => 'nullable|exists:seo_campaigns,id',
        ]);

        $invitation = $organization->invitations()->create([
            'invited_by' => auth()->id(),
            'email' => $validated['email'],
            'role' => $validated['role'],
            'project_id' => $validated['project_id'] ?? null,
            'token' => Str::random(32),
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($validated['email'])->queue(new InvitationMailable($invitation));

        auth()->user()->logActivity('invitation_sent', "Sent invitation to {$validated['email']}", [
            'email' => $validated['email'],
            'role' => $validated['role'],
            'project_id' => $validated['project_id'] ?? null
        ], $organization->id);

        return back()->with('message', 'Invitation sent successfully.');
    }

    /**
     * Cancel an invitation.
     */
    public function destroy(OrganizationInvitation $invitation)
    {
        $organization = auth()->user()->currentOrganization();

        if ($invitation->organization_id !== $organization->id) {
            abort(403);
        }

        if (auth()->user()->getRoleIn($organization) === 'member') {
            abort(403, 'You do not have permission to manage invitations.');
        }

        $email = $invitation->email;
        $invitation->delete();

        auth()->user()->logActivity('invitation_revoked', "Revoked invitation for {$email}", [
            'email' => $email
        ], $organization->id);

        return back()->with('message', 'Invitation cancelled.');
    }
}
