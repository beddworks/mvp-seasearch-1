<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Jobs\SyncGSheetJob;
use App\Services\CommissionService;
use App\Services\NotificationService;
use App\Services\SlotService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubmissionFeedbackController extends Controller
{
    public function __construct(
        private TokenService $tokenService,
        private NotificationService $notificationService,
        private CommissionService $commissionService,
        private SlotService $slotService,
    ) {}

    /**
     * Show the tokenized feedback form.
     * Public route — no auth required.
     */
    public function show(string $token)
    {
        $submission = $this->tokenService->validate($token);

        if (!$submission) {
            return Inertia::render('Client/Feedback/Expired');
        }

        $submission->loadMissing(['candidate', 'mandate', 'recruiter.user']);

        return Inertia::render('Client/Feedback/Show', [
            'submission' => [
                'id'               => $submission->id,
                'ai_score'         => $submission->ai_score,
                'ai_summary'       => $submission->ai_summary,
                'score_breakdown'  => $submission->score_breakdown,
                'green_flags'      => $submission->green_flags,
                'red_flags'        => $submission->red_flags,
                'recruiter_note'   => $submission->recruiter_note,
                'submission_number'=> $submission->submission_number,
                'client_status'    => $submission->client_status,
                'candidate' => [
                    'first_name'      => $submission->candidate->first_name,
                    'last_name'       => $submission->candidate->last_name,
                    'current_role'    => $submission->candidate->current_role,
                    'current_company' => $submission->candidate->current_company,
                    'nationality'     => $submission->candidate->nationality,
                ],
                'mandate' => [
                    'id'    => $submission->mandate->id,
                    'title' => $submission->mandate->title,
                ],
                'recruiter' => [
                    'display_name' => $submission->recruiter->user->name ?? null,
                ],
            ],
            'token'      => $token,
            'statuses'   => $this->statusOptions(),
        ]);
    }

    /**
     * Handle client feedback submission.
     * Public route — no auth required.
     */
    public function update(Request $request, string $token)
    {
        $submission = $this->tokenService->validate($token);

        if (!$submission) {
            return Inertia::render('Client/Feedback/Expired');
        }

        $validated = $request->validate([
            'status'           => 'required|in:shortlisted,interview,offer_made,hired,rejected,on_hold',
            'rejection_reason' => 'nullable|string|max:500',
            'interview_date'   => 'nullable|date',
            'interview_format' => 'nullable|in:in_person,video,panel',
            'interview_notes'  => 'nullable|string|max:1000',
        ]);

        \DB::transaction(function () use ($submission, $validated) {
            $submission->loadMissing(['mandate', 'recruiter']);

            // Update submission with client feedback
            $submission->update([
                'client_status'              => $validated['status'],
                'client_status_updated_at'   => now(),
                'client_rejection_reason'    => $validated['rejection_reason'] ?? null,
                'interview_date'             => $validated['interview_date'] ?? null,
                'interview_format'           => $validated['interview_format'] ?? null,
                'interview_notes'            => $validated['interview_notes'] ?? null,
            ]);

            // Consume the one-time token
            $this->tokenService->markUsed($submission, $validated['status']);

            // Sync GSheet
            SyncGSheetJob::dispatch($submission, 'update_status')->onQueue('sheets');

            // Notify recruiter + admins
            $this->notificationService->clientFeedbackReceived($submission);

            // Settle commission if hired
            if ($validated['status'] === 'hired') {
                $this->commissionService->settle($submission);
                $this->slotService->checkAndFreeSlot($submission->mandate, $submission->recruiter_id);
            }
        });

        return redirect()->route('feedback.confirmed');
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private function statusOptions(): array
    {
        return [
            ['value' => 'shortlisted',  'label' => 'Shortlisted',   'description' => 'This candidate has been shortlisted for further consideration.'],
            ['value' => 'interview',    'label' => 'Interview',      'description' => 'You would like to arrange an interview with this candidate.'],
            ['value' => 'offer_made',   'label' => 'Offer Made',     'description' => 'An offer has been extended to this candidate.'],
            ['value' => 'hired',        'label' => 'Hired',          'description' => 'This candidate has accepted and will join your team.'],
            ['value' => 'rejected',     'label' => 'Not Proceeding', 'description' => 'You are not moving forward with this candidate at this time.'],
            ['value' => 'on_hold',      'label' => 'On Hold',        'description' => 'Decision deferred — you may revisit this candidate later.'],
        ];
    }
}
