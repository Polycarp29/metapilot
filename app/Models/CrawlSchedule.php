<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class CrawlSchedule extends Model
{
    protected $fillable = [
        'sitemap_id',
        'organization_id',
        'frequency',
        'run_at',
        'day_of_week',
        'is_active',
        'max_depth',
        'last_run_at',
        'next_run_at',
        'last_run_status',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
        'max_depth' => 'integer',
        'day_of_week' => 'integer',
    ];

    public function sitemap()
    {
        return $this->belongsTo(Sitemap::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope: schedules that are active and due for execution.
     */
    public function scopeReady($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('next_run_at')
                  ->orWhere('next_run_at', '<=', now());
            });
    }

    /**
     * Compute the next run timestamp based on frequency.
     */
    public function computeNextRunAt(): Carbon
    {
        $now = now();
        $runAt = $this->run_at ? Carbon::parse($this->run_at) : $now;

        return match ($this->frequency) {
            'hourly'  => $now->copy()->addHour()->startOfHour(),
            'daily'   => $now->copy()->addDay()->setTimeFrom($runAt),
            'weekly'  => $now->copy()->next($this->day_of_week ?? Carbon::MONDAY)->setTimeFrom($runAt),
            'monthly' => $now->copy()->addMonth()->startOfMonth()->setTimeFrom($runAt),
            default   => $now->copy()->addDay(),
        };
    }
}
