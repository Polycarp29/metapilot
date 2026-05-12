<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseArchiveCommand extends Command
{
    protected $signature = 'db:archive
                            {--dry-run : Count eligible rows without moving data}
                            {--table= : Archive a specific table only}
                            {--days= : Override the archive threshold in days}';

    protected $description = 'Stream old rows from the primary database to the archive database';

    public function handle(): int
    {
        $dryRun    = $this->option('dry-run');
        $onlyTable = $this->option('table');
        $threshold = (int) ($this->option('days') ?? config('security.archive_threshold_days', 90));
        $chunkSize = (int) config('security.archive_chunk_size', 500);
        $tables    = config('security.archive_tables', []);
        $cutoff    = now()->subDays($threshold)->toDateTimeString();

        if ($onlyTable) {
            if (!in_array($onlyTable, $tables)) {
                $this->error("Table [{$onlyTable}] is not in the archive_tables config.");
                return self::FAILURE;
            }
            $tables = [$onlyTable];
        }

        // Verify archive DB connection is reachable before touching primary
        try {
            DB::connection('archive')->getPdo();
        } catch (\Exception $e) {
            $this->error("❌ Cannot reach archive database: " . $e->getMessage());
            Log::channel('security')->error('Archive DB unreachable', ['error' => $e->getMessage()]);
            return self::FAILURE;
        }

        $mode = $dryRun ? '[DRY RUN] ' : '';
        $this->info("{$mode}🗄️  Archive engine starting — threshold: {$threshold} days (before {$cutoff})");

        $totalArchived = 0;

        foreach ($tables as $table) {
            $totalArchived += $this->archiveTable($table, $cutoff, $chunkSize, $dryRun);
        }

        $this->info("{$mode}✅ Archive run complete. Total rows processed: {$totalArchived}");
        if (!$dryRun) {
            Log::channel('security')->info('Archive run complete', [
                'threshold_days' => $threshold,
                'total_rows'     => $totalArchived,
                'tables'         => $tables,
            ]);
        }

        return self::SUCCESS;
    }

    /**
     * Archive one table: chunk-INSERT to archive DB, then DELETE from primary.
     */
    protected function archiveTable(string $table, string $cutoff, int $chunkSize, bool $dryRun): int
    {
        // Verify the table has a created_at column
        if (!$this->tableHasColumn($table, 'created_at')) {
            $this->warn("  ⚠️  Skipping [{$table}] — no created_at column.");
            return 0;
        }

        $eligible = DB::table($table)->where('created_at', '<', $cutoff)->count();

        if ($eligible === 0) {
            $this->line("  ✔  [{$table}]: 0 rows eligible. Skipping.");
            return 0;
        }

        $this->line("  📦 [{$table}]: {$eligible} rows eligible for archiving" . ($dryRun ? ' (dry-run)' : ''));

        if ($dryRun) {
            return $eligible;
        }

        $totalMoved = 0;
        $bar        = $this->output->createProgressBar((int) ceil($eligible / $chunkSize));
        $bar->start();

        while (true) {
            // Fetch next chunk from primary DB
            $query = DB::table($table);

            // Special Case: Tables that don't have organization_id natively need a join
            if ($table === 'metric_snapshots' || $table === 'search_console_metrics') {
                $query->join('analytics_properties', "{$table}.analytics_property_id", '=', 'analytics_properties.id')
                    ->select("{$table}.*", 'analytics_properties.organization_id');
            }

            $rows = $query->where("{$table}.created_at", '<', $cutoff)
                ->orderBy("{$table}.id")
                ->limit($chunkSize)
                ->get()
                ->toArray();

            if (empty($rows)) {
                break;
            }

            // Convert stdClass objects to plain arrays for insert
            $rowsArray = array_map(fn($row) => (array) $row, $rows);
            $ids       = array_column($rowsArray, 'id');

            try {
                DB::connection('archive')->table($table)->insert($rowsArray);
                DB::table($table)->whereIn('id', $ids)->delete();
                $totalMoved += count($rowsArray);
                $bar->advance();
            } catch (\Exception $e) {
                $bar->finish();
                $this->newLine();
                $this->error("   Error archiving [{$table}] chunk: " . $e->getMessage());
                Log::channel('security')->error("Archive chunk error for [{$table}]", [
                    'error' => $e->getMessage(),
                    'ids'   => array_slice($ids, 0, 5), // log first 5 IDs for context
                ]);
                break;
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info("   [{$table}]: {$totalMoved} rows archived.");
        Log::channel('security')->info("Table [{$table}] archived", ['rows' => $totalMoved]);

        return $totalMoved;
    }

    /**
     * Check whether a table has a given column (using INFORMATION_SCHEMA).
     */
    protected function tableHasColumn(string $table, string $column): bool
    {
        $dbName = config('database.connections.mysql.database');
        return DB::select(
            "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
            [$dbName, $table, $column]
        ) !== [];
    }
}
