<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    protected $fillable = [
        'name', 'email', 'password', 'google_id', 'avatar_url', 'role', 'status',
        'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeAdmins($query)
    {
        return $query->whereIn('role', ['admin', 'super_admin']);
    }

    public function scopeRecruiters($query)
    {
        return $query->where('role', 'recruiter');
    }

    // ── Relationships ────────────────────────────────────────────────────────

    public function recruiter()
    {
        return $this->hasOne(Recruiter::class);
    }

    public function client()
    {
        return $this->hasOne(Client::class);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    public function isRecruiter(): bool
    {
        return $this->role === 'recruiter';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }
}
