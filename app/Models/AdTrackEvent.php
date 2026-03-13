<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdTrackEvent extends Model
{
    protected $fillable = [
        'organization_id',
        'pixel_site_id',
        'site_token',
        'page_view_id',
        'country_code',
        'city',
        'browser',
        'platform',
        'device_type',
        'screen_resolution',
        'duration_seconds',
        'click_count',
        'google_campaign_id',
        'page_url',
        'referrer',
        'session_id',
        'gclid',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'ip_hash',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'json',
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
