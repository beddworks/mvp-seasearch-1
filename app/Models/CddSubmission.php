<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CddSubmission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'mandate_id', 'recruiter_id', 'candidate_id', 'submitted_at', 'recruiter_note',
        'submission_number', 'ai_score', 'score_breakdown', 'ai_summary',
        'green_flags', 'red_flags', 'admin_review_status', 'admin_reviewed_by',
        'admin_reviewed_at', 'admin_note', 'admin_rejection_count', 'exception_bypass',
        'client_status', 'client_status_updated_at', 'client_rejection_reason',
        'interview_date', 'interview_format', 'interview_notes', 'interview_feedback',
        'interview_feedback_stars', 'interview_verdict',
        'token', 'token_created_at', 'token_used_at', 'token_action',
        'gsheet_row_index', 'penalty_applied', 'days_late',
    ];

    protected $casts = [
        'submitted_at'           => 'datetime',
        'admin_reviewed_at'      => 'datetime',
        'client_status_updated_at' => 'datetime',
        'interview_date'         => 'datetime',
        'token_created_at'       => 'datetime',
        'token_used_at'          => 'datetime',
        'score_breakdown'        => 'array',
        'green_flags'            => 'array',
        'red_flags'              => 'array',
        'exception_bypass'       => 'boolean',
    ];

    protected $hidden = ['token'];

    public function mandate()
    {
        return $this->belongsTo(Mandate::class);
    }

    public function recruiter()
    {
        return $this->belongsTo(Recruiter::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function placement()
    {
        return $this->hasOne(Placement::class);
    }

    public function adminReviewer()
    {
        return $this->belongsTo(User::class, 'admin_reviewed_by');
    }

    public function isTokenValid(): bool
    {
        return $this->token
            && is_null($this->token_used_at);
    }
}
