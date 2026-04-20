<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CddSubmission;
use App\Models\Mandate;
use App\Services\ClaudeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    /**
     * Generate an executive candidate brief for a CDD submission.
     * POST /recruiter/ai/generate-brief/{submission}
     */
    public function generateBrief(CddSubmission $submission, ClaudeService $claude): JsonResponse
    {
        $recruiter = auth()->user()->recruiter;
        abort_if($submission->recruiter_id !== $recruiter->id, 403);

        $submission->loadMissing(['candidate', 'mandate.client']);
        $brief = $claude->generateBrief($submission);

        return response()->json(['brief' => $brief]);
    }

    /**
     * Draft a cold outreach email to a candidate for a mandate.
     * POST /recruiter/ai/draft-outreach/{candidate}  — body: { mandate_id }
     */
    public function draftOutreach(Candidate $candidate, Request $request, ClaudeService $claude): JsonResponse
    {
        $recruiter = auth()->user()->recruiter;
        abort_if($candidate->recruiter_id !== $recruiter->id, 403);

        $request->validate(['mandate_id' => 'required|uuid|exists:mandates,id']);
        $mandate = Mandate::with('client')->findOrFail($request->input('mandate_id'));

        $email = $claude->draftOutreach($candidate, $mandate);
        return response()->json($email);
    }

    /**
     * Generate interview questions for a CDD submission.
     * POST /recruiter/ai/interview-questions/{submission}
     */
    public function interviewQuestions(CddSubmission $submission, ClaudeService $claude): JsonResponse
    {
        $recruiter = auth()->user()->recruiter;
        abort_if($submission->recruiter_id !== $recruiter->id, 403);

        $submission->loadMissing(['candidate', 'mandate.client']);
        $questions = $claude->generateInterviewQuestions($submission);

        return response()->json(['questions' => $questions]);
    }

    /**
     * Run AI matching / scoring on all submissions for a mandate.
     * POST /recruiter/ai/run-matching/{mandate}
     */
    public function runMatching(Mandate $mandate, ClaudeService $claude): JsonResponse
    {
        $recruiter = auth()->user()->recruiter;

        $submissions = CddSubmission::with('candidate')
            ->where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->get();

        if ($submissions->isEmpty()) {
            return response()->json(['results' => []]);
        }

        $mandate->loadMissing('client');

        $results = $submissions->map(function (CddSubmission $sub) use ($claude, $mandate) {
            $parsedProfile = $sub->candidate->parsed_profile ?? [];

            $scoring = $claude->scoreCandidate($parsedProfile, $mandate);

            $sub->update([
                'ai_score'        => $scoring['overall_score'],
                'score_breakdown' => $scoring['breakdown'],
                'ai_summary'      => $scoring['summary'],
                'green_flags'     => $scoring['green_flags'],
                'red_flags'       => $scoring['red_flags'],
            ]);

            return [
                'id'      => $sub->id,
                'score'   => $scoring['overall_score'],
                'summary' => $scoring['summary'],
            ];
        });

        return response()->json(['results' => $results]);
    }
}
