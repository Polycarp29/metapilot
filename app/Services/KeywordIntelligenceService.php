<?php

namespace App\Services;

use App\Models\KeywordIntelligence;
use App\Models\KeywordTrendHistory;
use App\Models\TrendingKeyword;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KeywordIntelligenceService
{
    /**
     * Upsert a keyword into the canonical intelligence registry and history.
     */
    public function upsert(TrendingKeyword $trendingKw): KeywordIntelligence
    {
        return $this->upsertFromDiscovery([
            'keyword' => $trendingKw->keyword,
            'current_interest' => $trendingKw->current_interest,
            'growth_rate' => $trendingKw->growth_rate,
            'niche' => $trendingKw->niche,
            'country_code' => $trendingKw->country_code,
            'related_queries' => $trendingKw->related_queries,
            'serp_data' => $trendingKw->serp_data,
            'origin' => 'serper'
        ]);
    }

    /**
     * Generic upsert from discovery data.
     */
    public function upsertFromDiscovery(array $data): KeywordIntelligence
    {
        return DB::transaction(function () use ($data) {
            $keywordText = strtolower(trim($data['keyword']));
            $interest = $data['current_interest'] ?? 50;
            $velocity = $data['growth_rate'] ?? 0;
            
            // 1. Find or create the canonical entry
            $ki = KeywordIntelligence::firstOrCreate(
                ['keyword' => $keywordText],
                [
                    'language' => 'en',
                    'origin' => $data['origin'] ?? 'system',
                    'category' => $data['niche'] ?? 'Uncategorized',
                    'is_active' => true,
                    'global_score' => $interest,
                    'trend_velocity' => $velocity,
                    'last_seen_at' => now(),
                    'related_queries' => $data['related_queries'] ?? [],
                ]
            );

            // 2. Update rolling metrics if it already existed
            if (!$ki->wasRecentlyCreated) {
                $newScore = ($ki->global_score + $interest) / 2;
                $ki->update([
                    'global_score' => $newScore,
                    'trend_velocity' => $velocity,
                    'last_seen_at' => now(),
                    'is_active' => true,
                    'category' => $ki->category ?: ($data['niche'] ?? null),
                    'related_queries' => array_unique(array_merge($ki->related_queries ?? [], $data['related_queries'] ?? [])),
                ]);
            }

            // 3. Append to trend history
            KeywordTrendHistory::updateOrCreate(
                [
                    'keyword_intelligence_id' => $ki->id,
                    'region' => $data['country_code'] ?: 'GLOBAL',
                    'date' => now()->toDateString(),
                ],
                [
                    'interest_value' => $interest,
                    'trend_velocity' => $velocity,
                    'ads_cpc' => $data['serp_data']['cpc'] ?? null,
                    'competition_score' => $data['serp_data']['competition'] ?? null,
                ]
            );

            // 4. Update the decay status based on recent history
            $this->updateDecayStatus($ki);

            return $ki;
        });
    }

    /**
     * Update the decay status of a keyword based on its history.
     */
    public function updateDecayStatus(KeywordIntelligence $ki): void
    {
        $history = $ki->trendHistory()
            ->orderBy('date', 'desc')
            ->limit(7)
            ->get();

        if ($history->count() < 2) {
            return;
        }

        $latestValue = $history[0]->interest_value;
        $prevValue = $history[1]->interest_value;
        $velocity = $ki->trend_velocity;

        $newStatus = $ki->decay_status;

        // Simplified logic for decay status
        if ($velocity > 20) {
            $newStatus = 'rising';
        } elseif ($velocity < -15) {
            $newStatus = 'decaying';
        } elseif ($latestValue < 5 && $ki->last_seen_at < now()->subDays(14)) {
            $newStatus = 'dormant';
        } elseif ($ki->decay_status === 'dormant' && $latestValue > 30) {
            $newStatus = 'resurgent';
        } else {
            $newStatus = 'stable';
        }

        if ($newStatus !== $ki->decay_status) {
            $ki->update(['decay_status' => $newStatus]);
        }
    }

    /**
     * Build the filtered search query for keyword intelligence.
     */
    public function buildSearchQuery(array $filters = []): Builder
    {
        $query = KeywordIntelligence::query()->with(['trendHistory' => function($q) {
            $q->orderBy('date', 'desc')->limit(30);
        }]);

        if (!empty($filters['niche'])) {
            $query->where('category', $filters['niche']);
        }

        if (!empty($filters['status'])) {
            $query->where('decay_status', $filters['status']);
        }

        if (isset($filters['min_score'])) {
            $query->where('global_score', '>=', $filters['min_score']);
        }

        if (!empty($filters['search'])) {
            $query->where('keyword', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['region'])) {
            $query->whereHas('trendHistory', function($q) use ($filters) {
                $q->where('region', $filters['region']);
            });
        }

        $sortField = $filters['sort_by'] ?? 'global_score';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        return $query;
    }
}
