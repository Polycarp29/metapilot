<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DatabaseBackupCommand extends Command
{
    protected $signature = 'db:backup
                            {--dry-run : Show what would be done without executing}';

    protected $description = 'Create a compressed mysqldump backup of the primary database';

    public function handle(): int
    {
        $dryRun  = $this->option('dry-run');
        $dbHost  = config('database.connections.mysql.host');
        $dbPort  = config('database.connections.mysql.port');
        $dbName  = config('database.connections.mysql.database');
        $dbUser  = config('database.connections.mysql.username');
        $dbPass  = config('database.connections.mysql.password');

        $backupPath      = config('security.backup_path');
        $retentionDays   = config('security.backup_retention_days', 30);
        $timestamp       = now()->format('Y-m-d_H-i-s');
        $filename        = "{$timestamp}_{$dbName}.sql.gz";
        $fullPath        = "{$backupPath}/{$filename}";

        // Ensure backup directory exists
        if (!is_dir($backupPath)) {
            if (!$dryRun) {
                mkdir($backupPath, 0750, true);
            }
            $this->line("📁 Created backup directory: {$backupPath}");
        }

        if ($dryRun) {
            $this->info("[DRY RUN] Would write backup to: {$fullPath}");
            $this->info("[DRY RUN] Retention: {$retentionDays} days");
            return self::SUCCESS;
        }

        $this->info("🗄️  Starting database backup for [{$dbName}]...");

        // Build mysqldump command — password passed via env var to avoid shell history exposure
        $env     = "MYSQL_PWD=" . escapeshellarg((string) $dbPass);
        $dumpCmd = sprintf(
            '%s mysqldump --single-transaction --quick --lock-tables=false -h %s -P %s -u %s %s | gzip > %s',
            $env,
            escapeshellarg((string) $dbHost),
            escapeshellarg((string) $dbPort),
            escapeshellarg((string) $dbUser),
            escapeshellarg((string) $dbName),
            escapeshellarg($fullPath)
        );

        $output     = [];
        $returnCode = 0;
        exec($dumpCmd . ' 2>&1', $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($fullPath)) {
            $errorMsg = implode("\n", $output);
            $this->error("❌ Backup failed: {$errorMsg}");
            Log::channel('security')->error('DB Backup failed', [
                'database' => $dbName,
                'error'    => $errorMsg,
            ]);
            return self::FAILURE;
        }

        $sizeKb = round(filesize($fullPath) / 1024, 2);
        $this->info("✅ Backup complete: {$filename} ({$sizeKb} KB)");
        Log::channel('security')->info('DB Backup complete', [
            'file'       => $filename,
            'size_kb'    => $sizeKb,
            'database'   => $dbName,
        ]);

        // Prune old backups
        $this->pruneOldBackups($backupPath, $retentionDays);

        return self::SUCCESS;
    }

    /**
     * Delete backup files older than the configured retention period.
     */
    protected function pruneOldBackups(string $backupPath, int $retentionDays): void
    {
        $cutoff  = now()->subDays($retentionDays)->getTimestamp();
        $files   = glob("{$backupPath}/*.sql.gz") ?: [];
        $pruned  = 0;

        foreach ($files as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
                $pruned++;
                $this->line("  🗑️  Pruned old backup: " . basename($file));
            }
        }

        if ($pruned > 0) {
            $this->info("🧹 Pruned {$pruned} backup(s) older than {$retentionDays} days.");
            Log::channel('security')->info("DB Backup pruner removed {$pruned} old file(s)");
        }
    }
}
