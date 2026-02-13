<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsProperty extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'property_id',
        'website_url',
        'config',
        'is_active',
    ];

    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the organization that owns the analytics property.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
