<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CdnPageSchema extends Model
{
    use HasFactory;

    protected $fillable = [
        'pixel_site_id',
        'url',
        'url_hash',
        'schema_type',
        'schema_json',
        'is_auto_generated',
        'has_conflict',
        'injected_count',
        'last_injected_at',
    ];

    protected $casts = [
        'schema_json' => 'json',
        'is_auto_generated' => 'boolean',
        'has_conflict' => 'boolean',
        'last_injected_at' => 'datetime',
        'injected_count' => 'integer',
    ];

    public function pixelSite(): BelongsTo
    {
        return $this->belongsTo(PixelSite::class);
    }
}
