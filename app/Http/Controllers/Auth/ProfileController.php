<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\CompensationType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/ProfileComplete', [
            'recruiter'         => auth()->user()->recruiter,
            'compensationTypes' => CompensationType::where('is_active', true)
                                    ->get(['id', 'name', 'formula_type']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'display_name'      => 'nullable|string|max:100',
            'phone'             => 'nullable|string|max:30',
            'linkedin_url'      => 'nullable|url|max:255',
            'years_experience'  => 'nullable|integer|min:0|max:50',
            'current_firm'      => 'nullable|string|max:100',
            'bio'               => 'nullable|string|max:1000',
            'ea_license_number' => 'nullable|string|max:50',
            'ea_certificate'    => 'nullable|file|mimes:pdf|max:5120',
            'industries'        => 'nullable|array',
            'geographies'       => 'nullable|array',
            'specialty'         => 'nullable|string|max:200',
        ]);

        $recruiter = auth()->user()->recruiter;

        if ($request->hasFile('ea_certificate')) {
            $path = $request->file('ea_certificate')
                ->store("ea-certs/{$recruiter->id}", 's3');
            $validated['ea_certificate_url'] = $path;
            unset($validated['ea_certificate']);
        }

        $recruiter->update([
            ...$validated,
            'profile_complete' => true,
        ]);

        return redirect()->route('recruiter.dashboard')
            ->with('success', 'Profile saved! Welcome to SeaSearch.');
    }

    public function skip(): RedirectResponse
    {
        session(['profile_skip' => true]);
        return redirect()->route('recruiter.dashboard');
    }
}
