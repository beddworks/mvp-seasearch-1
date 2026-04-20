<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mandate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'client_id', 'posted_by_user_id', 'compensation_type_id',
        'title', 'description', 'location', 'seniority', 'industry',
        'contract_type', 'openings_count', 'is_remote',
        'salary_min', 'salary_max', 'salary_currency',
        'reward_min', 'reward_max', 'reward_pct',
        'must_haves', 'nice_to_haves', 'green_flags', 'red_flags',
        'screening_questions', 'ideal_candidates', 'ideal_source_companies',
        'status', 'is_exclusive', 'exclusive_recruiter_id', 'exclusive_expires_at',
        'is_featured', 'is_fast_track',
        'timer_a_days', 'timer_b_active', 'timer_b_days',
        'timer_b_penalty_d6', 'timer_b_penalty_d7', 'timer_b_penalty_d8plus',
        'timer_c_active', 'timer_c_sla_days',
        'gsheet_tab_name', 'published_at', 'original_post_date', 'assignment_count',
    ];

    protected $casts = [
        'must_haves'             => 'array',
        'nice_to_haves'          => 'array',
        'green_flags'            => 'array',
        'red_flags'              => 'array',
        'screening_questions'    => 'array',
        'ideal_candidates'       => 'array',
        'ideal_source_companies' => 'array',
        'is_remote'              => 'boolean',
        'is_exclusive'           => 'boolean',
        'is_featured'            => 'boolean',
        'is_fast_track'          => 'boolean',
        'timer_b_active'         => 'boolean',
        'timer_c_active'         => 'boolean',
        'published_at'           => 'datetime',
        'original_post_date'     => 'datetime',
        'exclusive_expires_at'   => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function compensationType()
    {
        return $this->belongsTo(CompensationType::class);
    }

    public function claims()
    {
        return $this->hasMany(MandateClaim::class);
    }

    public function approvedClaim()
    {
        return $this->hasOne(MandateClaim::class)->where('status', 'approved');
    }

    public function submissions()
    {
        return $this->hasMany(CddSubmission::class);
    }
}
