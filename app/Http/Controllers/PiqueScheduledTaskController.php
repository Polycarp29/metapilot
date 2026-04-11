<?php

namespace App\Http\Controllers;

use App\Models\PiqueScheduledTask;
use Illuminate\Http\Request;

class PiqueScheduledTaskController extends Controller
{
    /**
     * Delete a scheduled task.
     */
    public function destroy(PiqueScheduledTask $schedule)
    {
        $organization = auth()->user()->currentOrganization();
        
        // Ensure the task belongs to the user's organization
        if ($schedule->organization_id !== $organization->id) {
            abort(403);
        }

        $schedule->delete();

        return back()->with('message', 'Scheduled task removed successfully.');
    }

    /**
     * Set a scheduled task as active or inactive.
     */
    public function toggle(PiqueScheduledTask $schedule)
    {
        $organization = auth()->user()->currentOrganization();

        if ($schedule->organization_id !== $organization->id) {
            abort(403);
        }

        $schedule->update([
            'is_active' => !$schedule->is_active
        ]);

        return back()->with('message', 'Task status updated.');
    }
}
