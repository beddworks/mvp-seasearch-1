<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Jobs\ParseCvJob;
use App\Jobs\SyncGSheetJob;
use App\Models\Candidate;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Services\ExceptionService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KanbanController extends Controller
{
    public function show(Mandate $mandate): Response
    {
        $recruiter = auth()->user()->recruiter;

        // Ensure recruiter has an approved claim
        $claim = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->where('status', 'approved')
            ->firstOrFail();

        $submissions = CddSubmission::with(['candidate', 'placement'])
            ->where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->get();

        $mandate->loadMissing('client');

        $submissionData = $submissions->map(fn ($s) => $this->formatSubmission($s))->values();

        return Inertia::render('Recruiter/Kanban/Show', [
            'mandate'     => [
                'id'            => $mandate->id,
                'title'         => $mandate->title,
                'status'        => $mandate->status,
                'is_exclusive'  => $mandate->is_exclusive,
                'is_fast_track' => $mandate->is_fast_track,
                'client'        => [
                    'id'           => $mandate->client?->id,
                    'company_name' => $mandate->client?->company_name,
                ],
            ],
            'claim'       => [
                'id'          => $claim->id,
                'assigned_at' => $claim->assigned_at,
            ],
            'submissions' => $submissionData,
            'stages'      => ['sourced', 'screened', 'interview', 'offered', 'hired', 'rejected'],
            'stats'       => [
                'total'       => $submissions->count(),
                'top_score'   => $submissions->max('ai_score') ?? 0,
                'days_active' => $claim->assigned_at ? now()->diffInDays($claim->assigned_at) : 0,
                'submitted'   => $submissions->whereIn('admin_review_status', ['approved', 'bypassed'])->count(),
            ],
        ]);
    }

    public function move(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id' => 'required|uuid|exists:cdd_submissions,id',
            'new_stage'     => 'required|in:sourced,screened,interview,offered,hired,rejected,on_hold',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update([
            'client_status'           => $request->new_stage,
            'client_status_updated_at' => now(),
        ]);

        // Sync GSheet if already sent to client
        if (in_array($submission->admin_review_status, ['approved', 'bypassed'])) {
            SyncGSheetJob::dispatch($submission->fresh(), 'update_status')->onQueue('sheets');
        }

        return response()->json([
            'success'   => true,
            'new_stage' => $request->new_stage,
            'id'        => $submission->id,
        ]);
    }

    public function scheduleInterview(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'    => 'required|uuid|exists:cdd_submissions,id',
            'interview_date'   => 'required|date',
            'interview_format' => 'nullable|in:in_person,video,panel',
            'interview_notes'  => 'nullable|string|max:1000',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update([
            'interview_date'          => $request->interview_date,
            'interview_format'        => $request->interview_format,
            'interview_notes'         => $request->interview_notes,
            'client_status'           => 'interview',
            'client_status_updated_at' => now(),
        ]);

        return response()->json([
            'success'    => true,
            'submission' => $this->formatSubmission($submission->fresh(['candidate'])),
        ]);
    }

    public function saveClientFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'             => 'required|uuid|exists:cdd_submissions,id',
            'client_feedback'           => 'required|string|max:2000',
            'client_feedback_sentiment' => 'required|in:positive,neutral,negative',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update([
            'client_feedback'           => $request->client_feedback,
            'client_feedback_sentiment' => $request->client_feedback_sentiment,
        ]);

        return response()->json(['success' => true]);
    }

    public function submitToClient(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'  => 'required|uuid|exists:cdd_submissions,id',
            'recruiter_note' => 'nullable|string|max:1000',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        if (in_array($submission->admin_review_status, ['approved', 'bypassed'])) {
            return response()->json(['error' => 'Already submitted to client.'], 422);
        }

        if ($request->recruiter_note !== null) {
            $submission->update(['recruiter_note' => $request->recruiter_note]);
        }

        $bypass = app(ExceptionService::class)->shouldBypass(
            auth()->user()->recruiter,
            $submission->mandate
        );

        $submission->update([
            'admin_review_status' => $bypass ? 'bypassed' : 'pending',
            'exception_bypass'    => $bypass,
        ]);

        if ($bypass) {
            // Dispatch GSheet sync since it skips admin queue
            SyncGSheetJob::dispatch($submission->fresh(), 'add_row')->onQueue('sheets');
        }

        app(NotificationService::class)->notifyAdmins(
            'cdd_pending_review',
            "CDD submitted for review: {$submission->candidate->first_name} {$submission->candidate->last_name}",
            ['submission_id' => $submission->id]
        );

        return response()->json([
            'success'  => true,
            'bypassed' => $bypass,
            'message'  => $bypass ? 'Submitted directly to client.' : 'Sent for admin review.',
        ]);
    }

    public function reject(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'    => 'required|uuid|exists:cdd_submissions,id',
            'rejection_reason' => 'required|in:client,withdrew,unsuitable,compensation',
            'rejection_note'   => 'nullable|string|max:500',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update([
            'client_status'             => 'rejected',
            'client_rejection_reason'   => $request->rejection_reason,
            'client_status_updated_at'  => now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function addCandidate(Request $request): JsonResponse
    {
        $request->validate([
            'mandate_id'      => 'required|uuid|exists:mandates,id',
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'email'           => 'nullable|email|max:255',
            'linkedin_url'    => 'nullable|url|max:500',
            'current_role'    => 'nullable|string|max:200',
            'current_company' => 'nullable|string|max:200',
            'initial_stage'   => 'required|in:sourced,screened',
            'cv'              => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $recruiter = auth()->user()->recruiter;

        $candidate = Candidate::create([
            'recruiter_id'    => $recruiter->id,
            'first_name'      => $request->first_name,
            'last_name'       => $request->last_name,
            'email'           => $request->email,
            'linkedin_url'    => $request->linkedin_url,
            'current_role'    => $request->current_role,
            'current_company' => $request->current_company,
        ]);

        if ($request->hasFile('cv')) {
            $path = $request->file('cv')->store("candidates/{$recruiter->id}", 's3');
            $candidate->update([
                'cv_file_path' => $path,
                'cv_file_name' => $request->file('cv')->getClientOriginalName(),
            ]);
            ParseCvJob::dispatch($candidate, $request->mandate_id)->onQueue('ai');
        }

        $submission = CddSubmission::create([
            'mandate_id'          => $request->mandate_id,
            'recruiter_id'        => $recruiter->id,
            'candidate_id'        => $candidate->id,
            'client_status'       => $request->initial_stage,
            'admin_review_status' => 'pending',
            'submitted_at'        => now(),
            'token'               => \Illuminate\Support\Str::uuid(),
            'token_created_at'    => now(),
        ]);

        return response()->json([
            'success'    => true,
            'submission' => $this->formatSubmission($submission->load('candidate')),
            'parsing'    => $request->hasFile('cv'),
        ]);
    }

    // ── Helper ─────────────────────────────────────────────────────────

    private function formatSubmission(CddSubmission $s): array
    {
        $c = $s->candidate;
        return [
            'id'                        => $s->id,
            'client_status'             => $s->client_status ?? 'sourced',
            'admin_review_status'       => $s->admin_review_status,
            'ai_score'                  => $s->ai_score,
            'ai_summary'                => $s->ai_summary,
            'score_breakdown'           => $s->score_breakdown,
            'green_flags'               => $s->green_flags,
            'red_flags'                 => $s->red_flags,
            'recruiter_note'            => $s->recruiter_note,
            'client_feedback'           => $s->client_feedback,
            'client_feedback_sentiment' => $s->client_feedback_sentiment,
            'client_rejection_reason'   => $s->client_rejection_reason,
            'interview_date'            => $s->interview_date,
            'interview_format'          => $s->interview_format,
            'interview_notes'           => $s->interview_notes,
            'submitted_at'              => $s->submitted_at,
            'exception_bypass'          => $s->exception_bypass,
            'candidate' => $c ? [
                'id'              => $c->id,
                'first_name'      => $c->first_name,
                'last_name'       => $c->last_name,
                'current_role'    => $c->current_role,
                'current_company' => $c->current_company,
                'cv_file_path'    => $c->cv_file_path,
                'cv_file_name'    => $c->cv_file_name,
                'cv_parsed'       => $c->cv_parsed,
            ] : null,
        ];
    }
}
