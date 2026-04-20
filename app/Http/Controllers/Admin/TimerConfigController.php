<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mandate;
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
                'timer_a_days'           => config('seasearch.timer_a_days', 3),
                'timer_b_active'         => config('seasearch.timer_b_active', false),
                'timer_b_days'           => config('seasearch.timer_b_days', 5),
                'timer_b_penalty_d6'     => config('seasearch.timer_b_penalty_d6', 10),
                'timer_b_penalty_d7'     => config('seasearch.timer_b_penalty_d7', 20),
                'timer_b_penalty_d8plus' => config('seasearch.timer_b_penalty_d8plus', 30),
                'timer_c_active'         => config('seasearch.timer_c_active', false),
                'timer_c_sla_days'       => config('seasearch.timer_c_sla_days', 5),
            ],
            'mandates' => Mandate::whereIn('status', ['active', 'paused'])
                ->with('client:id,company_name')
                ->get(['id', 'title', 'status', 'client_id',
                       'timer_a_days', 'timer_b_active', 'timer_b_days',
                       'timer_b_penalty_d6', 'timer_b_penalty_d7', 'timer_b_penalty_d8plus',
                       'timer_c_active', 'timer_c_sla_days']),
        ]);
    }

    public function update(Request $request, Mandate $mandate): RedirectResponse
    {
        $validated = $request->validate([
            'timer_a_days'           => 'required|integer|min:1|max:30',
            'timer_b_active'         => 'boolean',
            'timer_b_days'           => 'required|integer|min:1|max:30',
            'timer_b_penalty_d6'     => 'required|numeric|min:0|max:1',
            'timer_b_penalty_d7'     => 'required|numeric|min:0|max:1',
            'timer_b_penalty_d8plus' => 'required|numeric|min:0|max:1',
            'timer_c_active'         => 'boolean',
            'timer_c_sla_days'       => 'required|integer|min:1|max:30',
        ]);

        $mandate->update($validated);

        return redirect()->back()->with('success', 'Timer configuration updated.');
    }
}

