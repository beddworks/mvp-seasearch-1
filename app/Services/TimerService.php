<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TimerService
{
    public function __construct(
        private NotificationService $notif
    ) {}

    // ─── TIMER A ────────────────────────────────────────────────────────

    public function checkTimerA(MandateClaim $claim): void
    {
        if ($claim->status !== 'approved' || !$claim->assigned_at) return;

        $mandate        = $claim->mandate;
        $daysSince      = (int) $claim->assigned_at->diffInDays(now());
        $deadline       = $mandate->timer_a_days;
        $submittedCount = $this->submittedCount($mandate, $claim->recruiter_id);

        if ($daysSince === ($deadline - 1) && $submittedCount === 0) {
            $alreadySent = AppNotification::where('user_id', $claim->recruiter->user_id)
                ->where('type', 'timer_a_warning')
                ->whereDate('created_at', today())
                ->whereJsonContains('metadata', ['mandate_id' => $mandate->id])
                ->exists();
            if (!$alreadySent) {
                $this->notif->timerAReminderDay2($claim);
            }
        }

        if ($daysSince >= $deadline && $submittedCount === 0) {
            $this->triggerTimerAFail($claim);
        }
    }

    private function triggerTimerAFail(MandateClaim $claim): void
    {
        $mandate = $claim->mandate;
        DB::transaction(function () use ($claim, $mandate) {
            $claim->update([
                'status'      => 'rejected',
                'admin_note'  => 'Auto-rejected: Timer A deadline missed — no profile submitted.',
                'reviewed_at' => now(),
            ]);
            $claim->recruiter->decrement('active_mandates_count');
            $this->notif->timerAFailed($claim);
            $newCount = $mandate->assignment_count + 1;
            $mandate->increment('assignment_count');
            if ($newCount >= 3) {
                $mandate->update(['status' => 'dropped']);
                $this->notif->roleDropped($mandate);
            } else {
                $mandate->update(['status' => 'active']);
                $this->notif->roleReturnedToPool($mandate, $newCount);
            }
        });
    }

    // ─── TIMER B ────────────────────────────────────────────────────────

    public function checkTimerB(MandateClaim $claim): void
    {
        $mandate = $claim->mandate;
        if (!$mandate->timer_b_active || !$claim->assigned_at) return;

        $daysSince      = (int) $claim->assigned_at->diffInDays(now());
        $deadline       = $mandate->timer_b_days;
        $submittedCount = $this->submittedCount($mandate, $claim->recruiter_id);

        if ($daysSince === ($deadline - 1) && $submittedCount < 2) {
            $alreadySent = AppNotification::where('user_id', $claim->recruiter->user_id)
                ->where('type', 'timer_b_warning')
                ->whereDate('created_at', today())
                ->whereJsonContains('metadata', ['mandate_id' => $mandate->id])
                ->exists();
            if (!$alreadySent) {
                $this->notif->timerBWarning($claim, $submittedCount);
            }
        }
    }

    public function calculatePenalty(MandateClaim $claim): float
    {
        $mandate = $claim->mandate;
        if (!$mandate->timer_b_active || !$claim->assigned_at) return 0.0;

        $submittedCount = $this->submittedCount($mandate, $claim->recruiter_id);
        if ($submittedCount < 3) return 0.0;

        $thirdSubmission = CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $claim->recruiter_id)
            ->whereNotIn('admin_review_status', ['rejected'])
            ->orderBy('submitted_at')
            ->skip(2)->first();

        if (!$thirdSubmission) return 0.0;

        $deadline = $claim->assigned_at->addDays($mandate->timer_b_days)->endOfDay();
        $daysLate = (int) $deadline->diffInDays($thirdSubmission->submitted_at, false);

        if ($daysLate <= 0) return 0.0;

        return match (true) {
            $daysLate === 1 => (float) $mandate->timer_b_penalty_d6,
            $daysLate === 2 => (float) $mandate->timer_b_penalty_d7,
            default          => (float) $mandate->timer_b_penalty_d8plus,
        };
    }

    // ─── TIMER C ────────────────────────────────────────────────────────

    public function checkTimerC(MandateClaim $claim): void
    {
        $mandate = $claim->mandate;
        if (!$mandate->timer_c_active) return;

        $pending = CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $claim->recruiter_id)
            ->whereIn('admin_review_status', ['approved', 'bypassed'])
            ->where('client_status', 'pending')
            ->whereNull('token_used_at')
            ->get();

        foreach ($pending as $submission) {
            $days = (int) $submission->submitted_at->diffInDays(now());

            if ($days === 3) {
                $sent = AppNotification::whereIn('user_id',
                        User::whereIn('role', ['admin', 'super_admin'])->pluck('id'))
                    ->where('type', 'client_reminder')
                    ->whereDate('created_at', today())
                    ->whereJsonContains('metadata', ['submission_id' => $submission->id])
                    ->exists();
                if (!$sent) {
                    $this->notif->clientResponseReminder($submission);
                }
            }

            if ($days >= $mandate->timer_c_sla_days) {
                $alerted = AppNotification::whereIn('user_id',
                        User::whereIn('role', ['admin', 'super_admin'])->pluck('id'))
                    ->where('type', 'timer_c_sla_breach')
                    ->whereJsonContains('metadata', ['submission_id' => $submission->id])
                    ->exists();
                if (!$alerted) {
                    $this->notif->timerCSlaBreached($submission, $claim);
                }
            }
        }
    }

    // ─── SLOT MANAGEMENT ────────────────────────────────────────────────

    public function checkAndFreeSlot(Mandate $mandate, string $recruiterId): void
    {
        $claim = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->where('status', 'approved')
            ->first();

        if (!$claim || !$mandate->timer_c_active) return;

        $totalApproved = $this->submittedCount($mandate, $recruiterId);
        if ($totalApproved < 3) return;

        $pendingCount = CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->whereIn('admin_review_status', ['approved', 'bypassed'])
            ->where('client_status', 'pending')
            ->count();

        if ($pendingCount === 0) {
            $this->freeRecruiterSlot($claim);
        }
    }

    public function freeRecruiterSlot(MandateClaim $claim): void
    {
        if ($claim->recruiter->active_mandates_count > 0) {
            $claim->recruiter->decrement('active_mandates_count');
            $this->notif->slotFreed($claim);
        }
    }

    public function adminFreeSlot(MandateClaim $claim, User $admin): void
    {
        $this->freeRecruiterSlot($claim);
    }

    public function onThirdSubmission(CddSubmission $submission): void
    {
        $mandate = $submission->mandate;
        $claim   = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $submission->recruiter_id)
            ->where('status', 'approved')
            ->first();

        if (!$claim) return;

        if (!$mandate->timer_c_active) {
            $count = $this->submittedCount($mandate, $submission->recruiter_id);
            if ($count >= 3) {
                $this->freeRecruiterSlot($claim);
            }
        }
    }

    // ─── HELPER ─────────────────────────────────────────────────────────

    private function submittedCount(Mandate $mandate, string $recruiterId): int
    {
        return CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->whereNotIn('admin_review_status', ['rejected'])
            ->count();
    }
}
