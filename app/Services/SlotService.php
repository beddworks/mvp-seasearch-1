<?php

namespace App\Services;

use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\Recruiter;
use App\Services\NotificationService;

class SlotService
{
    public function __construct(
        private NotificationService $notificationService,
    ) {}

    /**
     * Check if the mandate is now filled (hired status) and free the recruiter's slot.
     * Called after a client marks a candidate as hired.
     */
    public function checkAndFreeSlot(Mandate $mandate, string $recruiterId): void
    {
        $mandate->loadMissing(['submissions']);

        // Check if any submission for this mandate is in 'hired' status
        $hasHired = $mandate->submissions()
            ->where('client_status', 'hired')
            ->exists();

        if (!$hasHired) {
            return;
        }

        // Close the mandate
        if ($mandate->status !== 'filled') {
            $mandate->update(['status' => 'filled']);
        }

        // Decrement the recruiter's active_mandates_count
        $recruiter = Recruiter::find($recruiterId);
        if ($recruiter && $recruiter->active_mandates_count > 0) {
            $recruiter->decrement('active_mandates_count');
        }

        // Mark the claim as inactive (slot freed)
        MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->where('status', 'approved')
            ->update(['status' => 'completed']);

        // Notify recruiter
        if ($recruiter) {
            $this->notificationService->notify(
                $recruiter->user_id,
                'mandate_filled',
                "🎉 Mandate '{$mandate->title}' has been filled. Your slot has been freed.",
                ['mandate_id' => $mandate->id]
            );
        }
    }

    /**
     * Admin-triggered slot release (e.g. dispute or reassignment).
     */
    public function adminFreeSlot(Mandate $mandate, string $recruiterId): void
    {
        $recruiter = Recruiter::find($recruiterId);

        if ($recruiter && $recruiter->active_mandates_count > 0) {
            $recruiter->decrement('active_mandates_count');
        }

        MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->whereIn('status', ['approved', 'completed'])
            ->update(['status' => 'released']);
    }
}
