<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MandateClaim;
use App\Services\ClaimService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClaimApprovalController extends Controller
{
    public function __construct(
        private ClaimService $claimService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Claims/Index', [
            'claims' => MandateClaim::with(['mandate.client', 'recruiter.user'])
                ->where('status', 'pending')
                ->latest()
                ->paginate(25),
            'pendingCount' => MandateClaim::where('status', 'pending')->count(),
        ]);
    }

    public function approve(MandateClaim $claim, Request $request): RedirectResponse
    {
        $request->validate(['note' => 'nullable|string|max:500']);

        if ($claim->status !== 'pending') {
            return redirect()->back()->with('error', 'Claim is no longer pending.');
        }

        $this->claimService->approve($claim, auth()->user(), $request->note);

        return redirect()->back()->with('success', 'Claim approved. Day 0 has started.');
    }

    public function reject(MandateClaim $claim, Request $request): RedirectResponse
    {
        $request->validate(['note' => 'required|string|max:500']);

        $this->claimService->reject($claim, auth()->user(), $request->note);

        return redirect()->back()->with('success', 'Claim rejected. Recruiter notified.');
    }
}
