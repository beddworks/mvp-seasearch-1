<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Placement extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'cdd_submission_id', 'mandate_id', 'recruiter_id', 'client_id',
        'gross_reward', 'platform_fee', 'net_payout', 'penalty_amount', 'final_payout',
        'currency', 'payout_status', 'payout_date', 'stripe_transfer_id',
        'candidate_start_date', 'placed_at',
    ];

    protected $casts = [
        'payout_date'         => 'datetime',
        'placed_at'           => 'datetime',
        'candidate_start_date' => 'date',
    ];

    public function submission()
    {
        return $this->belongsTo(CddSubmission::class, 'cdd_submission_id');
    }

    public function mandate()
    {
        return $this->belongsTo(Mandate::class);
    }

    public function recruiter()
    {
        return $this->belongsTo(Recruiter::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
