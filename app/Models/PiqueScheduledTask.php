<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class PiqueScheduledTask extends Model
{
    protected $fillable = [
        'organization_id',
        'task_type',
        'frequency',
        'run_at',
        'day_of_week',
        'payload',
        'last_run_at',
        'next_run_at',
        'last_run_status',
        'is_active',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
        'day_of_week' => 'integer',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope: tasks that are active and due for execution.
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
     * Standardizes calculation for AI tasks.
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
