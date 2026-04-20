<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\CddSubmission;
use App\Models\Placement;
use App\Services\CommissionService;
use App\Services\NotificationService;
use App\Services\StripeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EarningsController extends Controller
{
    public function index(): Response
    {
        $recruiter = auth()->user()->recruiter->load('user');
        $now       = now();

        // Monthly earnings breakdown (last 12 months)
        $monthly = Placement::where('recruiter_id', $recruiter->id)
            ->selectRaw("DATE_FORMAT(placed_at, '%Y-%m') as month, SUM(final_payout) as earnings, COUNT(*) as placements")
            ->where('placed_at', '>=', $now->copy()->subMonths(12)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Pending rewards: candidates at offer/hired not yet settled
        $pending = CddSubmission::where('recruiter_id', $recruiter->id)
            ->whereIn('client_status', ['offer_made', 'hired'])
            ->whereDoesntHave('placement')
            ->with(['mandate.client', 'candidate', 'mandate.compensationType'])
            ->get()
            ->map(function ($sub) {
                $estimate = 0;
                if ($sub->mandate->compensationType) {
                    try {
                        $estimate = app(CommissionService::class)->calculate($sub)['final_payout'];
                    } catch (\Exception) {}
                }
                return [
                    'id'               => $sub->id,
                    'candidate_name'   => $sub->candidate?->full_name ?? 'Unknown',
                    'mandate_title'    => $sub->mandate->title,
                    'client_name'      => $sub->mandate->client?->company_name ?? '—',
                    'client_status'    => $sub->client_status,
                    'estimated_payout' => round($estimate, 2),
                    'currency'         => $sub->mandate->salary_currency ?? 'SGD',
                    'submitted_at'     => $sub->submitted_at,
                ];
            });

        // Placements history
        $placements = Placement::where('recruiter_id', $recruiter->id)
            ->with(['mandate.client', 'cddSubmission.candidate'])
            ->latest('placed_at')
            ->paginate(15);

        return Inertia::render('Recruiter/Earnings/Index', [
            'summary' => [
                'ytd_earnings'      => Placement::where('recruiter_id', $recruiter->id)
                                        ->whereYear('placed_at', $now->year)->sum('final_payout') ?? 0,
                'pending_rewards'   => $pending->sum('estimated_payout'),
                'placements_ytd'    => Placement::where('recruiter_id', $recruiter->id)
                                        ->whereYear('placed_at', $now->year)->count(),
                'avg_reward'        => Placement::where('recruiter_id', $recruiter->id)
                                        ->whereYear('placed_at', $now->year)->avg('final_payout') ?? 0,
                'available_balance' => Placement::where('recruiter_id', $recruiter->id)
                                        ->where('payout_status', 'pending')->sum('final_payout') ?? 0,
                'total_placements'  => $recruiter->total_placements ?? 0,
                'total_earnings'    => $recruiter->total_earnings ?? 0,
            ],
            'monthly'        => $monthly,
            'placements'     => $placements,
            'pending'        => $pending,
            'payoutHistory'  => Placement::where('recruiter_id', $recruiter->id)
                                ->whereIn('payout_status', ['paid', 'processing', 'failed'])
                                ->latest('payout_date')
                                ->take(10)
                                ->get(),
        ]);
    }

    public function requestPayout(Request $request): RedirectResponse
    {
        $request->validate([
            'bank_name'      => 'required|string|max:100',
            'account_number' => 'required|string|max:50',
            'account_holder' => 'required|string|max:100',
            'swift_code'     => 'nullable|string|max:20',
        ]);

        $recruiter          = auth()->user()->recruiter;
        $pendingPlacements  = Placement::where('recruiter_id', $recruiter->id)
            ->where('payout_status', 'pending')
            ->get();

        if ($pendingPlacements->isEmpty()) {
            return redirect()->back()->with('error', 'No pending balance to payout.');
        }

        try {
            $total = $pendingPlacements->sum('final_payout');
            app(StripeService::class)->createTransfer(
                $total,
                $request->only('bank_name', 'account_number', 'account_holder', 'swift_code'),
                $recruiter
            );

            $pendingPlacements->each->update(['payout_status' => 'processing']);
            app(NotificationService::class)->payoutRequested($recruiter, $total);

            return redirect()->back()->with('success', 'Payout request submitted. Processing in 2–3 business days.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Payout failed: ' . $e->getMessage());
        }
    }
}
