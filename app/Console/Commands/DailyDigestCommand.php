<?php

namespace App\Console\Commands;

use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\TimerService;
use Illuminate\Console\Command;

class DailyDigestCommand extends Command
{
    protected $signature   = 'seasearch:daily-digest';
    protected $description = 'Send daily admin digest at 9am';

    public function handle(NotificationService $notif, TimerService $timerService): void
    {
        $now = now();

        $digest = [
            // Unclaimed roles
            'unclaimed_24h' => Mandate::active()->unclaimed()
                ->where('original_post_date', '<=', $now->copy()->subHours(24))->count(),
            'unclaimed_48h' => Mandate::active()->unclaimed()
                ->where('original_post_date', '<=', $now->copy()->subHours(48))->count(),
            'unclaimed_72h' => Mandate::active()->unclaimed()
                ->where('original_post_date', '<=', $now->copy()->subHours(72))->count(),

            // Pending approvals
            'pending_claims'      => MandateClaim::where('status', 'pending')->count(),
            'pending_cdd_reviews' => CddSubmission::pendingAdminReview()->count(),

            // Timer A
            'timer_a_due_today' => $this->getTimerADueToday(),
            'timer_a_overdue'   => $this->getTimerAOverdue(),

            // Timer B warnings
            'timer_b_warning' => $this->getTimerBWarning(),

            // Timer C: client SLA breached
            'client_sla_breached' => $this->getClientSlaBreached(),

            // All recruiters at capacity
            'roles_queued_capacity' => Mandate::active()->unclaimed()
                ->whereRaw('(SELECT COUNT(*) FROM recruiters WHERE active_mandates_count < 2) = 0')
                ->count(),
        ];

        if (array_sum($digest) === 0) {
            $this->info('No items to digest today — skipping email.');
            return;
        }

        User::admins()->each(fn($admin) => $notif->sendDailyDigest($admin, $digest));

        $this->info('Daily digest sent to ' . User::admins()->count() . ' admin(s).');
    }

    private function getTimerADueToday(): int
    {
        return MandateClaim::where('status', 'approved')
            ->whereNotNull('assigned_at')
            ->get()
            ->filter(fn($claim) =>
                $claim->timerADeadlineAt()?->isToday() &&
                CddSubmission::where('mandate_id', $claim->mandate_id)
                    ->where('recruiter_id', $claim->recruiter_id)
                    ->whereNotIn('admin_review_status', ['rejected'])
                    ->count() === 0
            )->count();
    }

    private function getTimerAOverdue(): int
    {
        return MandateClaim::where('status', 'approved')
            ->whereNotNull('assigned_at')
            ->get()
            ->filter(fn($claim) =>
                $claim->timerAOverdue() &&
                CddSubmission::where('mandate_id', $claim->mandate_id)
                    ->where('recruiter_id', $claim->recruiter_id)
                    ->count() === 0
            )->count();
    }

    private function getTimerBWarning(): int
    {
        return MandateClaim::where('status', 'approved')
            ->whereNotNull('assigned_at')
            ->whereHas('mandate', fn($q) => $q->where('timer_b_active', true))
            ->get()
            ->filter(function ($claim) {
                $deadline  = $claim->timerBDeadlineAt();
                $daysToGo  = $deadline ? (int) now()->diffInDays($deadline, false) : null;
                $submitted = CddSubmission::where('mandate_id', $claim->mandate_id)
                    ->where('recruiter_id', $claim->recruiter_id)
                    ->whereNotIn('admin_review_status', ['rejected'])
                    ->count();
                return $daysToGo !== null && $daysToGo <= 1 && $submitted < 3;
            })->count();
    }

    private function getClientSlaBreached(): int
    {
        return CddSubmission::whereIn('admin_review_status', ['approved', 'bypassed'])
            ->where('client_status', 'pending')
            ->whereNull('token_used_at')
            ->whereHas('mandate', fn($q) => $q->where('timer_c_active', true))
            ->where('submitted_at', '<=', now()->subDays(5))
            ->count();
    }
}
