<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Jobs\ParseCvJob;
use App\Models\Candidate;
use App\Models\Mandate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CandidateController extends Controller
{
    /**
     * Candidate library index.
     */
    public function index(Request $request)
    {
        $recruiter = auth()->user()->recruiter;

        $candidates = $recruiter->candidates()
            ->withCount('submissions')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Recruiter/Candidates/Index', [
            'candidates' => $candidates,
        ]);
    }

    /**
     * Candidate profile + tabs.
     */
    public function show(Candidate $candidate)
    {
        $recruiter = auth()->user()->recruiter;

        // Ensure recruiter owns this candidate
        abort_if($candidate->recruiter_id !== $recruiter->id, 403);

        $candidate->load(['submissions.mandate.client']);

        return Inertia::render('Recruiter/Candidates/Show', [
            'candidate' => $candidate,
        ]);
    }

    /**
     * Create a new candidate.
     */
    public function store(Request $request)
    {
        $recruiter = auth()->user()->recruiter;

        $validated = $request->validate([
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'email'           => 'nullable|email|max:255',
            'phone'           => 'nullable|string|max:50',
            'linkedin_url'    => 'nullable|url|max:255',
            'current_role'    => 'nullable|string|max:200',
            'current_company' => 'nullable|string|max:200',
            'current_salary'  => 'nullable|numeric|min:0',
            'expected_salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|max:3',
            'nationality'     => 'nullable|string|max:100',
            'location'        => 'nullable|string|max:200',
            'recruiter_notes' => 'nullable|string',
        ]);

        $candidate = $recruiter->candidates()->create($validated);

        // Handle CV upload if provided
        if ($request->hasFile('cv')) {
            $this->handleCvUpload($request, $candidate, $recruiter);
        }

        return redirect()->route('recruiter.candidates.show', $candidate)
            ->with('success', 'Candidate added to your library.');
    }

    /**
     * Update candidate profile.
     */
    public function update(Request $request, Candidate $candidate)
    {
        $recruiter = auth()->user()->recruiter;
        abort_if($candidate->recruiter_id !== $recruiter->id, 403);

        $validated = $request->validate([
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'email'           => 'nullable|email|max:255',
            'phone'           => 'nullable|string|max:50',
            'linkedin_url'    => 'nullable|url|max:255',
            'current_role'    => 'nullable|string|max:200',
            'current_company' => 'nullable|string|max:200',
            'current_salary'  => 'nullable|numeric|min:0',
            'expected_salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|max:3',
            'nationality'     => 'nullable|string|max:100',
            'location'        => 'nullable|string|max:200',
            'recruiter_notes' => 'nullable|string',
        ]);

        $candidate->update($validated);

        return redirect()->back()->with('success', 'Candidate updated.');
    }

    /**
     * Upload / replace a CV for a candidate.
     * Optionally carries a mandate_id to trigger AI scoring (Phase 6).
     */
    public function uploadCv(Request $request, Candidate $candidate)
    {
        $recruiter = auth()->user()->recruiter;
        abort_if($candidate->recruiter_id !== $recruiter->id, 403);

        $request->validate([
            'cv'         => 'required|file|mimes:pdf,doc,docx|max:10240',
            'mandate_id' => 'nullable|uuid|exists:mandates,id',
        ]);

        $this->handleCvUpload($request, $candidate, $recruiter);

        // Dispatch AI parsing job
        ParseCvJob::dispatch($candidate, $request->input('mandate_id'))->onQueue('ai');

        return redirect()->back()->with('success', 'CV uploaded. AI parsing queued.');
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function handleCvUpload(Request $request, Candidate $candidate, $recruiter): void
    {
        $file = $request->file('cv');
        $path = $file->store(
            "candidates/{$recruiter->id}",
            's3'
        );

        $candidate->update([
            'cv_file_path' => $path,
            'cv_file_name' => $file->getClientOriginalName(),
            'cv_parsed'    => false,
        ]);
    }
}
