<?php

namespace App\Services;

use App\Models\CddSubmission;
use App\Models\Placement;

class CommissionService
{
    private const PLATFORM_FEE_DEFAULT = 20.0; // 20% if compensationType not set

    /**
     * Settle commission when a candidate is marked as hired.
     * Creates a Placement record with computed fee breakdown.
     */
    public function settle(CddSubmission $submission): Placement
    {
        $submission->loadMissing(['mandate.compensationType', 'mandate.client', 'recruiter']);

        $mandate          = $submission->mandate;
        $compensationType = $mandate->compensationType;

        // Compute gross reward based on formula type
        $grossReward = $this->computeGrossReward($submission, $compensationType);

        // Platform fee percentage (from compensation type or default 20%)
        $platformFeePct  = $compensationType?->platform_fee_pct ?? self::PLATFORM_FEE_DEFAULT;
        $platformFee     = $grossReward * ($platformFeePct / 100);
        $netPayout       = $grossReward - $platformFee;

        // Penalty (if timer penalty was applied to this submission)
        $penaltyAmount   = $submission->penalty_applied ? ($submission->days_late ? $this->computePenalty($netPayout, $submission->days_late) : 0) : 0;
        $finalPayout     = max(0, $netPayout - $penaltyAmount);

        $placement = Placement::create([
            'cdd_submission_id'  => $submission->id,
            'mandate_id'         => $mandate->id,
            'recruiter_id'       => $submission->recruiter_id,
            'client_id'          => $mandate->client_id,
            'gross_reward'       => round($grossReward, 2),
            'platform_fee'       => round($platformFee, 2),
            'net_payout'         => round($netPayout, 2),
            'penalty_amount'     => round($penaltyAmount, 2),
            'final_payout'       => round($finalPayout, 2),
            'currency'           => 'SGD',
            'payout_status'      => 'pending',
            'placed_at'          => now(),
        ]);

        return $placement;
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private function computeGrossReward(CddSubmission $submission, $compensationType): float
    {
        if (!$compensationType) {
            return 0.0;
        }

        $fields = $compensationType->formula_fields ?? [];

        return match ($compensationType->formula_type) {
            'percentage' => $this->computePercentage($submission, $fields),
            'fixed'      => (float) ($fields['fixed_amount'] ?? 0),
            'hourly'     => $this->computeHourly($fields),
            'milestone'  => (float) ($fields['hired_amount'] ?? $fields['placed_amount'] ?? 0),
            default      => 0.0,
        };
    }

    private function computePercentage(CddSubmission $submission, array $fields): float
    {
        $rate = (float) ($fields['percentage_rate'] ?? 20.0);

        // Try to get annual salary from candidate or submission
        $candidate = $submission->candidate;
        $annualSalary = 0.0;

        if ($candidate?->expected_salary) {
            $annualSalary = (float) $candidate->expected_salary;
        } elseif ($candidate?->current_salary) {
            $annualSalary = (float) $candidate->current_salary;
        }

        return $annualSalary * ($rate / 100);
    }

    private function computeHourly(array $fields): float
    {
        $rate  = (float) ($fields['hourly_rate']     ?? 0);
        $hours = (float) ($fields['hours_per_week']  ?? 40);
        $weeks = (float) ($fields['engagement_weeks'] ?? 52);
        return $rate * $hours * $weeks;
    }

    private function computePenalty(float $netPayout, int $daysLate): float
    {
        $pct = match (true) {
            $daysLate >= 8 => 30,
            $daysLate >= 7 => 20,
            $daysLate >= 6 => 10,
            default        => 0,
        };
        return $netPayout * ($pct / 100);
    }
}
