<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\Placement;
use App\Models\Recruiter;
use App\Models\User;

class NotificationService
{
    public function claimApproved(MandateClaim $claim): void
    {
        $this->notify(
            $claim->recruiter->user_id,
            'claim_approved',
            "Your claim for \"{$claim->mandate->title}\" was approved. Day 0 has started.",
            ['mandate_id' => $claim->mandate_id, 'claim_id' => $claim->id]
        );
    }

    public function claimRejected(MandateClaim $claim, string $reason): void
    {
        $this->notify(
            $claim->recruiter->user_id,
            'claim_rejected',
            "Your claim for \"{$claim->mandate->title}\" was rejected: {$reason}",
            ['mandate_id' => $claim->mandate_id, 'claim_id' => $claim->id]
        );
    }

    public function recruiterApproved(Recruiter $recruiter): void
    {
        $this->notify(
            $recruiter->user_id,
            'recruiter_approved',
            'Your Sea Search account has been approved. You can now browse and pick roles.',
            ['recruiter_id' => $recruiter->id]
        );
    }

    public function recruiterSuspended(Recruiter $recruiter, string $reason): void
    {
        $this->notify(
            $recruiter->user_id,
            'account_suspended',
            "Your account has been suspended: {$reason}",
            ['recruiter_id' => $recruiter->id]
        );
    }

    public function cddApproved(mixed $submission): void
    {
        $this->notify(
            $submission->recruiter->user_id,
            'cdd_approved',
            "Your CDD submission for \"{$submission->candidate->full_name}\" has been approved and sent to the client.",
            ['submission_id' => $submission->id]
        );
    }

    public function cddRejected(mixed $submission, string $reason): void
    {
        $this->notify(
            $submission->recruiter->user_id,
            'cdd_rejected',
            "Your CDD for \"{$submission->candidate->full_name}\" was rejected: {$reason}",
            ['submission_id' => $submission->id]
        );
    }

    public function clientFeedbackReceived(mixed $submission): void
    {
        $candidateName = $submission->candidate->first_name . ' ' . $submission->candidate->last_name;

        // Notify recruiter
        $this->notify(
            $submission->recruiter->user_id,
            'client_feedback_received',
            "Client updated status for {$candidateName}: {$submission->client_status}",
            ['submission_id' => $submission->id]
        );

        // Notify admins
        $this->notifyAdmins(
            'client_feedback_received',
            "Client feedback: {$candidateName} → {$submission->client_status} (mandate: {$submission->mandate->title})",
            ['submission_id' => $submission->id]
        );
    }

    public function notifyAdmins(string $type, string $message, array $data = []): void
    {
        $admins = User::whereIn('role', ['admin', 'super_admin'])->get();
        foreach ($admins as $admin) {
            $this->notify($admin->id, $type, $message, $data);
        }
    }

    private function notify(string $userId, string $type, string $message, array $data = []): void
    {
        AppNotification::create([
            'user_id'  => $userId,
            'type'     => $type,
            'title'    => $message,
            'metadata' => $data,
        ]);
    }

    // ─── TIMER NOTIFICATIONS ─────────────────────────────────────────────

    public function timerAReminderDay2(MandateClaim $claim): void
    {
        $this->notify(
            $claim->recruiter->user_id,
            'timer_a_warning',
            "Deadline approaching: submit at least 1 profile for \"{$claim->mandate->title}\" by tomorrow.",
            ['mandate_id' => $claim->mandate_id, 'claim_id' => $claim->id]
        );
    }

    public function timerAFailed(MandateClaim $claim): void
    {
        $this->notify(
            $claim->recruiter->user_id,
            'timer_a_failed',
            "Your assignment for \"{$claim->mandate->title}\" was auto-closed — no profile submitted within the deadline.",
            ['mandate_id' => $claim->mandate_id, 'claim_id' => $claim->id]
        );
    }

    public function roleDropped(Mandate $mandate): void
    {
        $this->notifyAdmins(
            'role_dropped',
            "Role \"{$mandate->title}\" has been dropped after 3 failed assignments.",
            ['mandate_id' => $mandate->id]
        );
    }

    public function roleReturnedToPool(Mandate $mandate, int $assignmentCount): void
    {
        $this->notifyAdmins(
            'role_returned_to_pool',
            "Role \"{$mandate->title}\" returned to pool (attempt {$assignmentCount}/3).",
            ['mandate_id' => $mandate->id, 'assignment_count' => $assignmentCount]
        );
    }

    public function timerBWarning(MandateClaim $claim, int $submittedCount): void
    {
        $this->notify(
            $claim->recruiter->user_id,
            'timer_b_warning',
            "Timer B: Only {$submittedCount}/3 profiles submitted for \"{$claim->mandate->title}\". Deadline is tomorrow — late submission incurs a commission penalty.",
            ['mandate_id' => $claim->mandate_id, 'claim_id' => $claim->id]
        );
    }

    public function clientResponseReminder(CddSubmission $submission): void
    {
        $name = $submission->candidate->full_name ?? 'candidate';
        $this->notifyAdmins(
            'client_reminder',
            "Client has not responded to \"{$name}\" submission for \"{$submission->mandate->title}\" (3 days pending).",
            ['submission_id' => $submission->id, 'mandate_id' => $submission->mandate_id]
        );
    }

    public function timerCSlaBreached(CddSubmission $submission, MandateClaim $claim): void
    {
        $this->notifyAdmins(
            'timer_c_sla_breach',
            "Timer C SLA breached: client has not responded to candidate submission for \"{$submission->mandate->title}\". Manual slot release may be needed.",
            ['submission_id' => $submission->id, 'claim_id' => $claim->id, 'mandate_id' => $submission->mandate_id]
        );
    }

    public function slotFreed(MandateClaim $claim): void
    {
        $this->notify(
            $claim->recruiter->user_id,
            'slot_freed',
            "Your slot for \"{$claim->mandate->title}\" has been freed. You can now pick a new role.",
            ['mandate_id' => $claim->mandate_id, 'claim_id' => $claim->id]
        );
    }

    public function roleUnclaimed24h(Mandate $mandate): void
    {
        $this->notifyAdmins(
            'role_unclaimed_24h',
            "Role \"{$mandate->title}\" has been unclaimed for 24 hours.",
            ['mandate_id' => $mandate->id]
        );
    }

    public function roleUnclaimed48h(Mandate $mandate): void
    {
        $this->notifyAdmins(
            'role_unclaimed_48h',
            "Role \"{$mandate->title}\" has been unclaimed for 48 hours.",
            ['mandate_id' => $mandate->id]
        );
    }

    public function notifyEligibleRecruiters(Mandate $mandate): void
    {
        // Notify recruiters who have capacity (active_mandates_count < 2)
        $eligible = Recruiter::where('active_mandates_count', '<', 2)
            ->whereHas('user', fn($q) => $q->where('status', 'active'))
            ->get();

        foreach ($eligible as $recruiter) {
            $this->notify(
                $recruiter->user_id,
                'new_role_available',
                "New role available: \"{$mandate->title}\" — pick it before it's gone!",
                ['mandate_id' => $mandate->id]
            );
        }
    }

    public function placementConfirmed(Placement $placement): void
    {
        $currency    = $placement->currency ?? 'SGD';
        $finalPayout = number_format((float) $placement->final_payout, 0);
        $title       = $placement->mandate->title ?? 'a role';
        $this->notify(
            $placement->recruiter->user_id,
            'placement_confirmed',
            "Placement confirmed for \"{$title}\" \u2014 {$currency} {$finalPayout} added to your balance.",
            ['placement_id' => $placement->id, 'mandate_id' => $placement->mandate_id]
        );
        $this->notifyAdmins(
            'placement_confirmed',
            "New placement: \"{$title}\" \u2014 {$currency} {$finalPayout} commission.",
            ['placement_id' => $placement->id]
        );
    }

    public function payoutRequested(Recruiter $recruiter, float $amount): void
    {
        $formatted = number_format($amount, 0);
        $this->notify(
            $recruiter->user_id,
            'payout_requested',
            "Payout request of SGD {$formatted} submitted. Processing in 2\u20133 business days.",
            ['recruiter_id' => $recruiter->id, 'amount' => $amount]
        );
        $this->notifyAdmins(
            'payout_requested',
            "Recruiter {$recruiter->user->name} requested a payout of SGD {$formatted}.",
            ['recruiter_id' => $recruiter->id, 'amount' => $amount]
        );
    }

    public function payoutProcessed(Placement $placement): void
    {
        $formatted = number_format((float) $placement->final_payout, 0);
        $currency  = $placement->currency ?? 'SGD';
        $this->notify(
            $placement->recruiter->user_id,
            'payout_processed',
            "{$currency} {$formatted} has been transferred to your bank account.",
            ['placement_id' => $placement->id]
        );
    }

    public function newClaimPending(MandateClaim $claim): void
    {
        $this->notifyAdmins(
            'claim_pending',
            "{$claim->recruiter->user->name} has claimed \"{$claim->mandate->title}\" and is awaiting approval.",
            ['claim_id' => $claim->id, 'mandate_id' => $claim->mandate_id]
        );
    }

    public function cddPendingAdminReview(CddSubmission $sub): void
    {
        $name = $sub->candidate->first_name . ' ' . $sub->candidate->last_name;
        $this->notifyAdmins(
            'cdd_pending',
            "{$sub->recruiter->user->name} submitted {$name} for \"{$sub->mandate->title}\" — awaiting review.",
            ['submission_id' => $sub->id]
        );
    }

    public function cddSlotBurned(CddSubmission $sub): void
    {
        $name = $sub->candidate->first_name . ' ' . $sub->candidate->last_name;
        $this->notify(
            $sub->recruiter->user_id,
            'cdd_slot_burned',
            "{$name} has been rejected twice for \"{$sub->mandate->title}\". Please source and submit a new candidate.",
            ['submission_id' => $sub->id, 'mandate_id' => $sub->mandate_id]
        );
    }

    public function roleUnclaimed72h(Mandate $mandate): void
    {
        $this->notifyAdmins(
            'role_unclaimed_72h',
            "Role \"{$mandate->title}\" auto-paused after 72 hours without a recruiter. Manual intervention required.",
            ['mandate_id' => $mandate->id]
        );
    }

    public function sendDailyDigest(User $user, array $digest): void
    {
        \Illuminate\Support\Facades\Mail::to($user->email)
            ->queue(new \App\Mail\AdminDailyDigestMail($user, $digest));
    }

    /** Used by admin activity feed */
    public static function admins(): \Illuminate\Database\Eloquent\Builder
    {
        return AppNotification::whereHas('user', fn($q) =>
            $q->whereIn('role', ['admin', 'super_admin'])
        );
    }
}
