<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdCampaign extends Model
{
    protected $fillable = [
        'organization_id',
        'analytics_property_id',
        'google_ads_customer_id',
        'google_campaign_id',
        'name',
        'status',
        'campaign_type',
        'budget_micros',
        'metrics',
        'date_range',
        'synced_at',
    ];

    protected $casts = [
        'metrics' => 'array',
        'budget_micros' => 'integer',
        'synced_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(AnalyticsProperty::class, 'analytics_property_id');
    }
}
