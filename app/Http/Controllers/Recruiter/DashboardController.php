<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $recruiter = auth()->user()->recruiter->load('user');

        $activeMandates = $recruiter->mandateClaims()
            ->where('status', 'approved')
            ->with(['mandate.client'])
            ->get();

        $recentCandidates = $recruiter->candidates()
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Recruiter/Dashboard', [
            'recruiter'        => $recruiter,
            'activeMandates'   => $activeMandates,
            'recentCandidates' => $recentCandidates,
            'stats'            => [
                'active_mandates'  => $recruiter->active_mandates_count,
                'total_placements' => $recruiter->total_placements ?? 0,
                'total_earnings'   => $recruiter->total_earnings ?? 0,
                'pending_cdd'      => $recruiter->cddSubmissions()
                    ->where('admin_review_status', 'pending')
                    ->count(),
                'total_candidates' => $recruiter->candidates()->count(),
            ],
        ]);
    }
}
