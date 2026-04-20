<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMandateRequest;
use App\Jobs\SyncGSheetJob;
use App\Models\Client;
use App\Models\CompensationType;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\Recruiter;
use App\Services\NotificationService;
use App\Services\TimerService;
use App\Models\CddSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MandateManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Mandates/Index', [
            'mandates'          => Mandate::with(['client', 'activeClaim.recruiter.user', 'compensationType'])
                                    ->latest()
                                    ->paginate(20),
            'clients'           => Client::get(['id', 'company_name']),
            'compensationTypes' => CompensationType::where('is_active', true)->get(),
            'stats' => [
                'active'  => Mandate::where('status', 'active')->count(),
                'draft'   => Mandate::where('status', 'draft')->count(),
                'filled'  => Mandate::where('status', 'filled')->count(),
                'dropped' => Mandate::where('status', 'dropped')->count(),
            ],
        ]);
    }

    public function show(Mandate $mandate): Response
    {
        return Inertia::render('Admin/Mandates/Show', [
            'mandate'           => $mandate->load(['client', 'activeClaim.recruiter.user', 'compensationType', 'submissions.candidate']),
            'clients'           => Client::get(['id', 'company_name']),
            'compensationTypes' => CompensationType::where('is_active', true)->get(),
            'recruiters'        => Recruiter::with('user')->withCapacity()->get(),
        ]);
    }

    public function store(StoreMandateRequest $request): RedirectResponse
    {
        $mandate = Mandate::create([
            ...$request->validated(),
            'posted_by_user_id'  => auth()->id(),
            'status'             => 'draft',
            'original_post_date' => now(),
        ]);

        return redirect()->route('admin.mandates.show', $mandate)
            ->with('success', 'Mandate created as draft. Publish when ready.');
    }

    public function update(StoreMandateRequest $request, Mandate $mandate): RedirectResponse
    {
        $mandate->update($request->validated());
        return redirect()->back()->with('success', 'Mandate updated.');
    }

    public function publish(Mandate $mandate): RedirectResponse
    {
        $mandate->update(['status' => 'active', 'published_at' => now()]);
        return redirect()->back()->with('success', 'Mandate published — now visible on job board.');
    }

    public function pause(Mandate $mandate): RedirectResponse
    {
        $mandate->update(['status' => 'paused']);
        return redirect()->back()->with('success', 'Mandate paused.');
    }

    public function close(Mandate $mandate): RedirectResponse
    {
        $mandate->update(['status' => 'closed']);

        if ($claim = $mandate->activeClaim) {
            $claim->recruiter->decrement('active_mandates_count');
        }

        return redirect()->back()->with('success', 'Mandate closed.');
    }

    public function reassign(Mandate $mandate, Request $request): RedirectResponse
    {
        $request->validate(['recruiter_id' => 'required|uuid|exists:recruiters,id']);

        $recruiter = Recruiter::findOrFail($request->recruiter_id);

        if (!$recruiter->hasCapacity()) {
            return redirect()->back()->with('error', 'This recruiter is at full capacity (2 active mandates).');
        }

        $claim = MandateClaim::create([
            'mandate_id'   => $mandate->id,
            'recruiter_id' => $recruiter->id,
            'status'       => 'approved',
            'admin_note'   => 'Manually assigned by admin.',
            'reviewed_by'  => auth()->id(),
            'reviewed_at'  => now(),
            'assigned_at'  => now(),
        ]);

        $mandate->increment('assignment_count');
        $recruiter->increment('active_mandates_count');

        app(TimerService::class)->startTimers($mandate, $claim);
        app(NotificationService::class)->claimApproved($claim);

        return redirect()->back()->with('success', 'Role manually assigned.');
    }

    public function kanbanMove(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id' => 'required|uuid|exists:cdd_submissions,id',
            'new_stage'     => 'required|in:pending,shortlisted,interview,offer_made,hired,rejected,on_hold',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        $submission->update([
            'client_status'            => $request->new_stage,
            'client_status_updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'new_stage' => $request->new_stage]);
    }
}
