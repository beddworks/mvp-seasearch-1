import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { fmtDate } from '@/lib/utils'

async function callAi(url, body = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
    return res.json()
}

const STAGE_COLORS = {
    pending:   'var(--mist4)',
    sourced:   'var(--mist4)',
    screened:  'var(--amber2)',
    interview: 'var(--sea2)',
    offered:   'var(--violet2)',
    hired:     'var(--jade2)',
    rejected:  'var(--ruby2)',
    on_hold:   'var(--ink4)',
}

export default function MandateWorkspace({ mandate, claim, submissions: initialSubmissions, candidates, daysSince, timerADeadline, timerAOverdue }) {
    const [showSubmitModal, setShowSubmitModal] = useState(false)
    const [submissions, setSubmissions] = useState(initialSubmissions)
    const [runningAi, setRunningAi] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        mandate_id:    mandate.id,
        candidate_id:  '',
        recruiter_note: '',
    })

    async function runAiMatching() {
        setRunningAi(true)
        try {
            const data = await callAi(route('recruiter.ai.matching', mandate.id))
            if (data.results) {
                setSubmissions(prev => prev.map(s => {
                    const r = data.results.find(x => x.id === s.id)
                    return r ? { ...s, ai_score: r.score } : s
                }))
            }
        } finally {
            setRunningAi(false)
        }
    }

    function submitCandidate(e) {
        e.preventDefault()
        post(route('recruiter.submissions.store'), {
            onSuccess: () => { setShowSubmitModal(false); reset() }
        })
    }

    // Candidates not yet submitted for this mandate
    const submittedCandidateIds = submissions.map(s => s.candidate_id)
    const availableCandidates = candidates.filter(c => !submittedCandidateIds.includes(c.id))

    return (
        <RecruiterLayout title={mandate.title}>
            <div style={{ marginBottom: 16 }}>
                <Link href={route('recruiter.mandates.index')} style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>← Back to job board</Link>
            </div>

            {/* Header */}
            <div style={{ background: 'var(--ink)', borderRadius: 'var(--r)', padding: '18px 22px', marginBottom: 20, display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#fff' }}>{mandate.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--mist4)', marginTop: 4 }}>{mandate.client?.company_name}</div>
                </div>
                {/* Timer A status */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: timerAOverdue ? 'var(--ruby2)' : 'var(--mist4)' }}>
                        {timerAOverdue ? '⚠ TIMER A OVERDUE' : 'TIMER A'}
                    </div>
                    <div style={{ fontSize: 22, fontFamily: 'var(--font-head)', fontWeight: 700, color: timerAOverdue ? 'var(--ruby2)' : 'var(--jade3)' }}>
                        Day {daysSince ?? '—'}
                    </div>
                    {timerADeadline && (
                        <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                            Deadline: {fmtDate(timerADeadline)}
                        </div>
                    )}
                </div>
            </div>

            <div className="g21" style={{ alignItems: 'start' }}>
                {/* Submissions list */}
                <div>
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div className="dcard-head">
                            <span className="dcard-title">Submissions ({submissions.length}/3)</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {submissions.length > 0 && (
                                    <button className="btn btn-ghost btn-sm" onClick={runAiMatching} disabled={runningAi}
                                        style={{ color: 'var(--violet2)' }}>
                                        {runningAi ? '✦ Scoring…' : '✦ AI match'}
                                    </button>
                                )}
                                {submissions.length < 3 && availableCandidates.length > 0 && (
                                    <button className="dcard-ghost-btn" onClick={() => setShowSubmitModal(true)}>
                                        + Submit candidate
                                    </button>
                                )}
                            </div>
                        </div>
                        {submissions.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 12 }}>No candidates submitted yet.</p>
                                {availableCandidates.length > 0 ? (
                                    <button className="btn btn-primary" onClick={() => setShowSubmitModal(true)}>Submit first candidate</button>
                                ) : (
                                    <div>
                                        <p style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 10 }}>Add candidates to your library first.</p>
                                        <Link href={route('recruiter.candidates.index')} className="btn btn-secondary btn-sm">Go to candidates</Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            submissions.map(s => (
                                <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--wire)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.candidate?.first_name} {s.candidate?.last_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>
                                                {s.candidate?.current_role ?? '—'} · {s.candidate?.current_company ?? '—'}
                                            </div>
                                            {s.recruiter_note && (
                                                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4, fontStyle: 'italic' }}>
                                                    Note: {s.recruiter_note}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--rxs)',
                                                background: STAGE_COLORS[s.admin_review_status] ?? 'var(--mist4)',
                                                color: '#fff',
                                                fontSize: 10,
                                                fontFamily: 'var(--mono)',
                                                textTransform: 'uppercase',
                                            }}>
                                                {s.admin_review_status}
                                            </div>
                                            {s.ai_score != null && (
                                                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                                                    AI: {s.ai_score}/100
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: JD summary + candidate library shortcut */}
                <div>
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div className="dcard-head"><span className="dcard-title">Role summary</span></div>
                        <div style={{ padding: 16 }}>
                            {[
                                ['Client',    mandate.client?.company_name],
                                ['Location',  mandate.location],
                                ['Seniority', mandate.seniority],
                                ['Type',      mandate.contract_type],
                                ['Reward',    mandate.reward_pct ? `${mandate.reward_pct}%` : null],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12 }}>
                                    <span style={{ color: 'var(--ink4)', width: 72, flexShrink: 0 }}>{label}</span>
                                    <span style={{ fontWeight: 500 }}>{value}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: 10 }}>
                                <Link href={route('recruiter.mandates.show', mandate.id)} className="btn btn-ghost btn-sm">View full JD</Link>
                            </div>
                        </div>
                    </div>

                    <div className="dcard">
                        <div className="dcard-head">
                            <span className="dcard-title">Your candidates ({candidates.length})</span>
                            <Link href={route('recruiter.candidates.index')} className="dcard-ghost-btn">Manage</Link>
                        </div>
                        {candidates.slice(0, 5).map(c => (
                            <div key={c.id} style={{ padding: '9px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 12 }}>{c.first_name} {c.last_name}
                                    {submittedCandidateIds.includes(c.id) && <span className="badge badge-jade" style={{ marginLeft: 6, fontSize: 9 }}>Submitted</span>}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{c.current_role}</div>
                            </div>
                        ))}
                        {candidates.length === 0 && (
                            <div style={{ padding: 16, textAlign: 'center' }}>
                                <Link href={route('recruiter.candidates.index')} className="btn btn-primary btn-sm">Add candidates</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit modal */}
            {showSubmitModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--mist)', border: '1px solid var(--wire)', borderRadius: 'var(--r)', padding: 24, width: 480, maxHeight: '80vh', overflow: 'auto' }}>
                        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                            Submit candidate for {mandate.title}
                        </h3>
                        <form onSubmit={submitCandidate}>
                            <div className="form-group">
                                <label className="form-label">Select candidate *</label>
                                <select className="form-input" value={data.candidate_id} onChange={e => setData('candidate_id', e.target.value)}>
                                    <option value="">Choose from library…</option>
                                    {availableCandidates.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.first_name} {c.last_name}{c.current_role ? ` — ${c.current_role}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.candidate_id && <p className="form-error">{errors.candidate_id}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Recruiter note (optional)</label>
                                <textarea className="form-input" rows={3} placeholder="Why is this candidate a good fit?" value={data.recruiter_note} onChange={e => setData('recruiter_note', e.target.value)} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 14 }}>
                                {mandate.is_fast_track
                                    ? '⚡ Fast-track: submission goes directly to client.'
                                    : 'Submission will be reviewed by admin before the client sees it.'
                                }
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" className="btn btn-primary" disabled={processing || !data.candidate_id}>
                                    {processing ? 'Submitting…' : 'Submit candidate'}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowSubmitModal(false); reset() }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </RecruiterLayout>
    )
}
