# 16 — AI: Claude Integration
> SeaSearch Production Documentation · v1.0  
> Model: claude-sonnet-4-6 · All calls server-side only

---

## ClaudeService

```php
// Services/ClaudeService.php
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
        $response = Http::withHeaders([
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

    // ── CV PARSING ──────────────────────────────────────────────────────

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

        $raw = $this->call($prompt, 1500);

        // Strip any accidental markdown fences
        $clean = preg_replace('/```json|```/', '', $raw);
        return json_decode(trim($clean), true) ?? [];
    }

    // ── CANDIDATE SCORING ────────────────────────────────────────────────

    public function scoreCandidate(array $parsedProfile, Mandate $mandate): array
    {
        $mustHaves   = implode("\n- ", $mandate->must_haves ?? []);
        $niceHaves   = implode("\n- ", $mandate->nice_to_haves ?? []);
        $greenFlags  = implode("\n- ", $mandate->green_flags ?? []);
        $redFlags    = implode("\n- ", $mandate->red_flags ?? []);
        $candidateJson = json_encode($parsedProfile);

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
            'breakdown'     => ['experience'=>0,'industry'=>0,'scope'=>0,'leadership'=>0,'digital'=>0],
            'green_flags'   => [],
            'red_flags'     => [],
            'summary'       => '',
        ];
    }

    // ── RECRUITER BRIEF ──────────────────────────────────────────────────

    public function generateBrief(CddSubmission $submission): string
    {
        $candidate  = $submission->candidate;
        $mandate    = $submission->mandate;
        $recruiterNote = $submission->recruiter_note ?? '';
        $breakdown  = json_encode($submission->score_breakdown);

        $prompt = <<<PROMPT
Write a professional candidate brief for a C-suite hiring manager.

ROLE: {$mandate->title} at {$mandate->client->company_name}
CANDIDATE: {$candidate->first_name} {$candidate->last_name}
CURRENT POSITION: {$candidate->current_role} at {$candidate->current_company}
YEARS EXPERIENCE: {$candidate->years_experience}
AI MATCH SCORES: {$breakdown}
GREEN FLAGS: {implode(', ', $submission->green_flags ?? [])}
RED FLAGS: {implode(', ', $submission->red_flags ?? [])}
RECRUITER'S NOTE: {$recruiterNote}

Write 3–5 sentences. Tone: executive, concise, direct — no filler language.
Start with the candidate's name and current role.
Highlight 2–3 key strengths. Note any relevant concern if red flags exist.
Return ONLY the plain text brief — no headings, no JSON.
PROMPT;

        return $this->call($prompt, 400);
    }

    // ── OUTREACH EMAIL ───────────────────────────────────────────────────

    public function draftOutreach(Candidate $candidate, Mandate $mandate): array
    {
        $prompt = <<<PROMPT
Draft a personalised cold outreach email from a headhunter to a senior executive candidate.

CANDIDATE NAME: {$candidate->first_name} {$candidate->last_name}
CANDIDATE CURRENT ROLE: {$candidate->current_role} at {$candidate->current_company}
TARGET ROLE: {$mandate->title}
HIRING COMPANY (can be confidential): {$mandate->client->company_name}
KEY MATCHING REASONS: {implode(', ', array_slice($candidate->skills ?? [], 0, 5))}

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

    // ── INTERVIEW QUESTIONS ──────────────────────────────────────────────

    public function generateInterviewQuestions(CddSubmission $submission): array
    {
        $candidate  = $submission->candidate;
        $mandate    = $submission->mandate;
        $redFlags   = implode(', ', $submission->red_flags ?? []);
        $gaps       = $redFlags ?: 'none identified';

        $prompt = <<<PROMPT
Generate targeted interview questions for an executive candidate.

ROLE: {$mandate->title} at {$mandate->client->company_name}
SENIORITY: {$mandate->seniority}
INDUSTRY: {$mandate->industry}
CANDIDATE: {$candidate->first_name} {$candidate->last_name} — {$candidate->current_role}
IDENTIFIED GAPS/CONCERNS: {$gaps}
MUST HAVES: {implode(', ', $mandate->must_haves ?? [])}

Generate 8–10 questions. Mix: behavioural (STAR), technical, gap-probing.
Prioritise questions that address the identified gaps.

Return ONLY valid JSON:
{
  "questions": [
    {"type": "behavioural|technical|gap", "question": "string"}
  ]
}
PROMPT;

        $raw   = $this->call($prompt, 800);
        $clean = preg_replace('/```json|```/', '', $raw);
        $parsed = json_decode(trim($clean), true);
        return $parsed['questions'] ?? [];
    }
}
```

---

## AI Routes (Recruiter)

```php
// All AI calls are POST routes — no sensitive data in GET params
Route::middleware(['auth', 'role:recruiter'])->prefix('recruiter/ai')->name('recruiter.ai.')->group(function () {
    Route::post('/generate-brief/{submission}',     [AiController::class, 'generateBrief'])->name('brief');
    Route::post('/draft-outreach/{candidate}',      [AiController::class, 'draftOutreach'])->name('outreach');
    Route::post('/interview-questions/{submission}',[AiController::class, 'interviewQuestions'])->name('questions');
    Route::post('/run-matching/{mandate}',          [AiController::class, 'runMatching'])->name('matching');
});
```

## AiController (thin)

```php
class AiController extends Controller
{
    public function generateBrief(CddSubmission $submission, ClaudeService $claude): JsonResponse
    {
        $brief = $claude->generateBrief($submission);
        return response()->json(['brief' => $brief]);
    }

    public function draftOutreach(Candidate $candidate, Request $request, ClaudeService $claude): JsonResponse
    {
        $mandate = Mandate::findOrFail($request->input('mandate_id'));
        $email   = $claude->draftOutreach($candidate, $mandate);
        return response()->json($email);
    }

    public function interviewQuestions(CddSubmission $submission, ClaudeService $claude): JsonResponse
    {
        $questions = $claude->generateInterviewQuestions($submission);
        return response()->json(['questions' => $questions]);
    }

    public function runMatching(Mandate $mandate, ClaudeService $claude): JsonResponse
    {
        $submissions = CddSubmission::with('candidate')
            ->where('mandate_id', $mandate->id)
            ->where('recruiter_id', auth()->user()->recruiter->id)
            ->whereNotNull('cv_parsed_at')
            ->get();

        $results = $submissions->map(function ($sub) use ($claude, $mandate) {
            $scoring = $claude->scoreCandidate($sub->candidate->parsed_profile ?? [], $mandate);
            $sub->update([
                'ai_score'        => $scoring['overall_score'],
                'score_breakdown' => $scoring['breakdown'],
                'ai_summary'      => $scoring['summary'],
                'green_flags'     => $scoring['green_flags'],
                'red_flags'       => $scoring['red_flags'],
            ]);
            return ['id' => $sub->id, 'score' => $scoring['overall_score']];
        });

        return response()->json(['results' => $results]);
    }
}
```

---

## React AI Panel Component

```jsx
// Used in Role Workspace — AI Matching tab
function AiMatchingPanel({ mandate, submissions }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(submissions)

  async function runMatching() {
    setLoading(true)
    const res = await fetch(route('recruiter.ai.matching', mandate.id), {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content },
    })
    const data = await res.json()
    // Update local state with new scores
    setResults(prev => prev.map(s => {
      const updated = data.results.find(r => r.id === s.id)
      return updated ? { ...s, ai_score: updated.score } : s
    }))
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--violet2)', background: 'var(--violet-pale)', padding: '3px 10px', borderRadius: 20 }}>
          ✦ Claude AI
        </div>
        <button className="btn btn-secondary btn-sm" onClick={runMatching} disabled={loading}>
          {loading ? 'Scoring...' : 'Run AI matching'}
        </button>
      </div>

      {/* Score bars per candidate */}
      {results.sort((a,b) => (b.ai_score||0) - (a.ai_score||0)).map(sub => (
        <AiMatchCard key={sub.id} submission={sub} />
      ))}
    </div>
  )
}
```
