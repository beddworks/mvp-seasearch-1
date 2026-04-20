<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\CddSubmission;
use App\Models\Mandate;
use Illuminate\Support\Facades\Http;

class ClaudeService
{
    private string $apiKey;
    private string $model = 'claude-sonnet-4-6';
    private string $baseUrl = 'https://api.anthropic.com/v1/messages';

    public function __construct()
    {
        $this->apiKey = config('services.anthropic.api_key');
    }

    private function call(string $prompt, int $maxTokens = 1000): string
    {
        $response = Http::timeout(60)->withHeaders([
            'x-api-key'         => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->post($this->baseUrl, [
            'model'      => $this->model,
            'max_tokens' => $maxTokens,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        if (!$response->successful()) {
            throw new \Exception('Claude API error: ' . $response->body());
        }

        return $response->json('content.0.text');
    }

    // ── CV PARSING ──────────────────────────────────────────────────────────

    public function parseCV(string $cvText): array
    {
        $prompt = <<<PROMPT
You are an expert CV parser for an executive recruitment platform in Southeast Asia.
Extract structured data from the CV below.

IMPORTANT: Return ONLY valid JSON with NO markdown, NO backticks, NO preamble.

Required JSON structure:
{
  "name": "string",
  "email": "string or null",
  "phone": "string or null",
  "linkedin": "string or null",
  "current_role": "string",
  "current_company": "string",
  "years_experience": integer,
  "seniority_level": "c_suite|vp_director|manager|ic",
  "work_history": [{"title": "", "company": "", "dates": "", "description": ""}],
  "education": [{"degree": "", "institution": "", "year": ""}],
  "skills": ["string"],
  "achievements": ["string"]
}

CV TEXT:
{$cvText}
PROMPT;

        $raw   = $this->call($prompt, 1500);
        $clean = preg_replace('/```json|```/', '', $raw);
        return json_decode(trim($clean), true) ?? [];
    }

    // ── CANDIDATE SCORING ────────────────────────────────────────────────────

    public function scoreCandidate(array $parsedProfile, Mandate $mandate): array
    {
        $mustHaves  = implode("\n- ", $mandate->must_haves ?? []);
        $niceHaves  = implode("\n- ", $mandate->nice_to_haves ?? []);
        $greenFlags = implode("\n- ", $mandate->green_flags ?? []);
        $redFlags   = implode("\n- ", $mandate->red_flags ?? []);
        $candidateJson = json_encode($parsedProfile);

        $mandate->loadMissing('client');

        $prompt = <<<PROMPT
You are an expert executive recruiter scoring a candidate for a role in Southeast Asia.

ROLE: {$mandate->title}
CLIENT: {$mandate->client->company_name}
SENIORITY: {$mandate->seniority}
INDUSTRY: {$mandate->industry}
LOCATION: {$mandate->location}

MUST HAVES:
- {$mustHaves}

NICE TO HAVES:
- {$niceHaves}

GREEN FLAGS (ideal signals):
- {$greenFlags}

RED FLAGS (disqualifiers):
- {$redFlags}

CANDIDATE PROFILE:
{$candidateJson}

Score the candidate across 5 dimensions (0–100 each):
- experience: years + seniority match
- industry: sector alignment
- scope: team/market size match
- leadership: board/exec exposure
- digital: tech/systems capability

Return ONLY valid JSON, NO markdown:
{
  "overall_score": integer (0-100, weighted average),
  "breakdown": {
    "experience": integer,
    "industry": integer,
    "scope": integer,
    "leadership": integer,
    "digital": integer
  },
  "green_flags": ["string — specific strengths from this candidate's profile"],
  "red_flags": ["string — specific gaps or risks for this role"],
  "summary": "3–5 sentence executive-level summary of this candidate for the hiring manager. Concise, direct, no filler."
}
PROMPT;

        $raw   = $this->call($prompt, 1000);
        $clean = preg_replace('/```json|```/', '', $raw);
        return json_decode(trim($clean), true) ?? [
            'overall_score' => 0,
            'breakdown'     => ['experience' => 0, 'industry' => 0, 'scope' => 0, 'leadership' => 0, 'digital' => 0],
            'green_flags'   => [],
            'red_flags'     => [],
            'summary'       => '',
        ];
    }

    // ── RECRUITER BRIEF ──────────────────────────────────────────────────────

    public function generateBrief(CddSubmission $submission): string
    {
        $candidate  = $submission->candidate;
        $mandate    = $submission->mandate;
        $recruiterNote = $submission->recruiter_note ?? '';
        $breakdown  = json_encode($submission->score_breakdown);
        $greenStr   = implode(', ', $submission->green_flags ?? []);
        $redStr     = implode(', ', $submission->red_flags ?? []);

        $prompt = <<<PROMPT
Write a professional candidate brief for a C-suite hiring manager.

ROLE: {$mandate->title} at {$mandate->client->company_name}
CANDIDATE: {$candidate->first_name} {$candidate->last_name}
CURRENT POSITION: {$candidate->current_role} at {$candidate->current_company}
YEARS EXPERIENCE: {$candidate->years_experience}
AI MATCH SCORES: {$breakdown}
GREEN FLAGS: {$greenStr}
RED FLAGS: {$redStr}
RECRUITER'S NOTE: {$recruiterNote}

Write 3–5 sentences. Tone: executive, concise, direct — no filler language.
Start with the candidate's name and current role.
Highlight 2–3 key strengths. Note any relevant concern if red flags exist.
Return ONLY the plain text brief — no headings, no JSON.
PROMPT;

        return $this->call($prompt, 400);
    }

    // ── OUTREACH EMAIL ───────────────────────────────────────────────────────

    public function draftOutreach(Candidate $candidate, Mandate $mandate): array
    {
        $mandate->loadMissing('client');
        $skillList = implode(', ', array_slice($candidate->skills ?? [], 0, 5));

        $prompt = <<<PROMPT
Draft a personalised cold outreach email from a headhunter to a senior executive candidate.

CANDIDATE NAME: {$candidate->first_name} {$candidate->last_name}
CANDIDATE CURRENT ROLE: {$candidate->current_role} at {$candidate->current_company}
TARGET ROLE: {$mandate->title}
HIRING COMPANY: {$mandate->client->company_name}
KEY MATCHING REASONS: {$skillList}

Requirements:
- Subject line: compelling, specific, not generic
- Body: 150–200 words
- Tone: professional but warm, peer-to-peer (not HR-speak)
- Personalise using their current role
- Do NOT promise compensation specifics

Return ONLY valid JSON:
{
  "subject": "string",
  "body": "string (plain text, line breaks with \\n)"
}
PROMPT;

        $raw   = $this->call($prompt, 500);
        $clean = preg_replace('/```json|```/', '', $raw);
        return json_decode(trim($clean), true) ?? ['subject' => '', 'body' => ''];
    }

    // ── INTERVIEW QUESTIONS ──────────────────────────────────────────────────

    public function generateInterviewQuestions(CddSubmission $submission): array
    {
        $candidate = $submission->candidate;
        $mandate   = $submission->mandate;
        $redFlags  = implode(', ', $submission->red_flags ?? []);
        $gaps      = $redFlags ?: 'none identified';
        $mustHaves = implode(', ', $mandate->must_haves ?? []);

        $prompt = <<<PROMPT
Generate targeted interview questions for an executive candidate.

ROLE: {$mandate->title} at {$mandate->client->company_name}
SENIORITY: {$mandate->seniority}
INDUSTRY: {$mandate->industry}
CANDIDATE: {$candidate->first_name} {$candidate->last_name} — {$candidate->current_role}
IDENTIFIED GAPS/CONCERNS: {$gaps}
MUST HAVES: {$mustHaves}

Generate 8–10 questions. Mix: behavioural (STAR), technical, gap-probing.
Prioritise questions that address the identified gaps.

Return ONLY valid JSON:
{
  "questions": [
    {"type": "behavioural|technical|gap", "question": "string"}
  ]
}
PROMPT;

        $raw    = $this->call($prompt, 800);
        $clean  = preg_replace('/```json|```/', '', $raw);
        $parsed = json_decode(trim($clean), true);
        return $parsed['questions'] ?? [];
    }
}
