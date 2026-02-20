<?php

namespace App\Http\Controllers;

use App\Models\CrawlSchedule;
use App\Models\Sitemap;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrawlScheduleController extends Controller
{
    public function index()
    {
        $organization = auth()->user()->currentOrganization();

        if (!$organization) {
            return redirect()->route('dashboard')->with('error', 'No organization selected.');
        }

        $schedules = CrawlSchedule::where('organization_id', $organization->id)
            ->with('sitemap:id,name,site_url,filename')
            ->orderBy('created_at', 'desc')
            ->get();

        $sitemaps = Sitemap::where('organization_id', $organization->id)
            ->doesntHave('schedule')
            ->select('id', 'name', 'site_url')
            ->get();

        return Inertia::render('Sitemaps/Schedules', [
            'schedules' => $schedules,
            'availableSitemaps' => $sitemaps,
        ]);
    }

    public function store(Request $request)
    {
        $organization = auth()->user()->currentOrganization();

        $validated = $request->validate([
            'sitemap_id' => 'required|exists:sitemaps,id',
            'frequency' => 'required|in:hourly,daily,weekly,monthly',
            'run_at' => 'nullable|date_format:H:i',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'max_depth' => 'nullable|integer|min:1|max:10',
        ]);

        // Verify sitemap belongs to org
        $sitemap = Sitemap::where('id', $validated['sitemap_id'])
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        // Prevent duplicate schedules
        if (CrawlSchedule::where('sitemap_id', $sitemap->id)->exists()) {
            return back()->withErrors(['sitemap_id' => 'This sitemap already has a schedule.']);
        }

        $schedule = CrawlSchedule::create([
            'sitemap_id' => $sitemap->id,
            'organization_id' => $organization->id,
            'frequency' => $validated['frequency'],
            'run_at' => $validated['run_at'] ?? '02:00',
            'day_of_week' => $validated['day_of_week'],
            'max_depth' => $validated['max_depth'] ?? 3,
            'is_active' => true,
            'next_run_at' => now(),
        ]);

        $schedule->update(['next_run_at' => $schedule->computeNextRunAt()]);

        return back()->with('message', 'Crawl schedule created!');
    }

    public function update(Request $request, CrawlSchedule $schedule)
    {
        $organization = auth()->user()->currentOrganization();
        if ($schedule->organization_id !== $organization->id) {
            abort(403);
        }

        $validated = $request->validate([
            'frequency' => 'sometimes|in:hourly,daily,weekly,monthly',
            'run_at' => 'nullable|date_format:H:i',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'max_depth' => 'nullable|integer|min:1|max:10',
            'is_active' => 'sometimes|boolean',
        ]);

        $schedule->update($validated);

        // Recompute next_run_at if frequency or timing changed
        if (isset($validated['frequency']) || isset($validated['run_at']) || isset($validated['day_of_week'])) {
            $schedule->update(['next_run_at' => $schedule->computeNextRunAt()]);
        }

        return back()->with('message', 'Schedule updated!');
    }

    public function destroy(CrawlSchedule $schedule)
    {
        $organization = auth()->user()->currentOrganization();
        if ($schedule->organization_id !== $organization->id) {
            abort(403);
        }

        $schedule->delete();

        return back()->with('message', 'Schedule deleted!');
    }
}
