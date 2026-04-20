import { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { initials, fmtRelative } from '@/lib/utils'

export default function FeedbackShow({ submission, token, statuses }) {
    const [selected, setSelected] = useState('')

    const { data, setData, post, processing, errors } = useForm({
        status:           '',
        rejection_reason: '',
        interview_date:   '',
        interview_format: 'video',
        interview_notes:  '',
    })

    function handleSelect(value) {
        setSelected(value)
        setData('status', value)
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (!data.status) return
        post(route('feedback.update', token))
    }

    const candidate = submission.candidate
    const mandate   = submission.mandate
    const score     = submission.ai_score
    const scoreColor = score >= 80 ? 'var(--jade2)' : score >= 60 ? 'var(--amber2)' : 'var(--ruby2)'

    return (
        <div style={{ minHeight: '100vh', background: 'var(--mist2)', fontFamily: 'var(--font)' }}>
            {/* Topbar */}
            <nav style={{ height: 52, background: 'var(--ink)', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    Sea<span style={{ color: 'var(--sea3)' }}>Search</span>
                </div>
                <div style={{ marginLeft: 16, fontSize: 12, color: 'var(--ink4)' }}>
                    Candidate feedback
                </div>
            </nav>

            <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '32px auto', width: '100%', padding: '0 20px' }}>
                {/* Candidate card */}
                <div className="dcard" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                        Candidate submitted for
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
                        {mandate.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--sea-pale)', color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                            {initials(`${candidate.first_name} ${candidate.last_name}`)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                                {candidate.first_name} {candidate.last_name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink4)' }}>
                                {candidate.current_role} · {candidate.current_company}
                            </div>
                        </div>
                        {score != null && (
                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor, fontFamily: 'var(--mono)' }}>{score}</div>
                                    <div style={{ fontSize: 8, color: 'var(--ink4)', textTransform: 'uppercase' }}>AI</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI summary */}
                    {submission.ai_summary && (
                        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink4)', lineHeight: 1.7, background: 'var(--mist2)', borderRadius: 'var(--rsm)', padding: '8px 12px', border: '1px solid var(--wire)' }}>
                            {submission.ai_summary}
                        </div>
                    )}

                    {/* Score bars */}
                    {submission.score_breakdown && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', marginTop: 12 }}>
                            {['experience', 'industry', 'scope', 'leadership'].map(d => (
                                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <div style={{ fontSize: 10, color: 'var(--ink4)', width: 72, textTransform: 'capitalize' }}>{d}</div>
                                    <div style={{ flex: 1, height: 4, background: 'var(--wire)', borderRadius: 2 }}>
                                        <div style={{ height: 4, borderRadius: 2, background: 'var(--sea2)', width: `${submission.score_breakdown[d] ?? 0}%` }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', width: 20 }}>{submission.score_breakdown[d] ?? 0}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Flags */}
                    {(submission.green_flags?.length > 0 || submission.red_flags?.length > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                            {submission.green_flags?.map((f, i) => (
                                <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--jade-pale)', color: 'var(--jade)' }}>✓ {f}</span>
                            ))}
                            {submission.red_flags?.map((f, i) => (
                                <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--ruby-pale)', color: 'var(--ruby2)' }}>⚠ {f}</span>
                            ))}
                        </div>
                    )}

                    {/* Recruiter note */}
                    {submission.recruiter_note && (
                        <div style={{ marginTop: 12, background: 'var(--mist2)', border: '1px solid var(--wire)', borderRadius: 'var(--rsm)', padding: '8px 12px', fontSize: 12, color: 'var(--ink4)', fontStyle: 'italic' }}>
                            <strong style={{ fontStyle: 'normal', fontWeight: 500, color: 'var(--ink4)' }}>
                                {submission.recruiter?.display_name ?? 'Recruiter'}:
                            </strong>{' '}
                            {submission.recruiter_note}
                        </div>
                    )}
                </div>

                {/* Status selection */}
                <div className="dcard" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
                        Update candidate status
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {statuses.map(s => (
                            <label
                                key={s.value}
                                onClick={() => handleSelect(s.value)}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '10px 14px', borderRadius: 'var(--rsm)',
                                    border: `1px solid ${selected === s.value ? 'var(--sea2)' : 'var(--wire)'}`,
                                    background: selected === s.value ? 'var(--sea-pale)' : '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{
                                    width: 14, height: 14, borderRadius: '50%', marginTop: 2, flexShrink: 0,
                                    border: `2px solid ${selected === s.value ? 'var(--sea2)' : 'var(--wire2)'}`,
                                    background: selected === s.value ? 'var(--sea2)' : 'transparent',
                                }} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: selected === s.value ? 'var(--sea)' : 'var(--ink)' }}>
                                        {s.label}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>{s.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Interview details */}
                {selected === 'interview' && (
                    <div className="dcard" style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
                            Interview details
                        </div>
                        <div className="form-group">
                            <label className="form-label">Preferred date</label>
                            <input className="form-input" type="date" value={data.interview_date}
                                onChange={e => setData('interview_date', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Format</label>
                            <select className="form-input" value={data.interview_format}
                                onChange={e => setData('interview_format', e.target.value)}>
                                <option value="video">Video call</option>
                                <option value="in_person">In-person</option>
                                <option value="panel">Panel interview</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes for recruiter</label>
                            <textarea className="form-input" rows={2} value={data.interview_notes}
                                onChange={e => setData('interview_notes', e.target.value)}
                                placeholder="Any specifics about the interview…"
                                style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                )}

                {/* Rejection reason */}
                {selected === 'rejected' && (
                    <div className="dcard" style={{ marginBottom: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Reason for not proceeding (optional)</label>
                            <textarea className="form-input" rows={2} value={data.rejection_reason}
                                onChange={e => setData('rejection_reason', e.target.value)}
                                placeholder="Helps Sea Search refine future submissions…"
                                style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!selected || processing}
                    style={{
                        width: '100%', padding: 12, borderRadius: 'var(--rsm)',
                        background: selected ? 'var(--sea2)' : 'var(--mist3)',
                        color: selected ? '#fff' : 'var(--ink4)',
                        border: 'none', fontSize: 14, fontWeight: 500,
                        cursor: selected ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--font)',
                    }}
                >
                    {processing ? 'Submitting…' : 'Submit feedback'}
                </button>

                <div style={{ fontSize: 11, color: 'var(--ink4)', textAlign: 'center', marginTop: 14 }}>
                    This link is single-use and will expire after submission.
                </div>
            </form>
        </div>
    )
}
