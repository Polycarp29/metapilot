<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use Inertia\Inertia;

class TeamMemberController extends Controller
{
    /**
     * List organization members.
     */
    public function index()
    {
        $organization = auth()->user()->currentOrganization();
        
        return Inertia::render('Team/Index', [
            'organization' => $organization,
            'members' => $organization->users()->withPivot('role')->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                    'avatar_url' => $user->profile_photo_url, // Assuming standard accessor or null
                ];
            }),
            'invitations' => $organization->invitations()->orderBy('created_at', 'desc')->get(),
            'currentUserRole' => auth()->user()->getRoleIn($organization),
        ]);
    }

    /**
     * Update a member's role.
     */
    public function update(Request $request, User $user) // Note: Routes bound to 'team-member' param, so might need adjust
    {
        // Actually route resource maps {team_member} to User if bound?
        // Let's assume passed ID is organization_user_id or User ID?
        // Standard Resource route: /team-members/{team_member}
        // I'll assume it's User ID passed.
        
        $organization = auth()->user()->currentOrganization();

        if (auth()->user()->getRoleIn($organization) !== 'owner') {
            abort(403, 'Only owners can change roles.');
        }

        // Check if user is in org
        if (!$organization->users()->where('user_id', $request->route('team_member'))->exists()) {
             abort(404, 'User not found in organization.');
        }
        
        $targetUser = $organization->users()->findOrFail($request->route('team_member'));

        $validated = $request->validate([
            'role' => 'required|in:admin,member',
        ]);

        if ($targetUser->id === auth()->id()) {
            abort(403, 'You cannot change your own role.');
        }

        $organization->users()->updateExistingPivot($targetUser->id, ['role' => $validated['role']]);

        auth()->user()->logActivity('member_role_update', "Updated role for {$targetUser->name} to {$validated['role']}", [
            'target_user_id' => $targetUser->id,
            'new_role' => $validated['role']
        ], $organization->id);

        return back()->with('message', 'Member role updated.');
    }

    /**
     * Remove a member from the organization.
     */
    public function destroy($id)
    {
        $organization = auth()->user()->currentOrganization();
        
        // Allow owners and admins to remove members, but admins strictly cannot remove owners or other admins
        $currentUserRole = auth()->user()->getRoleIn($organization);

        if ($currentUserRole === 'member') {
             abort(403, 'You do not have permission to remove members.');
        }

        $targetUser = $organization->users()->findOrFail($id);
        $targetUserRole = $targetUser->pivot->role;

        if ($targetUserRole === 'owner') {
            abort(403, 'The organization owner cannot be removed.');
        }

        if ($currentUserRole === 'admin' && ($targetUserRole === 'admin' || $targetUserRole === 'owner')) {
            abort(403, 'Admins cannot remove other admins or owners.');
        }

        $organization->users()->detach($id);

        auth()->user()->logActivity('member_removal', "Removed member {$targetUser->name} from organization", [
            'target_user_id' => $id,
            'target_user_email' => $targetUser->email
        ], $organization->id);

        return back()->with('message', 'Member removed from organization.');
    }
}
