<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Services\ClaimService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MandateController extends Controller
{
    public function __construct(
        private ClaimService $claimService,
        private NotificationService $notificationService,
    ) {}

    /**
     * Job board — show active mandates the recruiter can pick.
     */
    public function index(Request $request)
    {
        $recruiter = auth()->user()->recruiter;

        $query = Mandate::with(['client', 'compensationType', 'approvedClaim.recruiter.user'])
            ->where('status', 'active');

        // Filters
        if ($request->filled('industry')) {
            $query->where('industry', $request->industry);
        }
        if ($request->filled('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }
        if ($request->filled('seniority')) {
            $query->where('seniority', $request->seniority);
        }
        if ($request->filled('type')) {
            $query->where('contract_type', $request->type);
        }
        if ($request->filled('tab')) {
            match ($request->tab) {
                'exclusive' => $query->where('is_exclusive', true),
                'featured'  => $query->where('is_featured', true),
                'fast_track' => $query->where('is_fast_track', true),
                'unclaimed' => $query->doesntHave('approvedClaim'),
                default     => null,
            };
        }

        $mandates = $query->latest('original_post_date')->paginate(20)->withQueryString();

        // Mark which mandates the recruiter has already picked
        $myClaimedIds = $recruiter
            ? MandateClaim::where('recruiter_id', $recruiter->id)
                ->whereIn('status', ['pending', 'approved'])
                ->pluck('mandate_id')
            : collect();

        // Stats
        $industries = Mandate::where('status', 'active')
            ->whereNotNull('industry')
            ->distinct()
            ->pluck('industry');

        return Inertia::render('Recruiter/Mandates/Index', [
            'mandates'       => $mandates,
            'myClaimedIds'   => $myClaimedIds,
            'industries'     => $industries,
            'filters'        => $request->only('industry', 'location', 'seniority', 'type', 'tab'),
            'canPickMore'    => $recruiter ? $recruiter->active_mandates_count < 2 : false,
            'activeMandatesCount' => $recruiter?->active_mandates_count ?? 0,
        ]);
    }

    /**
     * Role detail page — full JD before picking.
     */
    public function show(Mandate $mandate)
    {
        $recruiter = auth()->user()->recruiter;

        $mandate->load([
            'client',
            'compensationType',
            'approvedClaim.recruiter.user',
        ]);

        $existingClaim = $recruiter
            ? MandateClaim::where('mandate_id', $mandate->id)
                ->where('recruiter_id', $recruiter->id)
                ->first()
            : null;

        return Inertia::render('Recruiter/Mandates/Show', [
            'mandate'       => $mandate,
            'existingClaim' => $existingClaim,
            'canPick'       => $recruiter && $recruiter->active_mandates_count < 2 && !$existingClaim && $mandate->status === 'active',
        ]);
    }

    /**
     * Pick (claim) a mandate — creates a pending MandateClaim for admin approval.
     */
    public function pick(Request $request, Mandate $mandate)
    {
        $recruiter = auth()->user()->recruiter;

        if (!$recruiter) {
            return redirect()->back()->with('error', 'Recruiter profile not found.');
        }

        if ($recruiter->active_mandates_count >= 2) {
            return redirect()->back()->with('error', 'You already have 2 active roles. Complete or drop one first.');
        }

        if ($mandate->status !== 'active') {
            return redirect()->back()->with('error', 'This role is no longer available.');
        }

        // Check for existing claim
        $existing = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existing) {
            return redirect()->back()->with('error', 'You have already picked this role.');
        }

        // Create pending claim
        MandateClaim::create([
            'mandate_id'   => $mandate->id,
            'recruiter_id' => $recruiter->id,
            'status'       => 'pending',
        ]);

        // Notify admins
        $this->notificationService->notifyAdmins(
            'new_claim',
            "New claim request: {$mandate->title} by " . auth()->user()->name,
            ['mandate_id' => $mandate->id, 'recruiter_id' => $recruiter->id]
        );

        return redirect()->route('recruiter.mandates.index')
            ->with('success', 'Pick request sent. You will be notified once an admin approves it.');
    }

    /**
     * Workspace — recruiter's active working view for an approved mandate.
     */
    public function workspace(Mandate $mandate)
    {
        $recruiter = auth()->user()->recruiter;

        $claim = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->where('status', 'approved')
            ->firstOrFail();

        $mandate->load(['client', 'compensationType']);

        // Days since assignment
        $daysSince = $claim->assigned_at
            ? (int) now()->diffInDays($claim->assigned_at)
            : null;

        $timerADeadline = $claim->assigned_at && $mandate->timer_a_days
            ? $claim->assigned_at->addDays($mandate->timer_a_days)->toDateString()
            : null;

        $timerAOverdue = $timerADeadline && now()->isAfter($timerADeadline);

        // Candidate submissions for this mandate
        $submissions = $recruiter->cddSubmissions()
            ->where('mandate_id', $mandate->id)
            ->with('candidate')
            ->get();

        // Recruiter's candidate library (for pick-to-submit)
        $candidates = $recruiter->candidates()
            ->latest()
            ->get();

        return Inertia::render('Recruiter/Mandates/Workspace', [
            'mandate'         => $mandate,
            'claim'           => $claim,
            'submissions'     => $submissions,
            'candidates'      => $candidates,
            'daysSince'       => $daysSince,
            'timerADeadline'  => $timerADeadline,
            'timerAOverdue'   => $timerAOverdue,
        ]);
    }
}
