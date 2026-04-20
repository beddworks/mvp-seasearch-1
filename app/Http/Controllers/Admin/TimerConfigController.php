<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimerConfigController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Settings/TimerConfig', [
            'defaults' => [
                'timer_a_days'           => config('seasearch.timer_a_days', 5),
                'timer_b_active'         => config('seasearch.timer_b_active', false),
                'timer_b_days'           => config('seasearch.timer_b_days', 5),
                'timer_b_penalty_d6'     => config('seasearch.timer_b_penalty_d6', 10),
                'timer_b_penalty_d7'     => config('seasearch.timer_b_penalty_d7', 20),
                'timer_b_penalty_d8plus' => config('seasearch.timer_b_penalty_d8plus', 30),
                'timer_c_active'         => config('seasearch.timer_c_active', false),
                'timer_c_sla_days'       => config('seasearch.timer_c_sla_days', 5),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        // Timer config is per-mandate in this system.
        // Global defaults will use config() + settings table in Phase 10.
        return redirect()->back()->with('success', 'Timer defaults noted. Apply per mandate when creating/editing.');
    }
}
