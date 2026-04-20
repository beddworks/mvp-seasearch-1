# 09 — Feature: Timer Engine
> SeaSearch PRD · v2.0  
> Timer A hardcoded ON · Timer B & C CRUD-configurable, default OFF

---

## Overview

Three parallel timers run from Day 0 (claim.assigned_at).

| Timer | Default | Toggle | Purpose |
|-------|---------|--------|---------|
| A | ON, 3 days | Days configurable | First profile deadline · Reassignment trigger |
| B | OFF, 5 days | Toggle + days | Full 3-profile deadline · Commission penalty |
| C | OFF, 5 day SLA | Toggle + days | Capacity lock until client responds |

**Golden rule:** Timer state is always **computed from timestamps** — never stored as "is_overdue" boolean.

---

## TimerService

```php
// app/Services/TimerService.php
class TimerService
{
    public function __construct(
        private NotificationService $notif
    ) {}

    // ─── TIMER A ────────────────────────────────────────────────────────

    public function checkTimerA(MandateClaim $claim): void
    {
        if ($claim->status !== 'approved' || !$claim->assigned_at) return;

        $mandate    = $claim->mandate;
        $daysSince  = (int) $claim->assigned_at->diffInDays(now());
        $deadline   = $mandate->timer_a_days;     // default 3
        $submittedCount = $this->submittedCount($mandate, $claim->recruiter_id);

        // Day (deadline - 1): reminder — no profiles yet
        if ($daysSince === ($deadline - 1) && $submittedCount === 0) {
            // Only send once — check notification not already sent today
            $alreadySent = Notification::where('user_id', $claim->recruiter->user_id)
                ->where('type', 'timer_a_warning')
                ->whereDate('created_at', today())
                ->where('metadata->mandate_id', $mandate->id)
                ->exists();

            if (!$alreadySent) {
                $this->notif->timerAReminderDay2($claim);
            }
        }

        // Day >= deadline: no first profile submitted → fail
        if ($daysSince >= $deadline && $submittedCount === 0) {
            $this->triggerTimerAFail($claim);
        }
    }

    private function triggerTimerAFail(MandateClaim $claim): void
    {
        $mandate = $claim->mandate;

        DB::transaction(function () use ($claim, $mandate) {
            // Close current claim
            $claim->update([
                'status'     => 'rejected',
                'admin_note' => 'Auto-rejected: Timer A deadline missed — no profile submitted.',
                'reviewed_at'=> now(),
            ]);

            // Free recruiter slot
            $claim->recruiter->decrement('active_mandates_count');

            // Notify recruiter
            $this->notif->timerAFailed($claim);

            // Check if role can be reassigned
            $newCount = $mandate->assignment_count + 1;
            $mandate->increment('assignment_count');

            if ($newCount >= 3) {
                // Drop the role
                $mandate->update(['status' => 'dropped']);
                $this->notif->roleDropped($mandate);
                // Admin notified — they decide whether to send client report
            } else {
                // Return to active pool
                $mandate->update(['status' => 'active']);
                // Notify admin + eligible recruiters
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
        $deadline       = $mandate->timer_b_days;  // default 5
        $submittedCount = $this->submittedCount($mandate, $claim->recruiter_id);

        // Day (deadline - 1): warning if fewer than 2 submitted
        if ($daysSince === ($deadline - 1) && $submittedCount < 2) {
            $alreadySent = Notification::where('user_id', $claim->recruiter->user_id)
                ->where('type', 'timer_b_warning')
                ->whereDate('created_at', today())
                ->where('metadata->mandate_id', $mandate->id)
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

        // Find when the 3rd profile was submitted
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
            default         => (float) $mandate->timer_b_penalty_d8plus,
        };
    }

    // ─── TIMER C ────────────────────────────────────────────────────────

    public function checkTimerC(MandateClaim $claim): void
    {
        $mandate = $claim->mandate;
        if (!$mandate->timer_c_active) return;

        // Find submissions waiting for client response
        $pendingSubmissions = CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $claim->recruiter_id)
            ->whereIn('admin_review_status', ['approved','bypassed'])
            ->where('client_status', 'pending')
            ->where('token_used_at', null)
            ->get();

        foreach ($pendingSubmissions as $submission) {
            $daysSinceForwarded = (int) $submission->submitted_at->diffInDays(now());

            // Day 3: reminder email to client
            if ($daysSinceForwarded === 3) {
                $alreadySent = Notification::where('type', 'client_reminder')
                    ->where('metadata->submission_id', $submission->id)
                    ->whereDate('created_at', today())
                    ->exists();

                if (!$alreadySent) {
                    $this->notif->clientResponseReminder($submission);
                }
            }

            // Day >= SLA: alert admin to manually free slot
            if ($daysSinceForwarded >= $mandate->timer_c_sla_days) {
                $alreadyAlerted = Notification::whereIn('user_id',
                        User::admins()->pluck('id'))
                    ->where('type', 'timer_c_sla_breach')
                    ->where('metadata->submission_id', $submission->id)
                    ->exists();

                if (!$alreadyAlerted) {
                    $this->notif->timerCSlaBreached($submission, $claim);
                }
            }
        }
    }

    // ─── SLOT MANAGEMENT ────────────────────────────────────────────────

    /**
     * Called after client updates submission status.
     * If Timer C is OFF: slot already freed on 3rd CDD submission.
     * If Timer C is ON: slot freed when ALL 3 CDDs have client feedback.
     */
    public function checkAndFreeSlot(Mandate $mandate, string $recruiterId): void
    {
        $claim = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->where('status', 'approved')
            ->first();

        if (!$claim) return;

        if (!$mandate->timer_c_active) {
            // Timer C off: slot was freed when 3rd submission was made
            return;
        }

        // Timer C on: check if all 3 CDDs have client response
        $totalApproved = $this->submittedCount($mandate, $recruiterId);
        if ($totalApproved < 3) return;

        $pendingClientResponse = CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->whereIn('admin_review_status', ['approved','bypassed'])
            ->where('client_status', 'pending')
            ->count();

        if ($pendingClientResponse === 0) {
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

    /**
     * Admin manually frees a slot when Timer C SLA is breached.
     */
    public function adminFreeSlot(MandateClaim $claim, User $admin): void
    {
        $this->freeRecruiterSlot($claim);
        // Log admin action
        activity()->causedBy($admin)->performedOn($claim)->log('admin_freed_slot');
    }

    // ─── HELPER ─────────────────────────────────────────────────────────

    private function submittedCount(Mandate $mandate, string $recruiterId): int
    {
        return CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiterId)
            ->whereNotIn('admin_review_status', ['rejected'])
            ->count();
    }

    // Called after Timer B slot-free (Timer C is OFF)
    public function onThirdSubmission(CddSubmission $submission): void
    {
        $mandate   = $submission->mandate;
        $claim     = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $submission->recruiter_id)
            ->where('status', 'approved')
            ->first();

        if (!$claim) return;

        if (!$mandate->timer_c_active) {
            // Slot frees immediately on 3rd CDD submitted (Timer C off)
            $count = $this->submittedCount($mandate, $submission->recruiter_id);
            if ($count >= 3) {
                $this->freeRecruiterSlot($claim);
            }
        }
        // If Timer C on: slot stays locked, checkTimerC handles it
    }
}
```

---

## TimerCheckJob (Hourly Scheduler)

```php
// app/Jobs/TimerCheckJob.php
class TimerCheckJob implements ShouldQueue
{
    public function handle(TimerService $timerService): void
    {
        // Get all active approved claims
        MandateClaim::with(['mandate.client','recruiter.user'])
            ->where('status','approved')
            ->whereNotNull('assigned_at')
            ->chunk(100, function ($claims) use ($timerService) {
                foreach ($claims as $claim) {
                    // Timer A — always check
                    $timerService->checkTimerA($claim);

                    // Timer B — only if active
                    if ($claim->mandate->timer_b_active) {
                        $timerService->checkTimerB($claim);
                    }

                    // Timer C — only if active
                    if ($claim->mandate->timer_c_active) {
                        $timerService->checkTimerC($claim);
                    }
                }
            });

        // Also check unclaimed roles
        $this->checkUnclaimedRoles();
    }

    private function checkUnclaimedRoles(): void
    {
        Mandate::active()
            ->unclaimed()
            ->whereNotNull('original_post_date')
            ->each(function (Mandate $mandate) {
                $hours = (int) $mandate->original_post_date->diffInHours(now());

                if ($hours >= 72 && $mandate->status !== 'paused') {
                    $mandate->update(['status' => 'paused']);
                    app(NotificationService::class)->roleUnclaimed72h($mandate);
                } elseif ($hours >= 48) {
                    app(NotificationService::class)->roleUnclaimed48h($mandate);
                } elseif ($hours >= 24) {
                    app(NotificationService::class)->notifyEligibleRecruiters($mandate);
                }
            });
    }
}
```

---

## Scheduler Registration

```php
// app/Console/Kernel.php (or bootstrap/app.php in Laravel 13)
use Illuminate\Console\Scheduling\Schedule;

->withSchedule(function (Schedule $schedule) {
    $schedule->job(new TimerCheckJob())->hourly()->withoutOverlapping();
    $schedule->command('seasearch:daily-digest')->dailyAt('09:00');
})
```

---

## Admin Timer Config UI

```php
// Admin/TimerConfigController
public function index(): Response
{
    // Global defaults (used when mandate-level override is null)
    return Inertia::render('Admin/Settings/TimerConfig', [
        'globalConfig' => [
            'timer_a_days'        => config('seasearch.timer_a_days', 3),
            'timer_b_active'      => config('seasearch.timer_b_active', false),
            'timer_b_days'        => config('seasearch.timer_b_days', 5),
            'timer_b_penalty_d6'  => config('seasearch.timer_b_penalty_d6', 0.10),
            'timer_b_penalty_d7'  => config('seasearch.timer_b_penalty_d7', 0.20),
            'timer_b_penalty_d8'  => config('seasearch.timer_b_penalty_d8', 0.30),
            'timer_c_active'      => config('seasearch.timer_c_active', false),
            'timer_c_sla_days'    => config('seasearch.timer_c_sla_days', 5),
        ],
        // Per-mandate overrides table
        'mandatesWithOverrides' => Mandate::active()
            ->whereNotNull('timer_b_active')
            ->with('client')
            ->get(['id','title','timer_a_days','timer_b_active','timer_b_days',
                   'timer_c_active','timer_c_sla_days','client_id']),
    ]);
}
```

---

## SlotService (Missing — now defined)

```php
// app/Services/SlotService.php
class SlotService
{
    public function __construct(private TimerService $timerService) {}

    public function checkAndFreeSlot(Mandate $mandate, string $recruiterId): void
    {
        $this->timerService->checkAndFreeSlot($mandate, $recruiterId);
    }

    public function adminFreeSlot(string $claimId, User $admin): void
    {
        $claim = MandateClaim::findOrFail($claimId);
        $this->timerService->adminFreeSlot($claim, $admin);
    }
}
```

Register in `AppServiceProvider`:
```php
$this->app->singleton(SlotService::class);
```
