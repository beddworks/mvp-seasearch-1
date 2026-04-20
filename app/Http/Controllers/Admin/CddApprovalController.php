<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CddSubmission;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CddApprovalController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Submissions/Index', [
            'submissions' => CddSubmission::with(['mandate.client', 'candidate', 'recruiter.user'])
                ->pendingAdminReview()
                ->latest()
                ->paginate(25),
            'pendingCount' => CddSubmission::pendingAdminReview()->count(),
        ]);
    }

    public function approve(CddSubmission $submission, Request $request): RedirectResponse
    {
        $request->validate(['note' => 'nullable|string|max:500']);

        $submission->update([
            'admin_review_status'  => 'approved',
            'admin_reviewed_by'    => auth()->id(),
            'admin_reviewed_at'    => now(),
            'admin_note'           => $request->note,
        ]);

        app(NotificationService::class)->cddApproved($submission);

        return redirect()->back()->with('success', 'CDD approved. Client will now see this candidate.');
    }

    public function reject(CddSubmission $submission, Request $request): RedirectResponse
    {
        $request->validate(['note' => 'required|string|max:500']);

        $rejectionCount = $submission->admin_rejection_count + 1;

        $submission->update([
            'admin_review_status'   => 'rejected',
            'admin_reviewed_by'     => auth()->id(),
            'admin_reviewed_at'     => now(),
            'admin_note'            => $request->note,
            'admin_rejection_count' => $rejectionCount,
        ]);

        app(NotificationService::class)->cddRejected($submission, $request->note);

        $slotBurned = $rejectionCount >= 2;
        $msg = $slotBurned
            ? 'CDD rejected (2nd rejection — slot burned). Recruiter must source a new candidate.'
            : 'CDD rejected. Recruiter may revise and resubmit.';

        return redirect()->back()->with('success', $msg);
    }
}
