<?php

namespace App\Jobs;

use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Services\NotificationService;
use App\Services\TimerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class TimerCheckJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(TimerService $timerService, NotificationService $notif): void
    {
        // Process all active approved claims
        MandateClaim::with(['mandate.client', 'recruiter.user'])
            ->where('status', 'approved')
            ->whereNotNull('assigned_at')
            ->chunk(100, function ($claims) use ($timerService) {
                foreach ($claims as $claim) {
                    $timerService->checkTimerA($claim);

                    if ($claim->mandate->timer_b_active) {
                        $timerService->checkTimerB($claim);
                    }

                    if ($claim->mandate->timer_c_active) {
                        $timerService->checkTimerC($claim);
                    }
                }
            });

        // Check unclaimed roles
        $this->checkUnclaimedRoles($notif);
    }

    private function checkUnclaimedRoles(NotificationService $notif): void
    {
        Mandate::where('status', 'active')
            ->whereDoesntHave('claims', fn($q) => $q->whereIn('status', ['pending', 'approved']))
            ->whereNotNull('original_post_date')
            ->each(function (Mandate $mandate) use ($notif) {
                $hours = (int) $mandate->original_post_date->diffInHours(now());

                if ($hours >= 72) {
                    $mandate->update(['status' => 'paused']);
                    $notif->roleUnclaimed48h($mandate); // alert admins as 48h
                } elseif ($hours >= 48) {
                    $notif->roleUnclaimed48h($mandate);
                } elseif ($hours >= 24) {
                    $notif->notifyEligibleRecruiters($mandate);
                }
            });
    }
}
