import { useState } from 'react'
import { initials, stageColor } from '@/lib/utils'

const STAGE_LABELS = {
    sourced: 'Sourced', screened: 'Screened', interview: 'Interview',
    offered: 'Offered', hired: 'Hired', rejected: 'Rejected',
}

const STAGES = ['sourced', 'screened', 'interview', 'offered', 'hired', 'rejected']

const scoreColor = s => s >= 80 ? 'var(--jade2)' : s >= 60 ? 'var(--amber2)' : 'var(--ruby2)'

function CandidateCard({ sub, onClick }) {
    const c = sub.candidate
    const name = c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '—'
    const score = sub.ai_score

    return (
        <div
            onClick={onClick}
            style={{
                background: '#fff', border: '1px solid var(--wire)', borderRadius: 'var(--r)',
                padding: '10px 12px', cursor: 'pointer', transition: 'border-color .15s',
                marginBottom: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sea3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--wire)'}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                {/* Avatar */}
                <div style={{
                    width: 30, height: 30, borderRadius: '50%', background: 'var(--sea-pale)',
                    color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, flexShrink: 0, border: '1px solid var(--wire)',
                }}>
                    {initials(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c?.current_role ?? ''}
                        {c?.current_role && c?.current_company ? ' · ' : ''}
                        {c?.current_company ?? ''}
                    </div>
                </div>
                {/* Score ring */}
                {score != null && (
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%', border: `2px solid ${scoreColor(score)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 600, color: scoreColor(score), flexShrink: 0,
                    }}>
                        {score}
                    </div>
                )}
            </div>

            {/* Admin review status */}
            {sub.admin_review_status && sub.admin_review_status !== 'approved' && (
                <div style={{ marginTop: 7 }}>
                    <span className={`badge badge-${sub.admin_review_status === 'rejected' ? 'ruby' : 'amber'}`} style={{ fontSize: 9 }}>
                        {sub.admin_review_status}
                    </span>
                </div>
            )}
        </div>
    )
}

function SidePanel({ sub, onClose }) {
    if (!sub) return null
    const c = sub.candidate
    const name = c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '—'
    const score = sub.ai_score

    return (
        <div style={{
            width: 320, flexShrink: 0, background: '#fff', borderLeft: '1px solid var(--wire)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            {/* Panel header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--mist)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: '50%', background: 'var(--sea-pale)',
                        color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, border: '1px solid var(--wire)',
                    }}>
                        {initials(name)}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>
                            {c?.current_role ?? ''}{c?.current_role && c?.current_company ? ' @ ' : ''}{c?.current_company ?? ''}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {/* Stage badge */}
                <div style={{ marginBottom: 14 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500,
                        padding: '4px 10px', borderRadius: 20, color: '#fff', background: stageColor(sub.client_status),
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.6)' }} />
                        {STAGE_LABELS[sub.client_status] ?? sub.client_status}
                    </span>
                </div>

                {/* AI score */}
                {score != null && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>AI Match Score</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '50%',
                                border: `3px solid ${scoreColor(score)}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 700, color: scoreColor(score),
                            }}>
                                {score}
                            </div>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--wire)', overflow: 'hidden' }}>
                                <div style={{ width: `${score}%`, height: '100%', background: scoreColor(score), borderRadius: 3 }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* AI summary */}
                {sub.ai_summary && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>AI Summary</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, borderLeft: '3px solid var(--violet2)', paddingLeft: 10, background: 'var(--mist)', borderRadius: '0 var(--rsm) var(--rsm) 0', padding: '8px 10px 8px 12px' }}>
                            {sub.ai_summary}
                        </div>
                    </div>
                )}

                {/* Flags */}
                {(sub.green_flags?.length > 0 || sub.red_flags?.length > 0) && (
                    <div style={{ marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {sub.green_flags?.length > 0 && (
                            <div style={{ background: 'var(--jade-pale)', borderRadius: 'var(--rsm)', padding: '8px 10px' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--jade)', marginBottom: 4 }}>Strengths</div>
                                {sub.green_flags.map((f, i) => (
                                    <div key={i} style={{ fontSize: 11, color: 'var(--jade)', display: 'flex', gap: 4, marginBottom: 2 }}>
                                        <span>✓</span><span>{f}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {sub.red_flags?.length > 0 && (
                            <div style={{ background: 'var(--ruby-pale)', borderRadius: 'var(--rsm)', padding: '8px 10px' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ruby2)', marginBottom: 4 }}>Watch-outs</div>
                                {sub.red_flags.map((f, i) => (
                                    <div key={i} style={{ fontSize: 11, color: 'var(--ruby2)', display: 'flex', gap: 4, marginBottom: 2 }}>
                                        <span>!</span><span>{f}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Recruiter note */}
                {sub.recruiter_note && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Recruiter Note</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, background: 'var(--mist)', borderRadius: 'var(--rsm)', padding: '8px 10px', border: '1px solid var(--wire)' }}>
                            {sub.recruiter_note}
                        </div>
                    </div>
                )}

                {/* Admin review status */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Review Status</div>
                    <span className={`badge badge-${sub.admin_review_status === 'approved' ? 'jade' : sub.admin_review_status === 'rejected' ? 'ruby' : 'amber'}`}>
                        {sub.admin_review_status}
                    </span>
                </div>

                {/* Client feedback */}
                {sub.client_feedback && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Client Feedback</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, background: 'var(--sea-pale)', borderRadius: 'var(--rsm)', padding: '8px 10px', border: '1px solid var(--sea-soft)' }}>
                            {sub.client_feedback}
                        </div>
                    </div>
                )}

                {/* Interview */}
                {sub.interview_date && (
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Interview</div>
                        <div style={{ fontSize: 12, color: 'var(--ink)' }}>{sub.interview_date}</div>
                        {sub.interview_format && <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{sub.interview_format}</div>}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * PipelineBoard — read-only kanban pipeline view.
 * Props:
 *   submissions   — array of CDD submission objects
 *   stages        — optional custom stage order (default: all 6)
 *   filterStages  — optional subset of stages to show
 */
export default function PipelineBoard({ submissions = [], stages: stageProp, filterStages }) {
    const stages = filterStages ?? stageProp ?? STAGES
    const [panel, setPanel] = useState(null)

    // Group by client_status
    const columns = {}
    stages.forEach(s => { columns[s] = [] })
    submissions.forEach(sub => {
        const st = sub.client_status || 'sourced'
        if (columns[st] !== undefined) columns[st].push(sub)
    })

    const total = submissions.length
    const topScore = submissions.reduce((max, s) => s.ai_score != null && s.ai_score > max ? s.ai_score : max, 0)
    const submitted = submissions.filter(s => ['shortlisted','interview','offer_made','hired'].includes(s.client_status)).length
    const hired = submissions.filter(s => s.client_status === 'hired').length

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 12, padding: '10px 0', flexShrink: 0, marginBottom: 2 }}>
                {[
                    ['Total', total],
                    ['Top Score', topScore || '—'],
                    ['Submitted', submitted],
                    ['Hired', hired],
                ].map(([lbl, val]) => (
                    <div key={lbl} style={{ background: 'var(--mist)', border: '1px solid var(--wire)', borderRadius: 'var(--rsm)', padding: '6px 14px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{val}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 1 }}>{lbl}</div>
                    </div>
                ))}
            </div>

            {/* Board + side panel */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
                {/* Scrollable columns */}
                <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 200px)`, gap: 8, height: '100%', minHeight: 300 }}>
                        {stages.map(stage => (
                            <div key={stage} style={{ display: 'flex', flexDirection: 'column', background: 'var(--mist2)', borderRadius: 'var(--r)', border: '1px solid var(--wire)', overflow: 'hidden' }}>
                                {/* Column header */}
                                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--wire)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stageColor(stage), flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{STAGE_LABELS[stage] ?? stage}</span>
                                    <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink4)', background: 'var(--wire)', padding: '1px 5px', borderRadius: 10 }}>
                                        {columns[stage]?.length ?? 0}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
                                    {(columns[stage] ?? []).map(sub => (
                                        <CandidateCard key={sub.id} sub={sub} onClick={() => setPanel(sub)} />
                                    ))}
                                    {(columns[stage]?.length ?? 0) === 0 && (
                                        <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'var(--ink4)', opacity: .5 }}>No candidates</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side panel */}
                {panel && <SidePanel sub={panel} onClose={() => setPanel(null)} />}
            </div>
        </div>
    )
}
