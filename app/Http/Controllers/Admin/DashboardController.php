<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mandate;
use App\Models\Recruiter;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_recruiters' => Recruiter::count(),
                'active_mandates'  => Mandate::where('status', 'active')->count(),
                'total_users'      => User::count(),
                'pending_claims'   => 0, // populated in Phase 4
            ],
        ]);
    }
}
