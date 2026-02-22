<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $appends = [
        'profile_photo_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the default profile photo URL if no photo has been uploaded.
     *
     * @return string
     */
    public function getProfilePhotoUrlAttribute()
    {
        $name = trim(collect(explode(' ', $this->name))->map(function ($segment) {
            return mb_substr($segment, 0, 1);
        })->join(' '));

        return 'https://ui-avatars.com/api/?name='.urlencode($name).'&color=7F9CF5&background=EBF4FF';
    }

    /**
     * The organizations that the user belongs to.
     */
    public function organizations()
    {
        return $this->belongsToMany(Organization::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Check if the user is an owner of the given organization.
     */
    public function isOwnerOf(Organization $organization): bool
    {
        return $this->getRoleIn($organization) === 'owner';
    }

    /**
     * Check if the user can manage the given organization (owner or admin).
     */
    public function canManage(Organization $organization): bool
    {
        return in_array($this->getRoleIn($organization), ['owner', 'admin']);
    }

    /**
     * Get the user's role in the given organization.
     */
    public function getRoleIn(Organization $organization): ?string
    {
        $pivot = $this->organizations()->where('organization_id', $organization->id)->first();
        return $pivot?->pivot->role;
    }

    /**
     * Get the user's current organization from session.
     */
    public function currentOrganization(): ?Organization
    {
        $organizationId = session('current_organization_id');
        
        if (!$organizationId) {
            return $this->organizations()->first();
        }
        
        return $this->organizations()->find($organizationId);
    }

    /**
     * Check if user belongs to any organization.
     */
    public function hasOrganizations(): bool
    {
        return $this->organizations()->exists();
    }
}
