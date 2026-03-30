<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CdnError extends Model
{
    protected $fillable = [
        'pixel_site_id',
        'organization_id',
        'page_view_id',
        'url',
        'message',
        'stack',
        'source',
        'line',
        'col',
        'filename',
        'user_agent',
        'ip_hash',
        'load_time_ms',
        'error_type',
        'http_status',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function pixelSite(): BelongsTo
    {
        return $this->belongsTo(PixelSite::class);
    }
}
