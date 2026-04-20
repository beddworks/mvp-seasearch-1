<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'recruiter_id', 'first_name', 'last_name', 'email', 'phone',
        'linkedin_url', 'current_role', 'current_company', 'location',
        'years_experience', 'cv_url', 'cv_original_name', 'cv_uploaded_at',
        'cv_parsed_at', 'parsed_profile', 'skills', 'notes',
    ];

    protected $casts = [
        'parsed_profile' => 'array',
        'skills'         => 'array',
        'cv_uploaded_at' => 'datetime',
        'cv_parsed_at'   => 'datetime',
    ];

    public function recruiter()
    {
        return $this->belongsTo(Recruiter::class);
    }

    public function submissions()
    {
        return $this->hasMany(CddSubmission::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
