<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recruiter extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'display_name', 'phone', 'linkedin_url', 'bio', 'avatar_url',
        'years_experience', 'current_firm', 'ea_license_number', 'ea_certificate_url',
        'profile_complete', 'recruiter_group', 'recruiter_group_secondary',
        'tier', 'trust_level', 'industries', 'seniority_focus', 'geographies',
        'specialty', 'total_placements', 'total_earnings', 'active_mandates_count',
    ];

    protected $casts = [
        'industries'      => 'array',
        'seniority_focus' => 'array',
        'geographies'     => 'array',
        'profile_complete' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mandateClaims()
    {
        return $this->hasMany(MandateClaim::class);
    }

    public function candidates()
    {
        return $this->hasMany(Candidate::class);
    }

    public function cddSubmissions()
    {
        return $this->hasMany(CddSubmission::class);
    }

    public function placements()
    {
        return $this->hasMany(Placement::class);
    }
}
