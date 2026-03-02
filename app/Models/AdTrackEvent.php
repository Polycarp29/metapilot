<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdTrackEvent extends Model
{
    protected $fillable = [
        'organization_id',
        'site_token',
        'google_campaign_id',
        'page_url',
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
