<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\Placement;
use App\Models\Recruiter;
use Illuminate\Support\Facades\DB;
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

        // Monthly revenue (last 12 months)
        $monthlyRevenue = Placement::selectRaw("
                DATE_FORMAT(placed_at, '%Y-%m') as month,
                SUM(platform_fee)   as revenue,
                SUM(final_payout)   as recruiter_payouts,
                COUNT(*)            as placements
            ")
            ->where('placed_at', '>=', $now->copy()->subMonths(12)->startOfMonth())
            ->groupByRaw("DATE_FORMAT(placed_at, '%Y-%m')")
            ->orderByRaw("DATE_FORMAT(placed_at, '%Y-%m')")
            ->get();

        return Inertia::render('Admin/Analytics', [
            'funnel'             => $funnel,
            'leaderboard'        => $leaderboard,
            'monthlyRevenue'     => $monthlyRevenue,
            'avgTimeToFill'      => $this->avgTimeToFill(),
            'clientSatisfaction' => $this->clientSatisfaction(),
            'revenue'     => [
                'mtd' => $revenueMtd,
                'ytd' => $revenueYtd,
            ],
        ]);
    }

    private function avgTimeToFill(): float
    {
        return (float) (Placement::join('cdd_submissions', 'placements.cdd_submission_id', '=', 'cdd_submissions.id')
            ->join('mandate_claims', function ($join) {
                $join->on('cdd_submissions.mandate_id', '=', 'mandate_claims.mandate_id')
                     ->where('mandate_claims.status', 'approved');
            })
            ->whereYear('placements.placed_at', now()->year)
            ->selectRaw('AVG(TIMESTAMPDIFF(DAY, mandate_claims.assigned_at, placements.placed_at)) as avg_days')
            ->value('avg_days') ?? 0);
    }

    private function clientSatisfaction(): array
    {
        return CddSubmission::whereNotNull('client_status')
            ->where('client_status', '!=', 'pending')
            ->selectRaw('client_status, COUNT(*) as count')
            ->groupBy('client_status')
            ->pluck('count', 'client_status')
            ->toArray();
    }
}
