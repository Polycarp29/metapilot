<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PixelSite extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'label',
        'ads_site_token',
        'allowed_domain',
        'pixel_verified_at',
    ];

    protected $casts = [
        'pixel_verified_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($pixelSite) {
            if (!$pixelSite->ads_site_token) {
                $pixelSite->ads_site_token = (string) Str::uuid();
            }
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function adTrackEvents(): HasMany
    {
        return $this->hasMany(AdTrackEvent::class);
    }
}
