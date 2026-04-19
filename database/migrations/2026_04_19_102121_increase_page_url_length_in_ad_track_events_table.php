<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * page_url was VARCHAR(255) which is too short for URLs containing
     * large tracking parameters like ttclid, fbclid, etc. Changed to TEXT.
     * gclid also changed to TEXT for the same reason (gclid values can be
     * very long). MySQL cannot index TEXT columns without a prefix length,
     * so we drop the plain indexes first and recreate them with a 191-char
     * prefix (safe for utf8mb4 without ROW_FORMAT=DYNAMIC issues).
     */
    public function up(): void
    {
        $this->dropIndexIfExists('ad_track_events', 'idx_page_url');
        $this->dropIndexIfExists('ad_track_events', 'ad_track_events_gclid_index');

        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->text('page_url')->nullable()->change();
            $table->text('gclid')->nullable()->change();
        });

        // Recreate both indexes with a 191-char prefix (TEXT columns require this in MySQL/MariaDB).
        $this->addIndexIfMissing('ad_track_events', 'idx_page_url', 'page_url', 191);
        $this->addIndexIfMissing('ad_track_events', 'ad_track_events_gclid_index', 'gclid', 191);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropIndexIfExists('ad_track_events', 'idx_page_url');
        $this->dropIndexIfExists('ad_track_events', 'ad_track_events_gclid_index');

        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->string('page_url')->nullable()->change();
            $table->string('gclid')->nullable()->change();
        });

        // Restore original plain indexes
        Schema::table('ad_track_events', function (Blueprint $table) {
            $table->index(['page_url'], 'idx_page_url');
            $table->index(['gclid'], 'ad_track_events_gclid_index');
        });
    }

    /**
     * Drop an index only if it currently exists.
     */
    private function dropIndexIfExists(string $table, string $index): void
    {
        $db = DB::connection()->getDatabaseName();
        $exists = DB::table('information_schema.STATISTICS')
            ->where('TABLE_SCHEMA', $db)
            ->where('TABLE_NAME', $table)
            ->where('INDEX_NAME', $index)
            ->exists();

        if ($exists) {
            DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$index}`");
        }
    }

    /**
     * Add a prefixed index only if it does not already exist.
     */
    private function addIndexIfMissing(string $table, string $index, string $column, int $prefix): void
    {
        $db = DB::connection()->getDatabaseName();
        $exists = DB::table('information_schema.STATISTICS')
            ->where('TABLE_SCHEMA', $db)
            ->where('TABLE_NAME', $table)
            ->where('INDEX_NAME', $index)
            ->exists();

        if (! $exists) {
            DB::statement("ALTER TABLE `{$table}` ADD INDEX `{$index}` (`{$column}`({$prefix}))");
        }
    }
};
