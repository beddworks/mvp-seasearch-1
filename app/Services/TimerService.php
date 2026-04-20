<?php

namespace App\Services;

use App\Models\Mandate;
use App\Models\MandateClaim;

class TimerService
{
    public function startTimers(Mandate $mandate, MandateClaim $claim): void
    {
        // Timer A starts at assigned_at (Day 0) — already set by claim approval.
        // Timer B and C are evaluated by cron — nothing to dispatch here yet.
        // Placeholder for Phase 10 timer engine.
    }

    public function checkTimerA(MandateClaim $claim): bool
    {
        return $claim->timerAOverdue();
    }

    public function calculatePenalty(MandateClaim $claim): float
    {
        if (!$claim->mandate->timer_b_active) {
            return 0.0;
        }

        $days = $claim->daysSinceAssignment();

        if ($days >= 8) {
            return (float) ($claim->mandate->timer_b_penalty_d8plus ?? 30);
        }
        if ($days >= 7) {
            return (float) ($claim->mandate->timer_b_penalty_d7 ?? 20);
        }
        if ($days >= 6) {
            return (float) ($claim->mandate->timer_b_penalty_d6 ?? 10);
        }

        return 0.0;
    }
}
