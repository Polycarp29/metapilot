<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    /**
     * Show the organization selection page.
     */
    public function select()
    {
        $user = auth()->user();
        
        return Inertia::render('Auth/SelectOrganization', [
            'organizations' => $user->organizations
        ]);
    }

    /**
     * Handle the organization selection.
     */
    public function store(Request $request)
    {
        $request->validate([
            'organization_id' => 'required|exists:organizations,id'
        ]);

        $user = auth()->user();
        
        // Ensure user belongs to the organization
        if (!$user->organizations()->where('organization_id', $request->organization_id)->exists()) {
            abort(403);
        }

        session(['current_organization_id' => $request->organization_id]);

        return redirect()->route('dashboard');
    }
}
