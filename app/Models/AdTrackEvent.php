<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdTrackEvent extends Model
{
    protected $fillable = [
        'organization_id',
        'site_token',
        'country_code',
        'city',
        'browser',
        'platform',
        'device_type',
        'screen_resolution',
        'google_campaign_id',
        'page_url',
        'referrer',
        'session_id',
        'gclid',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'ip_hash',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
