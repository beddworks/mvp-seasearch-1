<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class EarningsController extends Controller
{
    public function index(): Response
    {
        $recruiter = auth()->user()->recruiter->load('user');

        return Inertia::render('Recruiter/Earnings/Index', [
            'recruiter' => $recruiter,
            'stats' => [
                'total_earnings'   => $recruiter->total_earnings ?? 0,
                'total_placements' => $recruiter->total_placements ?? 0,
                'pending_payout'   => 0,
            ],
            'placements' => [],
        ]);
    }
}
