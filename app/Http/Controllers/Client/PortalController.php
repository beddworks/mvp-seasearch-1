<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\CddSubmission;
use App\Models\Mandate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    public function index(Request $request): Response
    {
        $client = auth()->user()->client;
        $screen = $request->query('screen', 'dashboard');

        $mandates = Mandate::where('client_id', $client->id)
            ->with(['activeClaim.recruiter.user', 'submissions' => fn ($q) =>
                $q->whereIn('admin_review_status', ['approved', 'bypassed'])
            ])
            ->whereIn('status', ['active', 'filled'])
            ->get();

        $allSubmissions = CddSubmission::whereHas('mandate', fn ($q) =>
            $q->where('client_id', $client->id)
        )->with(['candidate', 'recruiter.user', 'mandate'])->latest()->get();

        $notifications = AppNotification::where('user_id', auth()->id())
            ->latest()
            ->take(30)
            ->get();

        // Active mandate title for sidebar
        $activeMandateTitle = $mandates->where('status', 'active')->first()?->title;

        return Inertia::render('Client/Portal/Index', [
            'client' => [
                'id'                   => $client->id,
                'company_name'         => $client->company_name,
                'industry'             => $client->industry,
                'logo_url'             => $client->logo_url,
                'accent_color'         => $client->accent_color,
                'contact_name'         => $client->contact_name,
                'contact_email'        => $client->contact_email,
                'contact_title'        => $client->contact_title,
                'active_mandate_title' => $activeMandateTitle,
            ],
            'screen' => $screen,
            'stats'  => [
                'total_submissions'   => $allSubmissions->count(),
                'approved_interviews' => $allSubmissions->where('client_status', 'interview')->count(),
                'active_mandates'     => $mandates->where('status', 'active')->count(),
                'avg_brief_to_review' => $this->avgResponseDays($allSubmissions),
            ],
            'mandates' => $mandates->map(fn ($m) => [
                'id'          => $m->id,
                'title'       => $m->title,
                'status'      => $m->status,
                'activeClaim' => $m->activeClaim ? [
                    'recruiter' => $m->activeClaim->recruiter ? [
                        'display_name' => $m->activeClaim->recruiter->display_name,
                    ] : null,
                ] : null,
            ])->values(),
            'submissions' => $allSubmissions->map(fn ($s) => [
                'id'                    => $s->id,
                'mandate_id'            => $s->mandate_id,
                'ai_score'              => $s->ai_score,
                'ai_summary'            => $s->ai_summary,
                'score_breakdown'       => $s->score_breakdown,
                'green_flags'           => $s->green_flags,
                'red_flags'             => $s->red_flags,
                'recruiter_note'        => $s->recruiter_note,
                'client_status'         => $s->client_status,
                'client_rejection_reason' => $s->client_rejection_reason,
                'interview_date'        => $s->interview_date?->toDateString(),
                'interview_format'      => $s->interview_format,
                'interview_notes'       => $s->interview_notes,
                'submitted_at'          => $s->submitted_at,
                'candidate' => $s->candidate ? [
                    'id'               => $s->candidate->id,
                    'first_name'       => $s->candidate->first_name,
                    'last_name'        => $s->candidate->last_name,
                    'current_role'     => $s->candidate->current_role,
                    'current_company'  => $s->candidate->current_company,
                    'years_experience' => $s->candidate->years_experience,
                ] : null,
                'recruiter' => $s->recruiter ? [
                    'display_name' => $s->recruiter->display_name,
                ] : null,
                'mandate' => $s->mandate ? [
                    'id'    => $s->mandate->id,
                    'title' => $s->mandate->title,
                ] : null,
            ])->values(),
            'messages'      => [],
            'notifications' => $notifications->map(fn ($n) => [
                'id'         => $n->id,
                'title'      => $n->title,
                'body'       => $n->body,
                'action_url' => $n->action_url,
                'is_read'    => $n->is_read,
                'created_at' => $n->created_at,
            ])->values(),
        ]);
    }

    public function updateStatus(Request $request, CddSubmission $submission): RedirectResponse
    {
        $validated = $request->validate([
            'status'           => 'required|in:shortlisted,interview,offer_made,hired,rejected,on_hold',
            'interview_date'   => 'nullable|date',
            'interview_format' => 'nullable|in:in_person,video,panel',
            'interview_notes'  => 'nullable|string|max:1000',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        // Ensure this submission belongs to the client's mandate
        $client = auth()->user()->client;
        abort_unless($submission->mandate->client_id === $client->id, 403);

        $submission->update([
            'client_status'               => $validated['status'],
            'client_status_updated_at'    => now(),
            'interview_date'              => $validated['interview_date'] ?? null,
            'interview_format'            => $validated['interview_format'] ?? $submission->interview_format,
            'interview_notes'             => $validated['interview_notes'] ?? null,
            'client_rejection_reason'     => $validated['rejection_reason'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Candidate status updated.');
    }

    public function kanbanMove(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id' => 'required|uuid|exists:cdd_submissions,id',
            'new_stage'     => 'required|in:pending,shortlisted,interview,offer_made,hired,rejected,on_hold',
        ]);

        $client = auth()->user()->client;
        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_unless($submission->mandate->client_id === $client->id, 403);

        $submission->update([
            'client_status'            => $request->new_stage,
            'client_status_updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'new_stage' => $request->new_stage]);
    }

    public function sendMessage(Request $request): RedirectResponse
    {
        $request->validate([
            'body'       => 'required|string|max:2000',
            'mandate_id' => 'nullable|uuid',
        ]);

        // TODO: implement message thread model
        return redirect()->back()->with('success', 'Message sent.');
    }

    public function readAllNotifications(): JsonResponse
    {
        AppNotification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }

    private function avgResponseDays($submissions): float
    {
        $responded = $submissions->filter(
            fn ($s) => $s->client_status_updated_at && $s->submitted_at
        );

        if ($responded->isEmpty()) {
            return 0;
        }

        return round(
            $responded->avg(fn ($s) => $s->submitted_at->diffInDays($s->client_status_updated_at)),
            1
        );
    }
}
