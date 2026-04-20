<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\Placement;
use App\Models\Recruiter;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        $now = now();

        // Placement funnel (YTD)
        $funnel = [
            'mandates_posted'  => Mandate::whereYear('created_at', $now->year)->count(),
            'mandates_picked'  => MandateClaim::whereYear('created_at', $now->year)->count(),
            'cdd_submitted'    => CddSubmission::whereYear('submitted_at', $now->year)->count(),
            'cdd_to_interview' => CddSubmission::whereYear('submitted_at', $now->year)
                                    ->where('client_status', 'interview')->count(),
            'offers_made'      => CddSubmission::whereYear('submitted_at', $now->year)
                                    ->where('client_status', 'offer_made')->count(),
            'placements'       => Placement::whereYear('placed_at', $now->year)->count(),
        ];

        // Recruiter leaderboard (YTD)
        $leaderboard = Recruiter::with('user')
            ->withCount(['placements as placements_ytd' => fn($q) =>
                $q->whereYear('placed_at', $now->year)
            ])
            ->withSum(['placements as earnings_ytd' => fn($q) =>
                $q->whereYear('placed_at', $now->year)
            ], 'final_payout')
            ->orderByDesc('placements_ytd')
            ->take(10)
            ->get();

        // Revenue summary
        $revenueMtd = Placement::whereMonth('placed_at', $now->month)->whereYear('placed_at', $now->year)->sum('platform_fee') ?? 0;
        $revenueYtd = Placement::whereYear('placed_at', $now->year)->sum('platform_fee') ?? 0;

        return Inertia::render('Admin/Analytics', [
            'funnel'      => $funnel,
            'leaderboard' => $leaderboard,
            'revenue'     => [
                'mtd' => $revenueMtd,
                'ytd' => $revenueYtd,
            ],
        ]);
    }
}
