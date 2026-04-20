<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CddSubmissionController extends Controller
{
    public function __construct(
        private NotificationService $notificationService,
    ) {}

    /**
     * Submit a candidate for a mandate (create CDD submission).
     */
    public function store(Request $request)
    {
        $recruiter = auth()->user()->recruiter;

        $validated = $request->validate([
            'mandate_id'    => 'required|uuid|exists:mandates,id',
            'candidate_id'  => 'required|uuid|exists:candidates,id',
            'recruiter_note' => 'nullable|string|max:1000',
        ]);

        $mandate   = Mandate::findOrFail($validated['mandate_id']);
        $candidate = Candidate::findOrFail($validated['candidate_id']);

        // Gate: recruiter must have an approved claim
        $claim = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->where('status', 'approved')
            ->first();

        if (!$claim) {
            return redirect()->back()->with('error', 'You do not have an approved claim for this role.');
        }

        // Gate: candidate must belong to this recruiter
        if ($candidate->recruiter_id !== $recruiter->id) {
            return redirect()->back()->with('error', 'This candidate is not in your library.');
        }

        // Gate: max 3 submissions per mandate per recruiter
        $submissionCount = CddSubmission::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->count();

        if ($submissionCount >= 3) {
            return redirect()->back()->with('error', 'Maximum 3 submissions allowed per role.');
        }

        // Determine if bypass applies (fast-track or trusted recruiter)
        $bypass = $mandate->is_fast_track || $recruiter->trust_level === 'trusted';

        $submission = CddSubmission::create([
            'mandate_id'           => $mandate->id,
            'recruiter_id'         => $recruiter->id,
            'candidate_id'         => $candidate->id,
            'claim_id'             => $claim->id,
            'recruiter_note'       => $validated['recruiter_note'] ?? null,
            'admin_review_status'  => $bypass ? 'bypassed' : 'pending',
            'client_status'        => 'pending',
            'exception_bypass'     => $bypass,
            'submission_number'    => $submissionCount + 1,
            'submitted_at'         => now(),
            'token'                => Str::uuid(),
        ]);

        // Notify admins (unless bypassed)
        if (!$bypass) {
            $this->notificationService->notifyAdmins(
                'cdd_pending_review',
                "CDD submitted: {$candidate->first_name} {$candidate->last_name} for {$mandate->title}",
                ['submission_id' => $submission->id]
            );
        }

        return redirect()->route('recruiter.mandates.workspace', $mandate)
            ->with('success', $bypass
                ? 'Candidate submitted directly to client (fast-track / trusted).'
                : 'Candidate submitted. Awaiting admin review before client sees it.');
    }

    /**
     * Update recruiter note on a submission.
     */
    public function update(Request $request, CddSubmission $submission)
    {
        $recruiter = auth()->user()->recruiter;
        abort_if($submission->recruiter_id !== $recruiter->id, 403);

        $validated = $request->validate([
            'recruiter_note' => 'nullable|string|max:1000',
        ]);

        $submission->update($validated);

        return redirect()->back()->with('success', 'Note updated.');
    }
}
