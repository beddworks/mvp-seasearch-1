<?php

namespace App\Services;

use App\Models\CddSubmission;
use App\Models\MandateClaim;
use App\Models\Placement;
use Illuminate\Support\Facades\DB;

class CommissionService
{
    public function __construct(
        private TimerService $timerService,
        private NotificationService $notif
    ) {}

    private const PLATFORM_FEE_DEFAULT = 0.20; // 20% as a decimal fraction

    /**
     * Calculate commission breakdown WITHOUT persisting — used for previews.
     */
    public function calculate(CddSubmission $submission): array
    {
        $submission->loadMissing(['mandate.compensationType', 'mandate.client', 'recruiter']);
        $mandate   = $submission->mandate;
        $recruiter = $submission->recruiter;
        $compType  = $mandate->compensationType;

        // 1. Gross reward
        $grossReward = $this->computeGrossReward($submission, $compType);

        // 2. Platform fee (fraction, e.g. 0.20)
        $platformFeePct = $compType ? (float) $compType->platform_fee_pct : self::PLATFORM_FEE_DEFAULT;
        $platformFee    = $grossReward * $platformFeePct;
        $netPayout      = $grossReward - $platformFee;

        // 3. Tier modifier
        $tierModifier = match ($recruiter->tier) {
            'senior' => 0.05,
            'elite'  => 0.10,
            default  => 0.00,
        };
        $netPayout = $netPayout * (1 + $tierModifier);

        // 4. Timer B penalty
        $claim      = MandateClaim::where('mandate_id', $mandate->id)
                        ->where('recruiter_id', $recruiter->id)
                        ->where('status', 'approved')
                        ->first();
        $penaltyPct = $claim ? $this->timerService->calculatePenalty($claim) : 0.0;
        $penaltyAmt = $netPayout * $penaltyPct;
        $finalPayout = max(0, $netPayout - $penaltyAmt);

        return [
            'gross_reward'   => round($grossReward, 2),
            'platform_fee'   => round($platformFee, 2),
            'net_payout'     => round($netPayout, 2),
            'penalty_pct'    => $penaltyPct,
            'penalty_amount' => round($penaltyAmt, 2),
            'final_payout'   => round($finalPayout, 2),
            'currency'       => $mandate->salary_currency ?? 'SGD',
            'tier_modifier'  => $tierModifier,
        ];
    }

    /**
     * Settle commission when a candidate is marked as hired.
     * Calls calculate() then persists the Placement record.
     */
    public function settle(CddSubmission $submission): Placement
    {
        $financials = $this->calculate($submission);
        $mandate    = $submission->mandate;
        $recruiter  = $submission->recruiter;

        return DB::transaction(function () use ($submission, $financials, $mandate, $recruiter) {
            $placement = Placement::create([
                'cdd_submission_id' => $submission->id,
                'mandate_id'        => $mandate->id,
                'recruiter_id'      => $recruiter->id,
                'client_id'         => $mandate->client_id,
                'gross_reward'      => $financials['gross_reward'],
                'platform_fee'      => $financials['platform_fee'],
                'net_payout'        => $financials['net_payout'],
                'penalty_amount'    => $financials['penalty_amount'],
                'final_payout'      => $financials['final_payout'],
                'currency'          => $financials['currency'],
                'payout_status'     => 'pending',
                'placed_at'         => now(),
            ]);

            // Update mandate
            $mandate->update(['status' => 'filled']);

            // Update recruiter stats
            $recruiter->decrement('active_mandates_count');
            $recruiter->increment('total_placements');
            $recruiter->increment('total_earnings', $financials['final_payout']);

            // Notify recruiter
            $this->notif->placementConfirmed($placement);

            return $placement;
        });
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
}
