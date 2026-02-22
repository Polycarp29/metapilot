<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationInvitation extends Model
{
    protected $fillable = [
        'organization_id',
        'project_id',
        'invited_by',
        'email',
        'token',
        'role',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    /**
     * Get the organization that owns the invitation.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the project (SEO Campaign) targeted by this invitation.
     */
    public function project()
    {
        return $this->belongsTo(SeoCampaign::class, 'project_id');
    }

    /**
     * Get the user who sent the invitation.
     */
    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Check if the invitation has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the invitation has been accepted.
     */
    public function isAccepted(): bool
    {
        return !is_null($this->accepted_at);
    }

    /**
     * Mark the invitation as accepted.
     */
    public function accept(): void
    {
        $this->update(['accepted_at' => now()]);
    }

    /**
     * Generate a unique invitation token.
     */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }
}
