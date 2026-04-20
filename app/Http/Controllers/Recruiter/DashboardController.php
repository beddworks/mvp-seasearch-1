<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $recruiter = auth()->user()->recruiter;

        return Inertia::render('Recruiter/Dashboard', [
            'recruiter' => $recruiter->load('user'),
            'stats'     => [
                'active_mandates'  => $recruiter->active_mandates_count,
                'total_placements' => $recruiter->total_placements ?? 0,
                'total_earnings'   => $recruiter->total_earnings ?? 0,
                'pending_cdd'      => 0, // populated in Phase 7
            ],
        ]);
    }
}
