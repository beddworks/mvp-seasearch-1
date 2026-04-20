# 11 — Feature: Client Portal & Tokenized Feedback
> SeaSearch PRD · v2.0  
> 6 screens · 3 response modal flows · Tokenized link system · Client layout

---

## Overview

Two delivery mechanisms:
1. **Tokenized email links** — primary (works now, no auth needed)  
2. **Client portal** — deferred Stage 4 from PRD (auth-based, built after tokenized flow)

Client portal uses a separate design system: paper tones, Instrument Serif headings, configurable accent color per client.

---

## Client Layout (ClientLayout.jsx)

```jsx
// Components/layout/ClientLayout.jsx
// Used only when client portal auth is built (Stage 4 deferred)
export default function ClientLayout({ client, children, activeScreen = 'dashboard' }) {
    const accent = client?.accent_color ?? '#0B4F8A'

    return (
        <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
            {/* Top nav — dark ink with client branding */}
            <nav style={{ height: 56, background: 'var(--ink)', borderBottom: '1px solid var(--ink2)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', opacity: .7 }}>Sea Search</span>
                    <div style={{ width: 1, height: 20, background: 'var(--ink3)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: '#fff', letterSpacing: '.03em' }}>
                            {client?.company_name?.slice(0,3).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{client?.company_name}</div>
                        </div>
                    </div>
                </div>

                {/* Nav links */}
                <div style={{ display: 'flex', gap: 2, marginLeft: 28 }}>
                    {[['dashboard','Dashboard'],['submissions','Submissions'],['compare','Compare'],['feedback','Interview Feedback'],['messages','Messages'],['notifications','Notifications']].map(([id, label]) => (
                        <div key={id}
                            onClick={() => router.visit(route('client.portal.index', { screen: id }))}
                            style={{ fontSize: 12, padding: '5px 10px', borderRadius: 'var(--rsm)', cursor: 'pointer', color: activeScreen === id ? '#fff' : 'var(--ink5)', background: activeScreen === id ? 'rgba(255,255,255,.1)' : 'transparent' }}>
                            {label}
                        </div>
                    ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--ink3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: 'var(--ink5)' }}>🔔</div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, cursor: 'pointer' }}>
                        {initials(client?.contact_name ?? '')}
                    </div>
                </div>
            </nav>

            {/* Shell: sidebar + main */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 220, background: 'var(--paper)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
                    {/* Role card */}
                    <div style={{ margin: '14px 12px', background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 'var(--r)', padding: 12 }}>
                        <div style={{ fontSize: 9, color: accent, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Active mandate</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{client?.activeMandateTitle ?? 'No active role'}</div>
                    </div>

                    {/* Nav items */}
                    <div style={{ padding: '6px 10px', flex: 1 }}>
                        {[['dashboard','📊','Dashboard'],['submissions','👤','Submissions'],['compare','⊞','Compare'],['feedback','💬','Interview Feedback'],['messages','✉','Messages'],['notifications','🔔','Notifications']].map(([id,ico,lbl]) => (
                            <div key={id}
                                onClick={() => router.visit(route('client.portal.index', { screen: id }))}
                                className={`sbi${activeScreen === id ? ' on' : ''}`}
                                style={activeScreen === id ? { background: `${accent}15`, color: 'var(--ink)' } : {}}>
                                <span className="sbi-i">{ico}</span>
                                <span className="sbi-l">{lbl}</span>
                            </div>
                        ))}
                    </div>

                    {/* User strip */}
                    <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--paper2)', borderRadius: 'var(--rsm)', border: '1px solid var(--line)' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500 }}>
                                {initials(client?.contact_name ?? '')}
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)' }}>{client?.contact_name}</div>
                                <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{client?.contact_title}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--paper2)' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
```

---

## PortalController — All 6 Screens

```php
// app/Http/Controllers/Client/PortalController.php
class PortalController extends Controller
{
    // ── Screen 1: Dashboard ──────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $client = auth()->user()->clientProfile;
        $screen = $request->query('screen', 'dashboard');

        $mandates = Mandate::where('client_id', $client->id)
            ->with(['activeClaim.recruiter.user', 'submissions' => fn($q) =>
                $q->whereIn('admin_review_status',['approved','bypassed'])
            ])
            ->whereIn('status',['active','filled'])
            ->get();

        $allSubmissions = CddSubmission::whereHas('mandate', fn($q) =>
            $q->where('client_id', $client->id)
        )->with(['candidate','recruiter.user','mandate'])->latest()->get();

        return Inertia::render('Client/Portal/Index', [
            'client'  => ClientResource::make($client),
            'screen'  => $screen,
            'stats'   => [
                'total_submissions'   => $allSubmissions->count(),
                'approved_interviews' => $allSubmissions->where('client_status','interview')->count(),
                'active_mandates'     => $mandates->where('status','active')->count(),
                'avg_brief_to_review' => $this->avgResponseDays($allSubmissions),
            ],
            'mandates'       => MandateResource::collection($mandates),
            'submissions'    => CddSubmissionResource::collection($allSubmissions),
            'messages'       => [], // TODO: message thread model
            'notifications'  => NotificationResource::collection(
                auth()->user()->notifications()->latest()->take(30)->get()
            ),
        ]);
    }

    // ── Screen 5: Messages ───────────────────────────────────────────────
    public function sendMessage(Request $request): RedirectResponse
    {
        $request->validate(['body' => 'required|string|max:2000', 'mandate_id' => 'nullable|uuid']);
        // TODO: implement message thread model
        return redirect()->back()->with('success', 'Message sent.');
    }

    // ── Screen 6: Notifications mark all read ────────────────────────────
    public function readAllNotifications(): JsonResponse
    {
        auth()->user()->notifications()->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        return response()->json(['success' => true]);
    }

    private function avgResponseDays($submissions): float
    {
        $responded = $submissions->filter(fn($s) => $s->client_status_updated_at && $s->submitted_at);
        if ($responded->isEmpty()) return 0;
        return round($responded->avg(fn($s) => $s->submitted_at->diffInDays($s->client_status_updated_at)), 1);
    }
}
```

---

## Feedback Controller — Tokenized (Public Route)

```php
// app/Http/Controllers/Client/SubmissionFeedbackController.php
class SubmissionFeedbackController extends Controller
{
    public function __construct(
        private TokenService    $tokenService,
        private NotificationService $notif,
        private SlotService     $slotService,
        private CommissionService $commissionService
    ) {}

    public function show(string $token): Response
    {
        $submission = $this->tokenService->validate($token);

        if (!$submission) {
            return Inertia::render('Client/Feedback/Expired');
        }

        $actionHint = request()->query('action'); // pre-selected status from email link

        return Inertia::render('Client/Feedback/Show', [
            'submission' => CddSubmissionResource::make(
                $submission->load('candidate','mandate.client','recruiter.user')
            ),
            'token'      => $token,
            'actionHint' => $actionHint,
            'statuses'   => [
                ['value' => 'shortlisted',  'label' => 'Shortlisted',  'color' => 'jade',   'description' => 'Candidate is of interest — reviewing further'],
                ['value' => 'interview',    'label' => 'Interview',    'color' => 'sea',    'description' => 'Would like to schedule an interview'],
                ['value' => 'offer_made',   'label' => 'Offer Made',   'color' => 'violet', 'description' => 'Offer has been extended to the candidate'],
                ['value' => 'hired',        'label' => 'Hired',        'color' => 'jade',   'description' => 'Candidate accepted and will join the company'],
                ['value' => 'rejected',     'label' => 'Rejected',     'color' => 'ruby',   'description' => 'Not a fit for this role'],
                ['value' => 'on_hold',      'label' => 'On Hold',      'color' => 'mist',   'description' => 'Decision deferred — revisiting later'],
            ],
        ]);
    }

    public function update(string $token, Request $request): RedirectResponse
    {
        $submission = $this->tokenService->validate($token);
        if (!$submission) abort(404, 'This link has expired or has already been used.');

        $validated = $request->validate([
            'status'           => 'required|in:shortlisted,interview,offer_made,hired,rejected,on_hold',
            'rejection_reason' => 'nullable|string|max:500',
            'interview_date'   => 'nullable|date|after:today',
            'interview_format' => 'nullable|in:in_person,video,panel',
            'interview_notes'  => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($submission, $validated) {
            $submission->update([
                'client_status'            => $validated['status'],
                'client_status_updated_at' => now(),
                'client_rejection_reason'  => $validated['rejection_reason'] ?? null,
                'interview_date'           => $validated['interview_date'] ?? null,
                'interview_format'         => $validated['interview_format'] ?? null,
                'interview_notes'          => $validated['interview_notes'] ?? null,
            ]);

            // Invalidate token
            $this->tokenService->markUsed($submission);

            // Sync GSheet
            SyncGSheetJob::dispatch($submission, 'update_status')->onQueue('sheets');

            // Notify admin + recruiter
            $this->notif->clientFeedbackReceived($submission);

            // If hired — settle commission
            if ($validated['status'] === 'hired') {
                $this->commissionService->settle($submission);
            }

            // Check if slot should be freed (Timer C logic)
            $this->slotService->checkAndFreeSlot($submission->mandate, $submission->recruiter_id);
        });

        return redirect()->route('feedback.confirmed')->with('success', 'Thank you for your feedback!');
    }
}
```

---

## React — Client Portal (SPA-like with screen switcher)

```jsx
// Pages/Client/Portal/Index.jsx
import { useState } from 'react'
import { router } from '@inertiajs/react'
import ClientLayout from '@/Components/layout/ClientLayout'
import { fmtDate, fmtRelative, initials } from '@/lib/utils'

export default function ClientPortalIndex({ client, screen: initialScreen, stats, mandates, submissions, notifications }) {
    const [screen, setScreen]     = useState(initialScreen)
    const [filter, setFilter]     = useState('all')
    const [approveModal, setApproveModal] = useState(null)  // { submissionId, candidateName }
    const [rejectModal, setRejectModal]   = useState(null)
    const [infoModal, setInfoModal]       = useState(null)

    const accent = client.accent_color ?? '#0B4F8A'

    const filteredSubs = filter === 'all' ? submissions
        : submissions.filter(s => filter === 'pending' ? s.client_status === 'pending'
            : filter === 'approved' ? ['shortlisted','interview','offer_made','hired'].includes(s.client_status)
            : s.client_status === 'rejected')

    // ── Dashboard Screen ─────────────────────────────────────────────────
    const DashboardScreen = () => (
        <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
            <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)', marginBottom: 3 }}>
                    Good morning, {client.contact_name?.split(' ')[0]}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink4)' }}>{fmtDate(new Date().toISOString())}</div>
            </div>

            {/* 4 stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
                {[
                    ['Total submissions', stats.total_submissions, accent],
                    ['Approved for interview', stats.approved_interviews, '#2E7D33'],
                    ['Active mandates', stats.active_mandates, accent],
                    ['Avg days to respond', stats.avg_brief_to_review, '#B85C1A'],
                ].map(([lbl, val, color]) => (
                    <div key={lbl} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                        <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--mono)', lineHeight: 1, marginBottom: 3 }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{lbl}</div>
                    </div>
                ))}
            </div>

            {/* Active mandates table */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 18 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Active Mandates</div>
                    <button onClick={() => setScreen('submissions')} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line2)', background: 'transparent', color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        View all submissions →
                    </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--paper2)' }}>
                            {['Role','Recruiter','Submissions','Pipeline','Status',''].map(h => (
                                <th key={h} style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink4)', padding: '9px 14px', textAlign: 'left' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {mandates.map(m => {
                            const subCount = submissions.filter(s => s.mandate_id === m.id).length
                            const approved = submissions.filter(s => s.mandate_id === m.id && ['shortlisted','interview'].includes(s.client_status)).length
                            return (
                                <tr key={m.id} style={{ borderTop: '1px solid var(--line)' }}>
                                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{m.title}</td>
                                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink4)' }}>{m.activeClaim?.recruiter?.display_name ?? '—'}</td>
                                    <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13 }}>{subCount}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        {/* 5-segment pipeline bar */}
                                        <div style={{ display: 'flex', gap: 2 }}>
                                            {Array.from({ length: 5 }).map((_,i) => (
                                                <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < subCount ? accent : 'var(--line)' }} />
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: m.status === 'active' ? '#EAF4EB' : '#FBE8E8', color: m.status === 'active' ? '#1A4D1E' : '#7A1A1A' }}>
                                            {m.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <button onClick={() => setScreen('submissions')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 'var(--rsm)', border: '1px solid var(--line2)', background: 'transparent', color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)' }}>Review</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )

    // ── Submissions Screen ───────────────────────────────────────────────
    const SubmissionsScreen = () => (
        <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)' }}>Candidate Submissions</div>
                <div style={{ display: 'flex', gap: 2 }}>
                    {[['all','All'],['pending','Pending review'],['approved','Approved'],['rejected','Rejected']].map(([val,lbl]) => (
                        <button key={val} onClick={() => setFilter(val)}
                            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line)', background: filter === val ? 'var(--ink)' : 'transparent', color: filter === val ? '#fff' : 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                            {lbl} {val === 'all' ? `(${submissions.length})` : `(${submissions.filter(s => val === 'pending' ? s.client_status === 'pending' : val === 'approved' ? ['shortlisted','interview','offer_made','hired'].includes(s.client_status) : s.client_status === 'rejected').length})`}
                        </button>
                    ))}
                </div>
            </div>

            {filteredSubs.map(sub => (
                <CandidateBriefCard key={sub.id} sub={sub} accent={accent}
                    onApprove={() => setApproveModal({ sub })}
                    onReject={() => setRejectModal({ sub })}
                    onInfo={() => setInfoModal({ sub })} />
            ))}
        </div>
    )

    // ── Compare Screen ───────────────────────────────────────────────────
    const CompareScreen = () => {
        const compareSubs = submissions.filter(s => s.client_status !== 'rejected')
        return (
            <div style={{ padding: '24px 28px' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 18 }}>Compare Candidates</div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                            <tr style={{ background: 'var(--paper2)' }}>
                                {['Candidate','Role','Experience','AI Score','Experience','Industry','Scope','Leadership','Expected Salary','Status','Action'].map(h => (
                                    <th key={h} style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink4)', padding: '9px 12px', textAlign: 'left', border: '1px solid var(--line)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {compareSubs.map(sub => {
                                const bd = sub.score_breakdown ?? {}
                                const isRejected = sub.client_status === 'rejected'
                                return (
                                    <tr key={sub.id} style={{ opacity: isRejected ? .5 : 1, borderTop: '1px solid var(--line)' }}>
                                        <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 500 }}>{sub.candidate.first_name} {sub.candidate.last_name}</td>
                                        <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--ink4)' }}>{sub.candidate.current_role}</td>
                                        <td style={{ padding: '10px 12px', fontSize: 11, fontFamily: 'var(--mono)' }}>{sub.candidate.years_experience}y</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--mono)', color: sub.ai_score >= 80 ? '#2E7D33' : sub.ai_score >= 60 ? '#B85C1A' : '#B52525' }}>
                                                {sub.ai_score ?? '—'}
                                            </span>
                                        </td>
                                        {['experience','industry','scope','leadership'].map(d => (
                                            <td key={d} style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2 }}>
                                                        <div style={{ height: 4, borderRadius: 2, background: accent, width: `${bd[d] ?? 0}%` }} />
                                                    </div>
                                                    <span style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', width: 24 }}>{bd[d] ?? 0}</span>
                                                </div>
                                            </td>
                                        ))}
                                        <td style={{ padding: '10px 12px', fontSize: 11 }}>—</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: sub.client_status === 'hired' ? '#EAF4EB' : sub.client_status === 'rejected' ? '#FBE8E8' : '#E8F2FB', color: sub.client_status === 'hired' ? '#1A4D1E' : sub.client_status === 'rejected' ? '#7A1A1A' : '#0B4F8A' }}>
                                                {sub.client_status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            {sub.client_status === 'interview' && (
                                                <button onClick={() => setScreen('feedback')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 'var(--rsm)', border: `1px solid ${accent}`, background: 'transparent', color: accent, cursor: 'pointer', fontFamily: 'var(--font)' }}>Feedback →</button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // ── Interview Feedback Screen ────────────────────────────────────────
    const FeedbackScreen = () => {
        const [stars, setStars]     = useState(0)
        const [verdict, setVerdict] = useState('')
        const interviewedSubs = submissions.filter(s => s.client_status === 'interview')
        const [selectedSub, setSelectedSub] = useState(interviewedSubs[0])

        if (!selectedSub) return (
            <div style={{ padding: '24px 28px', color: 'var(--ink4)', fontSize: 13 }}>
                No candidates at interview stage yet.
            </div>
        )

        return (
            <div style={{ padding: '24px 28px', maxWidth: 720 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 20 }}>Interview Feedback</div>
                {/* Candidate card */}
                <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${accent}20`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500 }}>
                        {initials(selectedSub.candidate.first_name + ' ' + selectedSub.candidate.last_name)}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedSub.candidate.first_name} {selectedSub.candidate.last_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink4)' }}>{selectedSub.candidate.current_role} · {selectedSub.candidate.current_company}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>Interview: {selectedSub.interview_date ? fmtDate(selectedSub.interview_date) : 'TBC'} {selectedSub.interview_format ? `· ${selectedSub.interview_format}` : ''}</div>
                    </div>
                </div>

                {/* Star rating */}
                <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '16px 18px', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Overall impression</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                        {[1,2,3,4,5].map(n => (
                            <span key={n} onClick={() => setStars(n)} style={{ fontSize: 24, cursor: 'pointer', color: n <= stars ? '#C49A00' : 'var(--line2)' }}>★</span>
                        ))}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Overall verdict</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[['strong_yes','Strong yes'],['yes','Yes'],['uncertain','Uncertain'],['no','No']].map(([val,lbl]) => (
                            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                                <input type="radio" name="verdict" value={val} checked={verdict === val} onChange={() => setVerdict(val)} />
                                {lbl}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Text areas */}
                {[['Strengths observed in interview'],['Concerns or gaps identified'],['Overall recommendation']].map(([label]) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink4)', marginBottom: 5 }}>{label}</div>
                        <textarea style={{ width: '100%', padding: '9px 11px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 'var(--rsm)', background: '#fff', color: 'var(--ink)', resize: 'vertical', minHeight: 80, outline: 'none', fontFamily: 'var(--font)', lineHeight: 1.65 }} />
                    </div>
                ))}

                <button style={{ width: '100%', padding: '11px', borderRadius: 'var(--rsm)', background: accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    Submit feedback to Sea Search
                </button>
            </div>
        )
    }

    // ── Messages Screen ──────────────────────────────────────────────────
    const MessagesScreen = () => {
        const [msg, setMsg] = useState('')
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--serif)', fontSize: 16 }}>Messages with Sea Search</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Message bubbles — placeholder */}
                    <div style={{ fontSize: 12, color: 'var(--ink4)', textAlign: 'center' }}>Your conversation thread will appear here.</div>
                </div>
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
                    <textarea value={msg} onChange={e => setMsg(e.target.value)}
                        placeholder="Type your message…"
                        style={{ flex: 1, padding: '9px 12px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 'var(--rsm)', background: '#fff', color: 'var(--ink)', resize: 'none', height: 60, outline: 'none', fontFamily: 'var(--font)' }} />
                    <button onClick={() => { router.post(route('client.messages.send'), { body: msg }); setMsg('') }}
                        style={{ padding: '0 20px', borderRadius: 'var(--rsm)', background: accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        Send
                    </button>
                </div>
            </div>
        )
    }

    // ── Notifications Screen ─────────────────────────────────────────────
    const NotificationsScreen = () => (
        <div style={{ padding: '24px 28px', maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>Notifications</div>
                <button onClick={() => router.post(route('client.notifications.read-all'))} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line2)', background: 'transparent', color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    Mark all read
                </button>
            </div>
            {notifications.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink4)', fontSize: 13 }}>No notifications yet.</div>
            )}
            {notifications.map(n => (
                <div key={n.id} onClick={() => n.action_url && router.visit(n.action_url)}
                    style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', marginBottom: 8, cursor: n.action_url ? 'pointer' : 'default', borderLeft: n.is_read ? undefined : `3px solid ${accent}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💬</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 500, color: 'var(--ink)', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{n.body}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink5)', marginTop: 3, fontFamily: 'var(--mono)' }}>{fmtRelative(n.created_at)}</div>
                    </div>
                </div>
            ))}
        </div>
    )

    // ── Screen router ────────────────────────────────────────────────────
    const screens = { dashboard: DashboardScreen, submissions: SubmissionsScreen, compare: CompareScreen, feedback: FeedbackScreen, messages: MessagesScreen, notifications: NotificationsScreen }
    const ActiveScreen = screens[screen] ?? DashboardScreen

    return (
        <ClientLayout client={client} activeScreen={screen}>
            <ActiveScreen />
            {/* Modals */}
            {approveModal && <ApproveModal sub={approveModal.sub} accent={accent} onClose={() => setApproveModal(null)} />}
            {rejectModal  && <RejectModal  sub={rejectModal.sub}  accent={accent} onClose={() => setRejectModal(null)} />}
            {infoModal    && <InfoModal    sub={infoModal.sub}    accent={accent} onClose={() => setInfoModal(null)} />}
        </ClientLayout>
    )
}
```

---

## 3 Response Modal Components

```jsx
// ── Approve Modal ────────────────────────────────────────────────────────
function ApproveModal({ sub, accent, onClose }) {
    const { data, setData, post, processing } = useForm({
        status: 'interview', interview_date: '', interview_format: 'video', interview_notes: '',
    })
    return (
        <ModalWrap onClose={onClose}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>Approve for interview</div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 16 }}>
                Approving <strong>{sub.candidate.first_name} {sub.candidate.last_name}</strong> for a first-round interview. Sea Search will coordinate scheduling.
            </div>
            <div className="form-group">
                <label className="form-label">Preferred interview date</label>
                <input className="form-input" type="date" value={data.interview_date} onChange={e => setData('interview_date', e.target.value)} />
            </div>
            <div className="form-group">
                <label className="form-label">Interview format</label>
                <select className="form-input" value={data.interview_format} onChange={e => setData('interview_format', e.target.value)}>
                    <option value="in_person">In-person</option>
                    <option value="video">Video call</option>
                    <option value="panel">Panel interview</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Notes for recruiter (optional)</label>
                <textarea className="form-input" rows={3} value={data.interview_notes} onChange={e => setData('interview_notes', e.target.value)} placeholder="Any preparation notes or logistical details…" style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => post(route('client.submissions.update-status', sub.id), { onSuccess: onClose })}
                    disabled={processing}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--rsm)', background: '#2E7D33', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {processing ? 'Confirming…' : '✓ Confirm interview'}
                </button>
                <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 'var(--rsm)', background: 'transparent', border: '1px solid var(--line2)', color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13 }}>Cancel</button>
            </div>
        </ModalWrap>
    )
}

// ── Reject Modal ─────────────────────────────────────────────────────────
function RejectModal({ sub, onClose }) {
    const [reason, setReason] = useState('')
    const [note, setNote]     = useState('')
    const { post, processing } = useForm()

    const REASONS = [
        ['Insufficient experience', 'Does not meet the required years or seniority level'],
        ['Regional scope', 'Experience does not cover the required markets'],
        ['Cultural fit', 'Unlikely to align with company culture or working style'],
        ['Compensation mismatch', 'Salary expectations could not be aligned'],
        ['Found another candidate', 'Another submission better fits the requirement'],
    ]

    return (
        <ModalWrap onClose={onClose}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>Reject candidate</div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 16 }}>
                Rejecting <strong>{sub.candidate.first_name} {sub.candidate.last_name}</strong>. This helps Sea Search refine the search.
            </div>
            <div style={{ marginBottom: 14 }}>
                {REASONS.map(([r, desc]) => (
                    <label key={r} onClick={() => setReason(r)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 'var(--rsm)', marginBottom: 6, border: `1px solid ${reason === r ? 'var(--ruby2)' : 'var(--line)'}`, background: reason === r ? 'var(--ruby-pale)' : '#fff', cursor: 'pointer' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${reason === r ? 'var(--ruby2)' : 'var(--line2)'}`, marginTop: 2, flexShrink: 0, background: reason === r ? 'var(--ruby2)' : 'transparent' }} />
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: reason === r ? 'var(--ruby)' : 'var(--ink)' }}>{r}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{desc}</div>
                        </div>
                    </label>
                ))}
            </div>
            <div className="form-group">
                <label className="form-label">Additional note (optional)</label>
                <textarea className="form-input" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Any specific feedback to help Sea Search refine the search…" style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => {
                    if (!reason) return alert('Please select a rejection reason.')
                    post(route('client.submissions.update-status', sub.id), { onSuccess: onClose })
                }} disabled={processing || !reason}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--rsm)', background: 'var(--ruby2)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {processing ? 'Rejecting…' : 'Confirm rejection'}
                </button>
                <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 'var(--rsm)', background: 'transparent', border: '1px solid var(--line2)', color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13 }}>Cancel</button>
            </div>
        </ModalWrap>
    )
}

// ── Request Info Modal ───────────────────────────────────────────────────
function InfoModal({ sub, onClose }) {
    const [checked, setChecked] = useState([])
    const [freeText, setFreeText] = useState('')
    const PRESETS = ['MAS regulatory experience?','Team size managed?','Non-compete clause?','Right to work in Singapore?','Expected notice period?']

    return (
        <ModalWrap onClose={onClose}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>Request more information</div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 16 }}>
                Sea Search will follow up with <strong>{sub.candidate.first_name}</strong>'s recruiter.
            </div>
            <div style={{ marginBottom: 14 }}>
                {PRESETS.map(q => (
                    <label key={q} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--rsm)', marginBottom: 4, border: '1px solid var(--line)', cursor: 'pointer', fontSize: 12 }}>
                        <input type="checkbox" checked={checked.includes(q)} onChange={() => setChecked(prev => prev.includes(q) ? prev.filter(i => i !== q) : [...prev, q])} />
                        {q}
                    </label>
                ))}
            </div>
            <div className="form-group">
                <label className="form-label">Or type your own question</label>
                <textarea className="form-input" rows={2} value={freeText} onChange={e => setFreeText(e.target.value)} placeholder="Specific question for the recruiter…" style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={{ flex: 1, padding: '10px', borderRadius: 'var(--rsm)', background: 'var(--sea2)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Send request
                </button>
                <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 'var(--rsm)', background: 'transparent', border: '1px solid var(--line2)', color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13 }}>Cancel</button>
            </div>
        </ModalWrap>
    )
}

// ── Modal Wrapper ────────────────────────────────────────────────────────
function ModalWrap({ children, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,12,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--paper)', borderRadius: 'var(--r)', border: '1px solid var(--line)', padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    )
}

// ── Candidate Brief Card ─────────────────────────────────────────────────
function CandidateBriefCard({ sub, accent, onApprove, onReject, onInfo }) {
    const score      = sub.ai_score
    const scoreColor = score >= 80 ? '#2E7D33' : score >= 60 ? '#B85C1A' : '#B52525'
    const isPending  = sub.client_status === 'pending'
    const isApproved = ['shortlisted','interview','offer_made','hired'].includes(sub.client_status)
    const isRejected = sub.client_status === 'rejected'

    return (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 14, opacity: isRejected ? .65 : 1 }}>
            <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${accent}20`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                        {initials(sub.candidate.first_name + ' ' + sub.candidate.last_name)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{sub.candidate.first_name} {sub.candidate.last_name}</div>
                            <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: isPending ? '#E8F2FB' : isApproved ? '#EAF4EB' : '#FBE8E8', color: isPending ? '#0B4F8A' : isApproved ? '#1A4D1E' : '#7A1A1A' }}>
                                {isPending ? 'Awaiting review' : sub.client_status.replace('_',' ')}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 6 }}>{sub.candidate.current_role} · {sub.candidate.current_company}</div>
                        {sub.ai_summary && <div style={{ fontSize: 12, color: 'var(--ink4)', lineHeight: 1.7, marginBottom: 10 }}>{sub.ai_summary}</div>}

                        {/* Breakdown bars */}
                        {sub.score_breakdown && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 10 }}>
                                {['experience','industry','scope','leadership'].map(d => (
                                    <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <div style={{ fontSize: 10, color: 'var(--ink4)', width: 70, textTransform: 'capitalize' }}>{d}</div>
                                        <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2 }}>
                                            <div style={{ height: 4, borderRadius: 2, background: accent, width: `${sub.score_breakdown[d] ?? 0}%` }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', width: 24 }}>{sub.score_breakdown[d] ?? 0}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Green/red flags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: sub.recruiter_note ? 10 : 0 }}>
                            {sub.green_flags?.map((f,i) => <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#EAF4EB', color: '#1A4D1E' }}>✓ {f}</span>)}
                            {sub.red_flags?.map((f,i) => <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#FBE8E8', color: '#7A1A1A' }}>⚠ {f}</span>)}
                        </div>

                        {/* Recruiter note */}
                        {sub.recruiter_note && (
                            <div style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 'var(--rsm)', padding: '8px 12px', fontSize: 12, color: 'var(--ink4)', fontStyle: 'italic' }}>
                                <strong style={{ fontStyle: 'normal', fontWeight: 500, color: 'var(--ink4)' }}>{sub.recruiter?.display_name ?? 'Recruiter'}:</strong> {sub.recruiter_note}
                            </div>
                        )}
                    </div>

                    {/* Score ring */}
                    {score != null && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: scoreColor }}>{score}</div>
                                <div style={{ fontSize: 8, color: 'var(--ink4)', textTransform: 'uppercase' }}>AI</div>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 3, fontFamily: 'var(--mono)' }}>{fmtRelative(sub.submitted_at)}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action bar */}
            {isPending && (
                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
                    <button onClick={onApprove} style={{ flex: 1, padding: '9px', borderRadius: 'var(--rsm)', background: '#2E7D33', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>✓ Approve for interview</button>
                    <button onClick={onInfo} style={{ padding: '9px 14px', borderRadius: 'var(--rsm)', background: 'transparent', border: '1px solid var(--line2)', color: 'var(--ink4)', fontSize: 12, cursor: 'pointer' }}>Request info</button>
                    <button onClick={onReject} style={{ padding: '9px 14px', borderRadius: 'var(--rsm)', background: 'transparent', border: '1px solid var(--line2)', color: 'var(--ruby2)', fontSize: 12, cursor: 'pointer' }}>Reject</button>
                </div>
            )}
            {isApproved && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid var(--jade-soft)', background: 'var(--jade-pale)', fontSize: 12, color: 'var(--jade)' }}>
                    ✓ Approved {sub.interview_date ? `· Interview: ${fmtDate(sub.interview_date)}` : ''} · Sea Search notified
                </div>
            )}
        </div>
    )
}
```

---

## Tokenized Feedback Page (Public — No Auth)

```jsx
// Pages/Client/Feedback/Show.jsx
import { useState } from 'react'
import { useForm } from '@inertiajs/react'

export default function FeedbackShow({ submission, token, actionHint, statuses }) {
    const [selected, setSelected] = useState(actionHint || '')
    const { data, setData, post, processing } = useForm({
        status: actionHint || '',
        rejection_reason: '',
        interview_date: '',
        interview_format: 'video',
        interview_notes: '',
    })

    function handleSubmit() {
        if (!data.status) return
        post(route('feedback.update', token))
    }

    const candidate = submission.candidate
    const mandate   = submission.mandate

    return (
        <div style={{ minHeight: '100vh', background: 'var(--paper2)', fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column' }}>
            <nav style={{ height: 52, background: 'var(--ink)', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    Sea<span style={{ color: 'var(--sea3)' }}>Search</span>
                </div>
            </nav>

            <div style={{ maxWidth: 560, margin: '32px auto', width: '100%', padding: '0 20px' }}>
                {/* Candidate card */}
                <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Candidate submitted for</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{mandate.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--sea-pale)', color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500 }}>
                            {initials(candidate.first_name + ' ' + candidate.last_name)}
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{candidate.first_name} {candidate.last_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink4)' }}>{candidate.current_role} · {candidate.current_company}</div>
                        </div>
                        {submission.ai_score && (
                            <div style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-head)', color: submission.ai_score >= 80 ? 'var(--jade2)' : submission.ai_score >= 60 ? 'var(--amber2)' : 'var(--ruby2)' }}>
                                {submission.ai_score}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status selection */}
                <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Update candidate status</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {statuses.map(s => (
                            <label key={s.value} onClick={() => { setSelected(s.value); setData('status', s.value) }}
                                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 'var(--rsm)', border: `1px solid ${selected === s.value ? 'var(--sea2)' : 'var(--line)'}`, background: selected === s.value ? 'var(--sea-pale)' : '#fff', cursor: 'pointer' }}>
                                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${selected === s.value ? 'var(--sea2)' : 'var(--line2)'}`, marginTop: 2, flexShrink: 0, background: selected === s.value ? 'var(--sea2)' : 'transparent' }} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: selected === s.value ? 'var(--sea)' : 'var(--ink)' }}>{s.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{s.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Extra fields for interview */}
                {selected === 'interview' && (
                    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Interview details</div>
                        <div className="form-group">
                            <label className="form-label">Preferred date</label>
                            <input className="form-input" type="date" value={data.interview_date} onChange={e => setData('interview_date', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Format</label>
                            <select className="form-input" value={data.interview_format} onChange={e => setData('interview_format', e.target.value)}>
                                <option value="in_person">In-person</option>
                                <option value="video">Video call</option>
                                <option value="panel">Panel interview</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes for recruiter</label>
                            <textarea className="form-input" rows={2} value={data.interview_notes} onChange={e => setData('interview_notes', e.target.value)} style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                )}

                {/* Rejection reason */}
                {selected === 'rejected' && (
                    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Rejection reason (optional)</label>
                            <textarea className="form-input" rows={2} value={data.rejection_reason} onChange={e => setData('rejection_reason', e.target.value)} placeholder="Helps Sea Search refine future submissions…" style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={!selected || processing}
                    style={{ width: '100%', padding: 12, borderRadius: 'var(--rsm)', background: selected ? 'var(--sea2)' : 'var(--mist4)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'var(--font)' }}>
                    {processing ? 'Submitting…' : 'Submit feedback'}
                </button>

                <div style={{ fontSize: 11, color: 'var(--ink4)', textAlign: 'center', marginTop: 14 }}>
                    This link is single-use and will expire after submission.
                </div>
            </div>
        </div>
    )
}
```

---

## Client Portal Routes (add to web.php)

```php
// Tokenized feedback — public, no auth
Route::get('/feedback/{token}',   [SubmissionFeedbackController::class, 'show'])->name('feedback.show');
Route::post('/feedback/{token}',  [SubmissionFeedbackController::class, 'update'])->name('feedback.update');
Route::get('/feedback/confirmed', fn() => Inertia::render('Client/Feedback/Confirmed'))->name('feedback.confirmed');

// Client portal — auth required (deferred Stage 4)
Route::middleware(['auth','role:client'])->prefix('client')->name('client.')->group(function () {
    Route::get('/portal',               [PortalController::class, 'index'])->name('portal.index');
    Route::post('/messages',            [PortalController::class, 'sendMessage'])->name('messages.send');
    Route::post('/notifications/read-all', [PortalController::class, 'readAllNotifications'])->name('notifications.read-all');
    Route::post('/submissions/{submission}/update-status', [PortalController::class, 'updateStatus'])->name('submissions.update-status');
});
```
