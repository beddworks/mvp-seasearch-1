<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\MandateClaim;
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
            'user_id' => $userId,
            'type'    => $type,
            'message' => $message,
            'data'    => $data,
        ]);
    }

    /** Stub — used by admin dashboard for latest activity feed */
    public static function admins(): \Illuminate\Database\Eloquent\Builder
    {
        return AppNotification::whereHas('user', fn($q) =>
            $q->whereIn('role', ['admin', 'super_admin'])
        );
    }
}
