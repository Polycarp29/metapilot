<?php

namespace App\Models\AIAgent;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationCredit extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'balance',
        'total_used',
        'last_topup_at',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'total_used' => 'decimal:2',
        'last_topup_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
