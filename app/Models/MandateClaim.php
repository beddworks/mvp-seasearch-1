<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MandateClaim extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'mandate_id', 'recruiter_id', 'status', 'reviewed_by', 'admin_note',
        'reviewed_at', 'rejection_count', 'is_retry', 'assigned_at',
    ];

    protected $casts = [
        'assigned_at'  => 'datetime',
        'reviewed_at'  => 'datetime',
        'is_retry'     => 'boolean',
    ];

    public function mandate()
    {
        return $this->belongsTo(Mandate::class);
    }

    public function recruiter()
    {
        return $this->belongsTo(Recruiter::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function timerBDeadlineAt(): ?\Carbon\Carbon
    {
        if (!$this->assigned_at || !$this->mandate->timer_b_active) return null;
        return $this->assigned_at->addDays($this->mandate->timer_b_days)->endOfDay();
    }
}
