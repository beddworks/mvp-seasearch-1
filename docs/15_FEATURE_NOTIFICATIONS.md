# 15 — Feature: Notifications & Daily Digest
> SeaSearch PRD · v2.0

---

## NotificationService — Complete

```php
// app/Services/NotificationService.php
class NotificationService
{
    // ── CORE ──────────────────────────────────────────────────────────────

    private function create(
        User $user,
        string $type,
        string $title,
        string $body,
        string $actionUrl,
        array $metadata = [],
        bool $sendEmail = false
    ): Notification {
        $notif = Notification::create([
            'user_id'    => $user->id,
            'type'       => $type,
            'title'      => $title,
            'body'       => $body,
            'action_url' => $actionUrl,
            'metadata'   => $metadata,
        ]);

        if ($sendEmail) {
            Mail::to($user->email)
                ->queue(new SystemNotificationMail($title, $body, $actionUrl));
        }

        return $notif;
    }

    private function notifyAllAdmins(string $type, string $title, string $body, string $url, array $meta = []): void
    {
        User::admins()->each(fn($admin) =>
            $this->create($admin, $type, $title, $body, $url, $meta)
        );
    }

    // ── AUTH ──────────────────────────────────────────────────────────────

    public function recruiterApproved(Recruiter $recruiter): void
    {
        $this->create(
            $recruiter->user, 'account_approved',
            'Account approved — welcome to Sea Search!',
            'You can now browse roles and start submitting candidates.',
            route('recruiter.mandates.index'),
            [], true
        );
    }

    public function recruiterSuspended(Recruiter $recruiter, string $reason): void
    {
        $this->create(
            $recruiter->user, 'account_suspended',
            'Account suspended',
            "Your account has been suspended. Reason: {$reason}",
            route('login'),
            ['reason' => $reason], true
        );
    }

    // ── CLAIMS ────────────────────────────────────────────────────────────

    public function newClaimPending(MandateClaim $claim): void
    {
        $this->notifyAllAdmins(
            'claim_pending',
            'New role claim pending approval',
            "{$claim->recruiter->displayName()} has claimed {$claim->mandate->title} at {$claim->mandate->client->company_name}.",
            route('admin.claims.index'),
            ['claim_id' => $claim->id, 'mandate_id' => $claim->mandate_id]
        );
    }

    public function claimApproved(MandateClaim $claim): void
    {
        $this->create(
            $claim->recruiter->user, 'claim_approved',
            "Role claim approved — Day 0 starts now!",
            "Your claim for {$claim->mandate->title} at {$claim->mandate->client->company_name} has been approved. Submit your first candidate within {$claim->mandate->timer_a_days} days.",
            route('recruiter.mandates.workspace', $claim->mandate_id),
            ['claim_id' => $claim->id, 'mandate_id' => $claim->mandate_id],
            true
        );
    }

    public function claimRejected(MandateClaim $claim): void
    {
        $this->create(
            $claim->recruiter->user, 'claim_rejected',
            "Role claim not approved",
            "Your claim for {$claim->mandate->title} was not approved. " .
            ($claim->admin_note ? "Reason: {$claim->admin_note}" : 'Please contact admin for details.') .
            " You may submit a new claim.",
            route('recruiter.mandates.index'),
            ['claim_id' => $claim->id],
            true
        );
    }

    // ── CDD SUBMISSIONS ───────────────────────────────────────────────────

    public function cddPendingAdminReview(CddSubmission $sub): void
    {
        $this->notifyAllAdmins(
            'cdd_pending',
            'Candidate submission needs review',
            "{$sub->recruiter->displayName()} submitted {$sub->candidate->first_name} {$sub->candidate->last_name} for {$sub->mandate->title}.",
            route('admin.submissions.index'),
            ['submission_id' => $sub->id]
        );
    }

    public function cddApprovedForwardedToClient(CddSubmission $sub): void
    {
        $this->create(
            $sub->recruiter->user, 'cdd_approved',
            'Candidate approved — forwarded to client',
            "{$sub->candidate->first_name} {$sub->candidate->last_name} has been approved and sent to {$sub->mandate->client->company_name}.",
            route('recruiter.kanban.show', $sub->mandate_id),
            ['submission_id' => $sub->id]
        );
    }

    public function cddRejectedRevise(CddSubmission $sub): void
    {
        $this->create(
            $sub->recruiter->user, 'cdd_rejected',
            'Candidate submission needs revision',
            "Admin requested changes for {$sub->candidate->first_name} {$sub->candidate->last_name}. " .
            ($sub->admin_note ? "Note: {$sub->admin_note}" : '') .
            " You can revise and resubmit (attempt {$sub->admin_rejection_count} of 2).",
            route('recruiter.mandates.workspace', $sub->mandate_id),
            ['submission_id' => $sub->id],
            true
        );
    }

    public function cddSlotBurned(CddSubmission $sub): void
    {
        $this->create(
            $sub->recruiter->user, 'cdd_slot_burned',
            'Candidate slot closed — please source a new candidate',
            "{$sub->candidate->first_name} {$sub->candidate->last_name} has been rejected twice for {$sub->mandate->title}. Please source and submit a new candidate.",
            route('recruiter.mandates.workspace', $sub->mandate_id),
            ['submission_id' => $sub->id],
            true
        );
    }

    // ── CLIENT FEEDBACK ───────────────────────────────────────────────────

    public function clientFeedbackReceived(CddSubmission $sub): void
    {
        // Notify recruiter
        $statusLabel = ucfirst(str_replace('_', ' ', $sub->client_status));
        $this->create(
            $sub->recruiter->user, 'client_feedback',
            "Client feedback: {$sub->candidate->first_name} → {$statusLabel}",
            "{$sub->mandate->client->company_name} updated {$sub->candidate->first_name} {$sub->candidate->last_name} to: {$statusLabel}",
            route('recruiter.kanban.show', $sub->mandate_id),
            ['submission_id' => $sub->id, 'status' => $sub->client_status],
            true
        );

        // Notify admin
        $this->notifyAllAdmins(
            'client_feedback',
            "Client feedback received",
            "{$sub->mandate->client->company_name} updated a candidate status to {$statusLabel}.",
            route('admin.submissions.index'),
            ['submission_id' => $sub->id]
        );
    }

    public function clientResponseReminder(CddSubmission $sub): void
    {
        // Send email directly to client contact (not a platform notification)
        Mail::to($sub->mandate->client->contact_email)
            ->queue(new ClientResponseReminderMail($sub));
    }

    // ── TIMERS ────────────────────────────────────────────────────────────

    public function timerAReminderDay2(MandateClaim $claim): void
    {
        $deadline = $claim->timerADeadlineAt()->format('d M Y');
        $this->create(
            $claim->recruiter->user, 'timer_a_warning',
            '⚠️ Deadline tomorrow — submit your first candidate',
            "You must submit at least 1 candidate for {$claim->mandate->title} by {$deadline}. Missing this will trigger reassignment.",
            route('recruiter.mandates.workspace', $claim->mandate_id),
            ['mandate_id' => $claim->mandate_id, 'deadline' => $deadline],
            true
        );
    }

    public function timerAFailed(MandateClaim $claim): void
    {
        // Notify recruiter
        $this->create(
            $claim->recruiter->user, 'timer_a_failed',
            'Role reassigned — deadline missed',
            "You did not submit a candidate for {$claim->mandate->title} within the required timeframe. The role has been returned to the pool.",
            route('recruiter.mandates.index'),
            ['mandate_id' => $claim->mandate_id],
            true
        );

        // Notify admin
        $this->notifyAllAdmins(
            'timer_a_failed',
            'Timer A deadline missed — role reassigned',
            "{$claim->recruiter->displayName()} missed the deadline for {$claim->mandate->title}. Role attempt {$claim->mandate->assignment_count} of 3.",
            route('admin.mandates.show', $claim->mandate_id),
            ['mandate_id' => $claim->mandate_id]
        );
    }

    public function timerBWarning(MandateClaim $claim, int $submittedCount): void
    {
        $deadline = $claim->timerBDeadlineAt()->format('d M Y');
        $remaining = 3 - $submittedCount;
        $this->create(
            $claim->recruiter->user, 'timer_b_warning',
            "⚠️ {$remaining} more candidate(s) needed by tomorrow",
            "You need to submit {$remaining} more candidate(s) for {$claim->mandate->title} by {$deadline} to avoid a commission penalty.",
            route('recruiter.mandates.workspace', $claim->mandate_id),
            ['mandate_id' => $claim->mandate_id],
            true
        );
    }

    public function timerCSlaBreached(CddSubmission $sub, MandateClaim $claim): void
    {
        $this->notifyAllAdmins(
            'timer_c_sla_breach',
            'Client SLA breached — manual action needed',
            "{$sub->mandate->client->company_name} has not responded to the candidate submission for {$sub->mandate->title} in {$sub->mandate->timer_c_sla_days} days. Admin can manually free the recruiter slot.",
            route('admin.submissions.index'),
            ['submission_id' => $sub->id, 'claim_id' => $claim->id]
        );
    }

    // ── ROLES ─────────────────────────────────────────────────────────────

    public function roleDropped(Mandate $mandate): void
    {
        $this->notifyAllAdmins(
            'role_dropped',
            'Role dropped after 3 failed assignments',
            "{$mandate->title} at {$mandate->client->company_name} has been dropped after {$mandate->assignment_count} failed recruiter assignments.",
            route('admin.mandates.show', $mandate->id),
            ['mandate_id' => $mandate->id]
        );
    }

    public function roleReturnedToPool(Mandate $mandate, int $attempt): void
    {
        $this->notifyAllAdmins(
            'role_returned_to_pool',
            "Role returned to pool (attempt {$attempt}/3)",
            "{$mandate->title} at {$mandate->client->company_name} is available again. Attempt {$attempt} of 3.",
            route('admin.mandates.show', $mandate->id),
            ['mandate_id' => $mandate->id]
        );
    }

    public function notifyEligibleRecruiters(Mandate $mandate): void
    {
        // Notify recruiters with capacity, optionally filtered by group
        Recruiter::withCapacity()
            ->with('user')
            ->each(function (Recruiter $recruiter) use ($mandate) {
                $this->create(
                    $recruiter->user, 'new_role_available',
                    'New role available — pick it now',
                    "{$mandate->title} at {$mandate->client->company_name} is available. Be first to claim it.",
                    route('recruiter.mandates.show', $mandate->id),
                    ['mandate_id' => $mandate->id]
                );
            });
    }

    public function roleUnclaimed48h(Mandate $mandate): void
    {
        $this->notifyAllAdmins(
            'role_unclaimed_48h',
            "⚠️ Role unclaimed for 48 hours",
            "{$mandate->title} at {$mandate->client->company_name} has been unclaimed for 48 hours. Consider manual assignment.",
            route('admin.mandates.show', $mandate->id),
            ['mandate_id' => $mandate->id]
        );
    }

    public function roleUnclaimed72h(Mandate $mandate): void
    {
        $this->notifyAllAdmins(
            'role_unclaimed_72h',
            "🔴 Role auto-paused — unclaimed 72 hours",
            "{$mandate->title} at {$mandate->client->company_name} has been auto-paused after 72 hours without a recruiter. Manual intervention required.",
            route('admin.mandates.show', $mandate->id),
            ['mandate_id' => $mandate->id]
        );
    }

    // ── COMMISSION & PLACEMENT ────────────────────────────────────────────

    public function placementConfirmed(Placement $placement): void
    {
        $this->create(
            $placement->recruiter->user, 'placement_confirmed',
            '🎉 Placement confirmed!',
            "Congratulations! Your candidate has been hired for {$placement->mandate->title} at {$placement->client->company_name}. Payout: SGD " . number_format($placement->final_payout, 0),
            route('recruiter.earnings.index'),
            ['placement_id' => $placement->id, 'amount' => $placement->final_payout],
            true
        );

        $this->notifyAllAdmins(
            'placement_confirmed',
            'Placement confirmed',
            "{$placement->recruiter->displayName()} placed a candidate at {$placement->client->company_name}. Gross: SGD " . number_format($placement->gross_reward, 0),
            route('admin.analytics.index'),
            ['placement_id' => $placement->id]
        );
    }

    public function payoutProcessed(Placement $placement): void
    {
        $this->create(
            $placement->recruiter->user, 'payout_processed',
            'Payout processed',
            "SGD " . number_format($placement->final_payout, 0) . " has been transferred to your bank account.",
            route('recruiter.earnings.index'),
            ['placement_id' => $placement->id],
            true
        );
    }

    public function slotFreed(MandateClaim $claim): void
    {
        $this->create(
            $claim->recruiter->user, 'slot_freed',
            'Role slot freed — you can pick a new role',
            "Your work on {$claim->mandate->title} is complete. You now have capacity for a new role.",
            route('recruiter.mandates.index'),
            ['mandate_id' => $claim->mandate_id]
        );
    }

    // ── DAILY DIGEST ──────────────────────────────────────────────────────

    public function sendDailyDigest(User $admin, array $digest): void
    {
        Mail::to($admin->email)->queue(new AdminDailyDigestMail($admin, $digest));
    }
}
```

---

## NotificationController

```php
// app/Http/Controllers/NotificationController.php
class NotificationController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        return Inertia::render('Shared/Notifications', [
            'notifications' => Notification::where('user_id', $user->id)
                ->latest()
                ->paginate(30),
            'unread_count' => Notification::where('user_id', $user->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    public function markRead(Notification $notification): JsonResponse
    {
        abort_if($notification->user_id !== auth()->id(), 403);
        $notification->update(['is_read' => true, 'read_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function readAll(): JsonResponse
    {
        Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        return response()->json(['success' => true]);
    }
}
```

---

## Daily Digest Command (Complete)

```php
// app/Console/Commands/DailyDigestCommand.php
class DailyDigestCommand extends Command
{
    protected $signature   = 'seasearch:daily-digest';
    protected $description = 'Send daily admin digest at 9am';

    public function handle(NotificationService $notif, TimerService $timerService): void
    {
        $now = now();

        $digest = [
            // Unclaimed roles
            'unclaimed_24h'  => Mandate::active()->unclaimed()
                ->where('original_post_date','<=',$now->copy()->subHours(24))->count(),
            'unclaimed_48h'  => Mandate::active()->unclaimed()
                ->where('original_post_date','<=',$now->copy()->subHours(48))->count(),
            'unclaimed_72h'  => Mandate::active()->unclaimed()
                ->where('original_post_date','<=',$now->copy()->subHours(72))->count(),

            // Pending approvals
            'pending_claims'      => MandateClaim::where('status','pending')->count(),
            'pending_cdd_reviews' => CddSubmission::pendingAdminReview()->count(),

            // Timer A: approaching or overdue
            'timer_a_due_today' => $this->getTimerADueToday(),
            'timer_a_overdue'   => $this->getTimerAOverdue(),

            // Timer B: approaching (only if active on any mandate)
            'timer_b_warning' => $this->getTimerBWarning(),

            // Timer C: client SLA breached (only if active)
            'client_sla_breached' => $this->getClientSlaBreached(),

            // All recruiters at capacity (roles queued)
            'roles_queued_capacity' => Mandate::active()->unclaimed()
                ->whereRaw('(SELECT COUNT(*) FROM recruiters WHERE active_mandates_count < 2) = 0')
                ->count(),
        ];

        // Only send if there's something to action
        if (array_sum($digest) === 0) {
            $this->info('No items to digest today — skipping email.');
            return;
        }

        User::admins()->each(fn($admin) => $notif->sendDailyDigest($admin, $digest));

        $this->info('Daily digest sent to ' . User::admins()->count() . ' admin(s).');
    }

    private function getTimerADueToday(): int
    {
        return MandateClaim::where('status','approved')
            ->whereNotNull('assigned_at')
            ->get()
            ->filter(fn($claim) =>
                $claim->timerADeadlineAt()?->isToday() &&
                CddSubmission::where('mandate_id',$claim->mandate_id)
                    ->where('recruiter_id',$claim->recruiter_id)
                    ->whereNotIn('admin_review_status',['rejected'])
                    ->count() === 0
            )->count();
    }

    private function getTimerAOverdue(): int
    {
        return MandateClaim::where('status','approved')
            ->whereNotNull('assigned_at')
            ->get()
            ->filter(fn($claim) =>
                $claim->timerAOverdue() &&
                CddSubmission::where('mandate_id',$claim->mandate_id)
                    ->where('recruiter_id',$claim->recruiter_id)
                    ->count() === 0
            )->count();
    }

    private function getTimerBWarning(): int
    {
        return MandateClaim::where('status','approved')
            ->whereNotNull('assigned_at')
            ->whereHas('mandate', fn($q) => $q->where('timer_b_active',true))
            ->get()
            ->filter(fn($claim) => {
                $deadline   = $claim->timerBDeadlineAt();
                $daysToGo   = $deadline ? (int) now()->diffInDays($deadline, false) : null;
                $submitted  = CddSubmission::where('mandate_id',$claim->mandate_id)
                    ->where('recruiter_id',$claim->recruiter_id)
                    ->whereNotIn('admin_review_status',['rejected'])
                    ->count();
                return $daysToGo !== null && $daysToGo <= 1 && $submitted < 3;
            })->count();
    }

    private function getClientSlaBreached(): int
    {
        return CddSubmission::whereIn('admin_review_status',['approved','bypassed'])
            ->where('client_status','pending')
            ->whereNull('token_used_at')
            ->whereHas('mandate', fn($q) => $q->where('timer_c_active',true))
            ->where('submitted_at','<=', now()->subDays(5))
            ->count();
    }
}
```

---

## AdminDailyDigestMail

```php
// app/Mail/AdminDailyDigestMail.php
class AdminDailyDigestMail extends Mailable implements ShouldQueue
{
    public function __construct(
        public User $admin,
        public array $digest
    ) {}

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.daily-digest',
            with: [
                'admin'     => $this->admin,
                'digest'    => $this->digest,
                'dashUrl'   => route('admin.dashboard'),
                'claimsUrl' => route('admin.claims.index'),
                'cddsUrl'   => route('admin.submissions.index'),
                'date'      => now()->format('l, d F Y'),
            ]
        );
    }

    public function envelope(): Envelope
    {
        $total = array_sum($this->digest);
        return new Envelope(
            subject: "SeaSearch Daily Digest — {$total} item(s) need attention · " . now()->format('d M')
        );
    }
}
```
