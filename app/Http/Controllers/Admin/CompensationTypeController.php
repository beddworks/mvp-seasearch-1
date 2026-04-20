<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompensationType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompensationTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Settings/CompensationTypes', [
            'compensationTypes' => CompensationType::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'              => 'required|string|max:100',
            'formula_type'      => 'required|in:percentage,hourly,fixed,milestone',
            'trigger_condition' => 'required|string|max:50',
            'platform_fee_pct'  => 'required|numeric|between:0,1',
            'notes'             => 'nullable|string',
        ]);

        CompensationType::create($request->validated());

        return redirect()->back()->with('success', 'Compensation type created.');
    }

    public function update(CompensationType $compensationType, Request $request): RedirectResponse
    {
        $request->validate([
            'name'              => 'required|string|max:100',
            'trigger_condition' => 'required|string|max:50',
            'platform_fee_pct'  => 'required|numeric|between:0,1',
            'is_active'         => 'boolean',
            'notes'             => 'nullable|string',
        ]);

        $compensationType->update($request->validated());

        return redirect()->back()->with('success', 'Compensation type updated.');
    }

    public function destroy(CompensationType $compensationType): RedirectResponse
    {
        $compensationType->delete();
        return redirect()->back()->with('success', 'Compensation type deleted.');
    }
}
