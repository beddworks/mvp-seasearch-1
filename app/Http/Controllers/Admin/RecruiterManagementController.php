<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Recruiter;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Recruiters/Index', [
            'recruiters' => Recruiter::with('user')
                ->withCount(['claims', 'submissions', 'placements'])
                ->latest()
                ->paginate(25),
            'stats' => [
                'total'   => Recruiter::count(),
                'active'  => User::recruiters()->where('status', 'active')->count(),
                'pending' => User::recruiters()->where('status', 'pending')->count(),
            ],
        ]);
    }

    public function show(Recruiter $recruiter): Response
    {
        return Inertia::render('Admin/Recruiters/Show', [
            'recruiter'        => $recruiter->load('user', 'activeClaims.mandate.client'),
            'activeMandates'   => $recruiter->activeClaims()->with('mandate.client')->get(),
            'recentPlacements' => $recruiter->placements()->with('mandate')->latest()->take(10)->get(),
            'tiers'            => ['junior', 'senior', 'elite'],
            'trustLevels'      => ['standard', 'trusted'],
            'groups'           => ['Dwikar', 'Emma', 'BTI', 'Jiebei'],
        ]);
    }

    public function approve(Recruiter $recruiter): RedirectResponse
    {
        $recruiter->user->update(['status' => 'active']);
        app(NotificationService::class)->recruiterApproved($recruiter);
        return redirect()->back()->with('success', 'Recruiter approved.');
    }

    public function suspend(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $recruiter->user->update(['status' => 'suspended']);
        app(NotificationService::class)->recruiterSuspended($recruiter, $request->reason);
        return redirect()->back()->with('success', 'Recruiter suspended.');
    }

    public function setTier(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate(['tier' => 'required|in:junior,senior,elite']);
        $recruiter->update(['tier' => $request->tier]);
        return redirect()->back()->with('success', "Tier updated to {$request->tier}.");
    }

    public function setTrust(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate(['trust_level' => 'required|in:standard,trusted']);
        $recruiter->update(['trust_level' => $request->trust_level]);
        return redirect()->back()->with('success', "Trust level updated to {$request->trust_level}.");
    }

    public function setGroup(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate([
            'recruiter_group'           => 'nullable|string|max:50',
            'recruiter_group_secondary' => 'nullable|string|max:50',
        ]);
        $recruiter->update($request->only('recruiter_group', 'recruiter_group_secondary'));
        return redirect()->back()->with('success', 'Group updated.');
    }
}
