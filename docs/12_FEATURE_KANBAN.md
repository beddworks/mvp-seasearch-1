# 12 — Feature: Kanban Pipeline
> SeaSearch PRD · v2.0  
> Full drag-drop · Side panel complete · Submit to client · Rejection modal · Add candidate modal

---

## Overview

The Kanban board is per-mandate. Columns map to `cdd_submissions.client_status`.
Internal stages (sourced/screened) are pre-submission — tracked locally, not sent to client.
Submitted candidates are those with `admin_review_status = approved | bypassed`.

---

## KanbanController

```php
// app/Http/Controllers/Recruiter/KanbanController.php
class KanbanController extends Controller
{
    public function show(Mandate $mandate): Response
    {
        $recruiter = auth()->user()->recruiter;

        // Ensure recruiter has approved claim
        $claim = MandateClaim::where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->where('status', 'approved')
            ->firstOrFail();

        $submissions = CddSubmission::with(['candidate','placement'])
            ->where('mandate_id', $mandate->id)
            ->where('recruiter_id', $recruiter->id)
            ->get();

        // Group by client_status for kanban columns
        $grouped = $submissions->groupBy('client_status')->toArray();

        return Inertia::render('Recruiter/Kanban/Show', [
            'mandate'   => MandateDetailResource::make($mandate->load('client')),
            'claim'     => ClaimResource::make($claim),
            'grouped'   => $grouped,
            'submissions' => CddSubmissionResource::collection($submissions),
            'stages'    => ['sourced','screened','interview','offered','hired','rejected'],
            'stats'     => [
                'total'     => $submissions->count(),
                'top_score' => $submissions->max('ai_score') ?? 0,
                'days_active' => $claim->assigned_at->diffInDays(now()),
                'submitted' => $submissions->whereIn('admin_review_status',['approved','bypassed'])->count(),
            ],
        ]);
    }

    public function move(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id' => 'required|uuid|exists:cdd_submissions,id',
            'new_stage'     => 'required|in:sourced,screened,interview,offered,hired,rejected,on_hold',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);

        // Auth check
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update(['client_status' => $request->new_stage]);

        // Sync GSheet if it was already sent to client
        if (in_array($submission->admin_review_status, ['approved','bypassed'])) {
            SyncGSheetJob::dispatch($submission, 'update_status')->onQueue('sheets');
        }

        return response()->json([
            'success'   => true,
            'new_stage' => $request->new_stage,
            'id'        => $submission->id,
        ]);
    }

    public function scheduleInterview(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'   => 'required|uuid',
            'interview_date'  => 'required|date',
            'interview_format'=> 'nullable|in:in_person,video,panel',
            'interview_notes' => 'nullable|string|max:1000',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update([
            'interview_date'   => $request->interview_date,
            'interview_format' => $request->interview_format,
            'interview_notes'  => $request->interview_notes,
            'client_status'    => 'interview',
        ]);

        return response()->json(['success' => true, 'submission' => $submission->fresh()]);
    }

    public function saveClientFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'              => 'required|uuid',
            'client_feedback'            => 'required|string|max:2000',
            'client_feedback_sentiment'  => 'required|in:positive,neutral,negative',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update([
            'client_feedback'           => $request->client_feedback,
            'client_feedback_sentiment' => $request->client_feedback_sentiment,
        ]);

        return response()->json(['success' => true]);
    }

    public function submitToClient(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'  => 'required|uuid',
            'recruiter_note' => 'nullable|string|max:1000',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        if (in_array($submission->admin_review_status, ['approved','bypassed'])) {
            return response()->json(['error' => 'Already submitted to client.'], 422);
        }

        if ($submission->recruiter_note !== $request->recruiter_note) {
            $submission->update(['recruiter_note' => $request->recruiter_note]);
        }

        // Check exception rule
        $bypass = app(ExceptionService::class)->shouldBypass(
            auth()->user()->recruiter,
            $submission->mandate
        );

        $submission->update([
            'admin_review_status' => $bypass ? 'bypassed' : 'pending',
            'exception_bypass'    => $bypass,
        ]);

        if ($bypass) {
            app(CddService::class)->forwardToClient($submission);
        } else {
            app(NotificationService::class)->cddPendingAdminReview($submission);
        }

        return response()->json([
            'success'  => true,
            'bypassed' => $bypass,
            'message'  => $bypass ? 'Submitted directly to client.' : 'Sent for admin review.',
        ]);
    }

    public function reject(Request $request): JsonResponse
    {
        $request->validate([
            'submission_id'   => 'required|uuid',
            'rejection_reason'=> 'required|in:client,withdrew,unsuitable,compensation',
            'rejection_note'  => 'nullable|string|max:500',
        ]);

        $submission = CddSubmission::findOrFail($request->submission_id);
        abort_if($submission->recruiter_id !== auth()->user()->recruiter->id, 403);

        $submission->update([
            'client_status'          => 'rejected',
            'client_rejection_reason'=> $request->rejection_reason,
            'client_status_updated_at'=> now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function addCandidate(Request $request): JsonResponse
    {
        $request->validate([
            'mandate_id'      => 'required|uuid|exists:mandates,id',
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'email'           => 'nullable|email',
            'linkedin_url'    => 'nullable|url',
            'current_role'    => 'nullable|string|max:200',
            'current_company' => 'nullable|string|max:200',
            'initial_stage'   => 'required|in:sourced,screened',
            'cv'              => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $recruiter = auth()->user()->recruiter;

        $candidate = Candidate::create([
            'recruiter_id'   => $recruiter->id,
            'first_name'     => $request->first_name,
            'last_name'      => $request->last_name,
            'email'          => $request->email,
            'linkedin_url'   => $request->linkedin_url,
            'current_role'   => $request->current_role,
            'current_company'=> $request->current_company,
        ]);

        if ($request->hasFile('cv')) {
            $path = $request->file('cv')->store("cvs/{$recruiter->id}/{$candidate->id}", 's3');
            $candidate->update([
                'cv_url'           => $path,
                'cv_original_name' => $request->file('cv')->getClientOriginalName(),
                'cv_uploaded_at'   => now(),
            ]);
            ParseCvJob::dispatch($candidate, $request->mandate_id)->onQueue('ai');
        }

        // Create CDD submission in the initial stage
        $submission = CddSubmission::create([
            'mandate_id'          => $request->mandate_id,
            'recruiter_id'        => $recruiter->id,
            'candidate_id'        => $candidate->id,
            'client_status'       => $request->initial_stage,
            'admin_review_status' => 'pending',
            'submitted_at'        => now(),
        ]);

        return response()->json([
            'success'    => true,
            'submission' => CddSubmissionResource::make($submission->load('candidate')),
            'parsing'    => $request->hasFile('cv'),
        ]);
    }
}
```

---

## Routes

```php
Route::middleware(['auth','role:recruiter'])->prefix('recruiter')->name('recruiter.')->group(function () {
    Route::get('/kanban/{mandate}',               [KanbanController::class, 'show'])->name('kanban.show');
    Route::post('/kanban/move',                    [KanbanController::class, 'move'])->name('kanban.move');
    Route::post('/kanban/schedule-interview',      [KanbanController::class, 'scheduleInterview'])->name('kanban.schedule-interview');
    Route::post('/kanban/save-client-feedback',    [KanbanController::class, 'saveClientFeedback'])->name('kanban.save-client-feedback');
    Route::post('/kanban/submit-to-client',        [KanbanController::class, 'submitToClient'])->name('kanban.submit-to-client');
    Route::post('/kanban/reject',                  [KanbanController::class, 'reject'])->name('kanban.reject');
    Route::post('/kanban/add-candidate',           [KanbanController::class, 'addCandidate'])->name('kanban.add-candidate');
});
```

---

## React — Full Kanban Page

```jsx
// Pages/Recruiter/Kanban/Show.jsx
import { useState, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import RecruiterLayout from '@/Components/layout/RecruiterLayout'
import { initials, fmtRelative, stageColor } from '@/lib/utils'

const STAGE_LABELS = { sourced:'Sourced', screened:'Screened', interview:'Interview', offered:'Offered', hired:'Hired', rejected:'Rejected' }
const CSRF = () => document.querySelector('meta[name=csrf-token]').content

export default function KanbanShow({ mandate, claim, submissions: initialSubs, stages, stats }) {
    const [cards, setCards]           = useState(
        initialSubs.reduce((acc, s) => { (acc[s.client_status] ??= []).push(s); return acc }, {})
    )
    const [activeCard, setActiveCard] = useState(null)
    const [sidePanel, setSidePanel]   = useState(null) // submission object
    const [rejectModal, setRejectModal]   = useState(null)
    const [addModal, setAddModal]         = useState(false)
    const [submitModal, setSubmitModal]   = useState(null)

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

    function allCards() { return Object.values(cards).flat() }

    function handleDragStart({ active }) {
        setActiveCard(allCards().find(c => c.id === active.id))
    }

    function handleDragEnd({ active, over }) {
        if (!over) return
        const newStage = over.id  // droppable column id = stage name
        const card     = allCards().find(c => c.id === active.id)
        if (!card || card.client_status === newStage) return

        // Optimistic update
        setCards(prev => {
            const updated = { ...prev }
            Object.keys(updated).forEach(s => { updated[s] = updated[s].filter(c => c.id !== card.id) })
            const moved = { ...card, client_status: newStage }
            updated[newStage] = [...(updated[newStage] ?? []), moved]
            return updated
        })
        setActiveCard(null)

        // Persist
        fetch(route('recruiter.kanban.move'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: card.id, new_stage: newStage }),
        })
    }

    function handleMoveFromPanel(submissionId, newStage) {
        const card = allCards().find(c => c.id === submissionId)
        if (!card) return
        setCards(prev => {
            const updated = { ...prev }
            Object.keys(updated).forEach(s => { updated[s] = updated[s].filter(c => c.id !== submissionId) })
            updated[newStage] = [...(updated[newStage] ?? []), { ...card, client_status: newStage }]
            return updated
        })
        if (sidePanel?.id === submissionId) setSidePanel(p => ({ ...p, client_status: newStage }))
        fetch(route('recruiter.kanban.move'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: submissionId, new_stage: newStage }),
        })
    }

    const scoreColor = s => s >= 80 ? 'var(--jade2)' : s >= 60 ? 'var(--amber2)' : 'var(--ruby2)'

    return (
        <RecruiterLayout>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                {/* Topbar */}
                <div style={{ background: '#fff', borderBottom: '1px solid var(--wire)', padding: '12px 20px', flexShrink: 0, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--sea-pale)', color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, border: '1px solid var(--wire)' }}>
                            {initials(mandate.client?.company_name ?? '')}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                                {mandate.title}
                                {mandate.is_exclusive && <span className="cbadge cb-gld">Exclusive</span>}
                                <span className="cbadge cb-jade">Picked</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{mandate.client?.company_name}</div>
                        </div>
                    </div>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 14, marginLeft: 10 }}>
                        {[['Candidates', stats.total],['Top score', `${stats.top_score}%`],['Days active', stats.days_active],['Submitted', stats.submitted]].map(([l,v]) => (
                            <div key={l} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-head)', color: 'var(--ink)' }}>{v}</div>
                                <div style={{ fontSize: 10, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{l}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setAddModal(true)}>+ Add candidate</button>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--violet2)', borderColor: 'var(--violet-soft)' }}>✦ Run AI matching</button>
                        <button className="btn btn-primary btn-sm"
                            onClick={() => {
                                const unsent = allCards().filter(c => !['approved','bypassed'].includes(c.admin_review_status))
                                if (unsent.length) setSubmitModal(unsent[0])
                            }}>
                            Submit to client
                        </button>
                    </div>
                </div>

                {/* Kanban board + side panel */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Board */}
                    <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '14px 16px' }}>
                        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 220px)`, gap: 8, height: '100%' }}>
                                {stages.map(stage => (
                                    <KanbanColumn
                                        key={stage}
                                        stage={stage}
                                        label={STAGE_LABELS[stage]}
                                        color={stageColor(stage)}
                                        cards={cards[stage] ?? []}
                                        onCardClick={setSidePanel}
                                        onAddClick={() => setAddModal(true)}
                                        onRejectClick={setRejectModal}
                                        scoreColor={scoreColor}
                                    />
                                ))}
                            </div>
                            <DragOverlay>
                                {activeCard && <KanbanCard card={activeCard} scoreColor={scoreColor} isDragging />}
                            </DragOverlay>
                        </DndContext>
                    </div>

                    {/* Side panel */}
                    {sidePanel && (
                        <KanbanSidePanel
                            submission={sidePanel}
                            stages={stages}
                            stageColor={stageColor}
                            scoreColor={scoreColor}
                            onClose={() => setSidePanel(null)}
                            onMove={handleMoveFromPanel}
                            onReject={setRejectModal}
                            mandate={mandate}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            {rejectModal  && <RejectionModal sub={rejectModal} onClose={() => setRejectModal(null)} onConfirm={reason => {
                fetch(route('recruiter.kanban.reject'), { method: 'POST', headers: {'X-CSRF-TOKEN': CSRF(), 'Content-Type': 'application/json'}, body: JSON.stringify({ submission_id: rejectModal.id, rejection_reason: reason.type, rejection_note: reason.note }) })
                    .then(() => handleMoveFromPanel(rejectModal.id, 'rejected'))
                setRejectModal(null)
            }} />}

            {addModal     && <AddCandidateModal mandateId={mandate.id} onClose={() => setAddModal(false)} onSuccess={sub => {
                setCards(prev => ({ ...prev, [sub.client_status]: [...(prev[sub.client_status] ?? []), sub] }))
                setAddModal(false)
            }} />}

            {submitModal  && <SubmitToClientModal sub={submitModal} onClose={() => setSubmitModal(null)} onSuccess={result => {
                setCards(prev => {
                    const updated = { ...prev }
                    Object.keys(updated).forEach(s => { updated[s] = updated[s].map(c => c.id === submitModal.id ? { ...c, admin_review_status: result.bypassed ? 'bypassed' : 'pending' } : c) })
                    return updated
                })
                setSubmitModal(null)
            }} />}
        </RecruiterLayout>
    )
}

// ── Column ────────────────────────────────────────────────────────────────
function KanbanColumn({ stage, label, color, cards, onCardClick, onAddClick, onRejectClick, scoreColor }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink4)' }}>{label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--mist2)', border: '1px solid var(--wire)', borderRadius: 10, padding: '1px 5px', fontFamily: 'var(--mono)', color: 'var(--ink4)' }}>{cards.length}</span>
                </div>
                <button onClick={onAddClick} style={{ fontSize: 14, color: 'var(--ink4)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>+</button>
            </div>

            {/* Cards */}
            <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy} id={stage}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {cards.map(card => (
                        <KanbanCard key={card.id} card={card} scoreColor={scoreColor}
                            onClick={() => onCardClick(card)}
                            onReject={() => onRejectClick(card)} />
                    ))}
                    {/* Drop zone */}
                    <div style={{ minHeight: 40, border: '1.5px dashed var(--wire2)', borderRadius: 'var(--rsm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink4)', cursor: 'pointer' }} onClick={onAddClick}>
                        + Add candidate
                    </div>
                </div>
            </SortableContext>
        </div>
    )
}

// ── Card ─────────────────────────────────────────────────────────────────
function KanbanCard({ card, scoreColor, onClick, onReject, isDragging }) {
    const c = card.candidate ?? {}
    return (
        <div onClick={onClick} style={{
            background: '#fff', border: '1px solid var(--wire)', borderRadius: 'var(--rsm)',
            padding: '8px 10px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
            opacity: isDragging ? .5 : card.client_status === 'rejected' ? .65 : 1,
            borderStyle: card.client_status === 'rejected' ? 'dashed' : 'solid',
        }}>
            {/* Top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stageColor(card.client_status) }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5, marginTop: 4 }}>
                {/* Avatar */}
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--sea-pale)', color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, flexShrink: 0 }}>
                    {initials((c.first_name ?? '') + ' ' + (c.last_name ?? ''))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.first_name} {c.last_name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.current_role} · {c.current_company}
                    </div>
                </div>
                {/* AI score */}
                {card.ai_score != null && (
                    <div style={{ fontSize: 11, fontWeight: 500, color: scoreColor(card.ai_score), flexShrink: 0, fontFamily: 'var(--mono)' }}>{card.ai_score}%</div>
                )}
            </div>

            {/* Match bar */}
            {card.ai_score != null && (
                <div style={{ height: 3, background: 'var(--wire)', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: 3, borderRadius: 2, background: scoreColor(card.ai_score), width: `${card.ai_score}%` }} />
                </div>
            )}

            {/* Chips */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                {c.cv_url       && <span className="cbadge cb-jade">CV ✓</span>}
                {card.interview_date && <span className="cbadge cb-vio">{new Date(card.interview_date).toLocaleDateString('en-SG', { day:'numeric', month:'short' })}</span>}
                {card.client_feedback && <span className="cbadge cb-sea">Feedback</span>}
                {card.client_status === 'rejected' && card.client_rejection_reason && (
                    <span className="cbadge cb-rub">{card.client_rejection_reason}</span>
                )}
            </div>

            {/* Recruiter note */}
            {card.recruiter_note && (
                <div style={{ fontSize: 10, color: 'var(--ink4)', borderLeft: '2px solid var(--wire2)', paddingLeft: 6, lineHeight: 1.5, marginBottom: 4 }}>
                    {card.recruiter_note.slice(0, 60)}{card.recruiter_note.length > 60 ? '…' : ''}
                </div>
            )}

            {/* Flag pills */}
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
                {card.green_flags?.slice(0,2).map((f,i) => <span key={i} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--jade-pale)', color: 'var(--jade)' }}>✓ {f}</span>)}
                {card.red_flags?.slice(0,2).map((f,i) => <span key={i} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--ruby-pale)', color: 'var(--ruby)' }}>⚠ {f}</span>)}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <div style={{ fontSize: 9, color: 'var(--wire2)', fontFamily: 'var(--mono)' }}>{fmtRelative(card.submitted_at)}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button className="dcard-ghost-btn" style={{ fontSize: 9, padding: '2px 7px' }} onClick={e => { e.stopPropagation(); }}>View</button>
                    {card.client_status !== 'rejected' && (
                        <button style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, border: 'none', background: 'transparent', color: 'var(--ruby2)', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onReject() }}>✕</button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Side Panel ────────────────────────────────────────────────────────────
function KanbanSidePanel({ submission, stages, stageColor, scoreColor, onClose, onMove, onReject, mandate }) {
    const [tab, setTab]           = useState('overview')
    const [intDate, setIntDate]   = useState(submission.interview_date?.slice(0,10) ?? '')
    const [intFmt, setIntFmt]     = useState(submission.interview_format ?? 'video')
    const [intNote, setIntNote]   = useState(submission.interview_notes ?? '')
    const [fbText, setFbText]     = useState(submission.client_feedback ?? '')
    const [fbSent, setFbSent]     = useState(submission.client_feedback_sentiment ?? 'positive')
    const [note, setNote]         = useState(submission.recruiter_note ?? '')
    const c = submission.candidate ?? {}
    const score = submission.ai_score

    function saveInterview() {
        fetch(route('recruiter.kanban.schedule-interview'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: submission.id, interview_date: intDate, interview_format: intFmt, interview_notes: intNote }),
        }).then(() => onMove(submission.id, 'interview'))
    }

    function saveFeedback() {
        fetch(route('recruiter.kanban.save-client-feedback'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: submission.id, client_feedback: fbText, client_feedback_sentiment: fbSent }),
        })
    }

    return (
        <div style={{ width: 310, background: '#fff', borderLeft: '1px solid var(--wire)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--wire)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sea-pale)', color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>
                    {initials((c.first_name ?? '') + ' ' + (c.last_name ?? ''))}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{c.current_role} · {c.current_company}</div>
                </div>
                <button onClick={onClose} style={{ fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)' }}>✕</button>
            </div>

            {/* Stage mover */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--wire)' }}>
                <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 6 }}>Move to stage</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {stages.map(s => (
                        <button key={s} onClick={() => onMove(submission.id, s)}
                            style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, border: `1px solid ${submission.client_status === s ? stageColor(s) : 'var(--wire)'}`, background: submission.client_status === s ? `${stageColor(s)}20` : 'transparent', color: submission.client_status === s ? stageColor(s) : 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: submission.client_status === s ? 500 : 400 }}>
                            {STAGE_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* CV section */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--wire)' }}>
                {c.cv_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--jade-pale)', border: '1px solid var(--jade-soft)', borderRadius: 'var(--rsm)', padding: '7px 10px' }}>
                        <span>📄</span>
                        <div style={{ flex: 1, fontSize: 11, color: 'var(--jade)' }}>{c.cv_original_name?.slice(0,30)}… {c.cv_parsed_at ? '· AI parsed ✓' : ''}</div>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: '2px 8px' }}>View</button>
                    </div>
                ) : (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--mist2)', border: '1.5px dashed var(--wire2)', borderRadius: 'var(--rsm)', padding: '8px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--ink4)' }}>
                        📄 Upload CV
                        <input type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx" />
                    </label>
                )}
            </div>

            {/* AI score + breakdown */}
            {score != null && (
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--wire)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${scoreColor(score)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-head)', color: scoreColor(score) }}>{score}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            {['experience','industry','scope','leadership'].map(d => (
                                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                    <div style={{ fontSize: 9, color: 'var(--ink4)', width: 64, textTransform: 'capitalize' }}>{d}</div>
                                    <div style={{ flex: 1, height: 3, background: 'var(--wire)', borderRadius: 2 }}>
                                        <div style={{ height: 3, borderRadius: 2, background: scoreColor(score), width: `${submission.score_breakdown?.[d] ?? 0}%` }} />
                                    </div>
                                    <div style={{ fontSize: 9, color: 'var(--ink4)', width: 20, textAlign: 'right', fontFamily: 'var(--mono)' }}>{submission.score_breakdown?.[d] ?? 0}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {submission.green_flags?.map((f,i) => <span key={i} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--jade-pale)', color: 'var(--jade)' }}>✓ {f}</span>)}
                        {submission.red_flags?.map((f,i) => <span key={i} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--ruby-pale)', color: 'var(--ruby)' }}>⚠ {f}</span>)}
                    </div>
                </div>
            )}

            {/* Interview scheduling */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--wire)' }}>
                <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8 }}>Interview scheduling</div>
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={intDate} onChange={e => setIntDate(e.target.value)} style={{ fontSize: 11 }} />
                </div>
                <div className="form-group">
                    <label className="form-label">Format</label>
                    <select className="form-input" value={intFmt} onChange={e => setIntFmt(e.target.value)} style={{ fontSize: 11 }}>
                        <option value="in_person">In-person</option>
                        <option value="video">Video call</option>
                        <option value="panel">Panel</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input className="form-input" value={intNote} onChange={e => setIntNote(e.target.value)} placeholder="Location, interviewers…" style={{ fontSize: 11 }} />
                </div>
                <button className="btn btn-secondary btn-sm" onClick={saveInterview}>Save interview</button>
            </div>

            {/* Client feedback */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--wire)' }}>
                <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8 }}>Client feedback</div>
                {submission.client_feedback && (
                    <div style={{ fontSize: 11, color: 'var(--ink4)', background: 'var(--mist2)', border: '1px solid var(--wire)', borderRadius: 'var(--rsm)', padding: '7px 10px', marginBottom: 8, fontStyle: 'italic' }}>
                        "{submission.client_feedback}"
                        <span className={`cbadge ${submission.client_feedback_sentiment === 'positive' ? 'cb-jade' : submission.client_feedback_sentiment === 'negative' ? 'cb-rub' : 'cb-sea'}`} style={{ marginLeft: 6 }}>
                            {submission.client_feedback_sentiment}
                        </span>
                    </div>
                )}
                <textarea className="form-input" rows={2} value={fbText} onChange={e => setFbText(e.target.value)} placeholder="Add client feedback note…" style={{ fontSize: 11, resize: 'vertical', marginBottom: 6 }} />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <select className="form-input" value={fbSent} onChange={e => setFbSent(e.target.value)} style={{ fontSize: 11, flex: 1 }}>
                        <option value="positive">Positive</option>
                        <option value="neutral">Neutral</option>
                        <option value="negative">Negative</option>
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={saveFeedback}>Save</button>
                </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => {}}>Submit to client</button>
                <button className="btn btn-secondary btn-sm">Draft outreach</button>
                <button className="btn btn-secondary btn-sm">Generate interview Qs</button>
                <button className="btn btn-secondary btn-sm" onClick={() => onReject(submission)} style={{ color: 'var(--ruby2)' }}>Reject candidate</button>
            </div>
        </div>
    )
}

// ── Rejection Modal ───────────────────────────────────────────────────────
function RejectionModal({ sub, onClose, onConfirm }) {
    const [reason, setReason] = useState('')
    const [note, setNote]     = useState('')

    const REASONS = [
        { value: 'client', label: 'Client rejected', desc: 'Client reviewed and passed on this candidate' },
        { value: 'withdrew', label: 'Candidate withdrew', desc: 'Candidate pulled out of the process' },
        { value: 'unsuitable', label: 'Not suitable for role', desc: "Doesn't meet the core requirements" },
        { value: 'compensation', label: 'Compensation mismatch', desc: "Salary expectations couldn't be aligned" },
    ]

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 'var(--r)', border: '1px solid var(--wire)', padding: '20px 22px', width: '100%', maxWidth: 440 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Reject candidate</div>
                    <button onClick={onClose} style={{ fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)' }}>✕</button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 14 }}>
                    Select a rejection reason — this helps track why candidates were removed.
                </div>
                {REASONS.map(r => (
                    <div key={r.value} onClick={() => setReason(r.value)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderRadius: 'var(--rsm)', marginBottom: 6, border: `1px solid ${reason === r.value ? 'var(--ruby2)' : 'var(--wire)'}`, background: reason === r.value ? 'var(--ruby-pale)' : '#fff', cursor: 'pointer' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${reason === r.value ? 'var(--ruby2)' : 'var(--wire2)'}`, marginTop: 2, flexShrink: 0, background: reason === r.value ? 'var(--ruby2)' : 'transparent' }} />
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: reason === r.value ? 'var(--ruby)' : 'var(--ink)' }}>{r.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{r.desc}</div>
                        </div>
                    </div>
                ))}
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 5 }}>Additional note (optional)</div>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Add context for future reference…"
                        style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid var(--wire)', borderRadius: 'var(--rsm)', resize: 'vertical', minHeight: 60, outline: 'none', fontFamily: 'var(--font)' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={() => { if (!reason) return; onConfirm({ type: reason, note }) }}
                        disabled={!reason}
                        style={{ flex: 1, padding: '9px', borderRadius: 'var(--rsm)', background: reason ? 'var(--ruby2)' : 'var(--mist4)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: reason ? 'pointer' : 'not-allowed' }}>
                        Confirm rejection
                    </button>
                    <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--rsm)', background: 'transparent', border: '1px solid var(--wire2)', color: 'var(--ink4)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                </div>
            </div>
        </div>
    )
}

// ── Add Candidate Modal ───────────────────────────────────────────────────
function AddCandidateModal({ mandateId, onClose, onSuccess }) {
    const [form, setForm]     = useState({ first_name:'', last_name:'', email:'', linkedin_url:'', current_role:'', current_company:'', initial_stage:'sourced' })
    const [cvFile, setCvFile] = useState(null)
    const [loading, setLoading] = useState(false)

    function handleSubmit() {
        setLoading(true)
        const fd = new FormData()
        Object.entries(form).forEach(([k,v]) => fd.append(k, v))
        fd.append('mandate_id', mandateId)
        if (cvFile) fd.append('cv', cvFile)

        fetch(route('recruiter.kanban.add-candidate'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF() },
            body: fd,
        })
        .then(r => r.json())
        .then(d => { if (d.success) onSuccess(d.submission) })
        .finally(() => setLoading(false))
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 'var(--r)', border: '1px solid var(--wire)', padding: '20px 22px', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Add candidate to pipeline</div>
                    <button onClick={onClose} style={{ fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div className="form-group">
                        <label className="form-label">First name</label>
                        <input className="form-input" value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} placeholder="Sarah" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last name</label>
                        <input className="form-input" value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} placeholder="Wong" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Current role & company</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input className="form-input" value={form.current_role} onChange={e => setForm(p => ({...p, current_role: e.target.value}))} placeholder="CHRO" />
                        <input className="form-input" value={form.current_company} onChange={e => setForm(p => ({...p, current_company: e.target.value}))} placeholder="OCBC Bank" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="sarah@email.com" />
                </div>
                <div className="form-group">
                    <label className="form-label">LinkedIn</label>
                    <input className="form-input" value={form.linkedin_url} onChange={e => setForm(p => ({...p, linkedin_url: e.target.value}))} placeholder="linkedin.com/in/sarahwong" />
                </div>
                <div className="form-group">
                    <label className="form-label">Initial stage</label>
                    <select className="form-input" value={form.initial_stage} onChange={e => setForm(p => ({...p, initial_stage: e.target.value}))}>
                        <option value="sourced">Sourced</option>
                        <option value="screened">Screened</option>
                    </select>
                </div>
                {/* CV upload zone */}
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--mist2)', border: `1.5px dashed ${cvFile ? 'var(--jade2)' : 'var(--wire2)'}`, borderRadius: 'var(--rsm)', padding: '14px 16px', cursor: 'pointer', marginBottom: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 5 }}>📄</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{cvFile ? cvFile.name : 'Upload CV (PDF or DOCX)'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Claude will auto-parse & score against role requirements</div>
                    <input type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0])} />
                </label>
                {/* AI note */}
                <div style={{ background: 'var(--violet-pale)', border: '1px solid var(--violet-soft)', borderRadius: 'var(--rsm)', padding: '8px 12px', marginBottom: 14, fontSize: 11, color: 'var(--violet2)' }}>
                    ✦ After adding: Claude reads the CV, extracts profile data, then scores against role requirements automatically.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading || !form.first_name || !form.last_name}>
                        {loading ? 'Adding…' : 'Add candidate & run AI analysis'}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    )
}

// ── Submit to Client Modal ────────────────────────────────────────────────
function SubmitToClientModal({ sub, onClose, onSuccess }) {
    const [note, setNote]   = useState(sub.recruiter_note ?? '')
    const [loading, setLoading] = useState(false)

    function handleSubmit() {
        setLoading(true)
        fetch(route('recruiter.kanban.submit-to-client'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id: sub.id, recruiter_note: note }),
        })
        .then(r => r.json())
        .then(d => { if (d.success) onSuccess(d) })
        .finally(() => setLoading(false))
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 'var(--r)', border: '1px solid var(--wire)', padding: '20px 22px', width: '100%', maxWidth: 440 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Submit to client</div>
                <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 16 }}>
                    Submitting <strong>{sub.candidate?.first_name} {sub.candidate?.last_name}</strong> for admin review.
                    {sub.exception_bypass && ' (Trusted bypass — will skip admin and go directly to client.)'}
                </div>
                <div className="form-group">
                    <label className="form-label">Recruiter note to client (optional)</label>
                    <textarea className="form-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add context or key points for the client…" style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting…' : 'Submit for review'}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    )
}
