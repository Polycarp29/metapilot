<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArchiveController extends Controller
{
    /**
     * The archive DB connection key.
     */
    protected string $connection = 'archive';

    /**
     * GET /api/archive/tables
     * List all archive tables with their row counts and date ranges.
     */
    public function index(): JsonResponse
    {
        $organization = auth()->user()->currentOrganization();
        $tables  = config('security.archive_tables', []);
        $results = [];

        foreach ($tables as $table) {
            try {
                $stats = DB::connection($this->connection)
                    ->table($table)
                    ->where('organization_id', $organization->id)
                    ->selectRaw('COUNT(*) as total, MIN(created_at) as oldest, MAX(created_at) as newest')
                    ->first();

                $results[] = [
                    'table'   => $table,
                    'rows'    => (int) ($stats->total ?? 0),
                    'oldest'  => $stats->oldest ?? null,
                    'newest'  => $stats->newest ?? null,
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'table'  => $table,
                    'rows'   => 0,
                    'oldest' => null,
                    'newest' => null,
                    'error'  => 'Table not accessible',
                ];
            }
        }

        return response()->json([
            'archive_database' => config('database.connections.archive.database'),
            'tables'           => $results,
            'generated_at'     => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/archive/{table}
     * Paginated rows from an archive table.
     *
     * Query params:
     *   from      – start date filter (YYYY-MM-DD)
     *   to        – end date filter (YYYY-MM-DD)
     *   page      – page number (default: 1)
     *   per_page  – rows per page (default: 50, max: 200)
     *   columns   – comma-separated column whitelist
     *   order     – asc|desc (default: desc)
     */
    public function show(Request $request, string $table): JsonResponse
    {
        // Validate table name against allowlist to prevent SQL injection
        $allowedTables = config('security.archive_tables', []);
        if (!in_array($table, $allowedTables, true)) {
            return response()->json([
                'error'   => 'Table not found in archive.',
                'allowed' => $allowedTables,
            ], 404);
        }

        $validated = $request->validate([
            'from'     => ['nullable', 'date'],
            'to'       => ['nullable', 'date'],
            'page'     => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'columns'  => ['nullable', 'string'],
            'order'    => ['nullable', 'in:asc,desc'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 50);
        $order   = $validated['order'] ?? 'desc';
        $organization = auth()->user()->currentOrganization();

        // Build query
        $query = DB::connection($this->connection)
            ->table($table)
            ->where('organization_id', $organization->id);

        if (!empty($validated['from'])) {
            $query->whereDate('created_at', '>=', $validated['from']);
        }

        if (!empty($validated['to'])) {
            $query->whereDate('created_at', '<=', $validated['to']);
        }

        // Column whitelist: validate requested columns against actual schema
        if (!empty($validated['columns'])) {
            $requestedCols  = array_map('trim', explode(',', $validated['columns']));
            $allowedCols    = $this->getTableColumns($table);
            $selectedCols   = array_intersect($requestedCols, $allowedCols);

            if (!empty($selectedCols)) {
                $query->select($selectedCols);
            }
        }

        $query->orderBy('created_at', $order);

        $paginated = $query->paginate($perPage);

        return response()->json([
            'table' => $table,
            'data'  => $paginated->items(),
            'meta'  => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $validated['from'] ?? null,
                'to'           => $validated['to'] ?? null,
            ],
        ]);
    }

    /**
     * GET /api/archive/{table}/stats
     * Aggregated stats for an archive table.
     */
    public function stats(Request $request, string $table): JsonResponse
    {
        $allowedTables = config('security.archive_tables', []);
        if (!in_array($table, $allowedTables, true)) {
            return response()->json(['error' => 'Table not found in archive.'], 404);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date'],
        ]);

        $organization = auth()->user()->currentOrganization();

        $query = DB::connection($this->connection)
            ->table($table)
            ->where('organization_id', $organization->id);

        if (!empty($validated['from'])) {
            $query->whereDate('created_at', '>=', $validated['from']);
        }
        if (!empty($validated['to'])) {
            $query->whereDate('created_at', '<=', $validated['to']);
        }

        $stats = $query->selectRaw(
            'COUNT(*) as total_rows,
             MIN(created_at) as oldest_record,
             MAX(created_at) as newest_record,
             DATEDIFF(MAX(created_at), MIN(created_at)) as date_span_days'
        )->first();

        // Estimate raw size via INFORMATION_SCHEMA
        $sizeInfo = DB::connection($this->connection)->selectOne(
            "SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
             FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
            [config('database.connections.archive.database'), $table]
        );

        return response()->json([
            'table'           => $table,
            'total_rows'      => (int) ($stats->total_rows ?? 0),
            'oldest_record'   => $stats->oldest_record ?? null,
            'newest_record'   => $stats->newest_record ?? null,
            'date_span_days'  => (int) ($stats->date_span_days ?? 0),
            'estimated_size_mb' => (float) ($sizeInfo->size_mb ?? 0),
            'filters_applied' => array_filter($validated),
        ]);
    }

    /**
     * Get the column names for a given archive table.
     */
    protected function getTableColumns(string $table): array
    {
        $archiveDb = config('database.connections.archive.database');

        $columns = DB::connection($this->connection)->select(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION",
            [$archiveDb, $table]
        );

        return array_column($columns, 'COLUMN_NAME');
    }
}
