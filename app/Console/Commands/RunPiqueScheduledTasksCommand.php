<?php

namespace App\Console\Commands;

use App\Models\PiqueScheduledTask;
use App\Jobs\ProcessScheduledPiqueTaskJob;
use Illuminate\Console\Command;

class RunPiqueScheduledTasksCommand extends Command
{
    protected $signature = 'pique:run-scheduled';
    protected $description = 'Run due Pique scheduled tasks';

    public function handle(): int
    {
        $dueTasks = PiqueScheduledTask::ready()->get();

        if ($dueTasks->isEmpty()) {
            $this->info('No Pique scheduled tasks due.');
            return 0;
        }

        foreach ($dueTasks as $task) {
            $this->info("Dispatching Pique Task #{$task->id} ({$task->task_type})");
            
            // Update status to prevent double-run while job is in queue
            $task->update([
                'last_run_status' => 'dispatched',
                'last_run_at' => now(),
            ]);

            ProcessScheduledPiqueTaskJob::dispatch($task);
        }

        return 0;
    }
}
