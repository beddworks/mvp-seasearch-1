<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\Placement;
use App\Models\Recruiter;
use App\Models\ReportTemplate;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = now();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_recruiters'    => Recruiter::count(),
                'active_recruiters'   => User::recruiters()->where('status', 'active')->count(),
                'pending_claims'      => MandateClaim::where('status', 'pending')->count(),
                'pending_cdd_reviews' => CddSubmission::pendingAdminReview()->count(),
                'active_mandates'     => Mandate::active()->count(),
                'unclaimed_24h'       => Mandate::active()->unclaimed()
                                            ->where('original_post_date', '<=', $now->copy()->subHours(24))
                                            ->count(),
                'placements_mtd'      => Placement::whereMonth('placed_at', $now->month)->count(),
                'revenue_mtd'         => Placement::whereMonth('placed_at', $now->month)->sum('platform_fee') ?? 0,
            ],
            'pendingClaims'      => MandateClaim::with(['mandate.client', 'recruiter.user'])
                                        ->where('status', 'pending')
                                        ->latest()->take(8)->get(),
            'pendingSubmissions' => CddSubmission::with(['mandate.client', 'candidate', 'recruiter.user'])
                                        ->pendingAdminReview()
                                        ->latest()->take(8)->get(),
            'unclaimedRoles'     => Mandate::active()->unclaimed()
                                        ->with('client')
                                        ->where('original_post_date', '<=', $now->copy()->subHours(24))
                                        ->orderBy('original_post_date')
                                        ->take(5)->get(),
            'reportTemplates'    => ReportTemplate::where('is_active', true)->get(['id', 'name', 'type']),
        ]);
    }
}
