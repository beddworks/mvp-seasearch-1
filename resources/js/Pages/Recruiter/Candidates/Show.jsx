import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { fmtDate, initials } from '@/lib/utils'

const TABS = ['Profile', 'CV', 'AI Insights', 'Submissions', 'Notes']

const STAGE_COLORS = {
    pending:   'var(--mist4)',
    approved:  'var(--jade2)',
    rejected:  'var(--ruby2)',
    bypassed:  'var(--violet2)',
}

function ScoreRing({ score }) {
    const r = 28, c = 2 * Math.PI * r
    const pct = Math.max(0, Math.min(100, score ?? 0))
    const dash = (pct / 100) * c
    const color = pct >= 75 ? 'var(--jade2)' : pct >= 50 ? 'var(--amber2)' : 'var(--ruby2)'

    return (
        <svg width={70} height={70} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={35} cy={35} r={r} fill="none" stroke="var(--mist3)" strokeWidth={6} />
            <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={6}
                strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
            <text x={35} y={35} textAnchor="middle" dominantBaseline="central"
                style={{ fill: color, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '35px 35px' }}>
                {pct}
            </text>
        </svg>
    )
}

function AiInsightsPanel({ candidate }) {
    const [outreachModal, setOutreachModal] = useState(false)
    const [outreach, setOutreach] = useState(null)
    const [loadingOutreach, setLoadingOutreach] = useState(false)
    const [mandateId, setMandateId] = useState('')

    const parsed = candidate?.parsed_profile ?? null
    const skills = candidate?.skills ?? []

    async function generateOutreach() {
        if (!mandateId) return
        setLoadingOutreach(true)
        try {
            const res = await fetch(route('recruiter.ai.outreach', candidate.id), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mandate_id: mandateId }),
            })
            const data = await res.json()
            setOutreach(data)
        } finally {
            setLoadingOutreach(false)
        }
    }

    return (
        <div>
            {/* CV parse status */}
            {!candidate.cv_parsed && (
                <div style={{ background: 'var(--violet-pale)', border: '1px solid var(--violet2)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--violet2)' }}>✦ CV not yet AI-parsed</div>
                        <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>Upload a CV to enable AI parsing, scoring and outreach.</div>
                    </div>
                </div>
            )}

            {/* Parsed summary */}
            {parsed && (
                <div className="g21" style={{ alignItems: 'start', marginBottom: 14 }}>
                    <div className="dcard">
                        <div className="dcard-head"><span className="dcard-title">✦ AI parsed profile</span></div>
                        <div style={{ padding: 16 }}>
                            {/* Skills */}
                            {skills.length > 0 && (
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>Key skills</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {skills.map((s, i) => (
                                            <span key={i} style={{ background: 'var(--sea-pale)', border: '1px solid var(--sea-soft)', borderRadius: 'var(--rxs)', padding: '3px 8px', fontSize: 11, color: 'var(--sea)' }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Work history */}
                            {parsed.work_history?.length > 0 && (
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>Work history</div>
                                    {parsed.work_history.map((w, i) => (
                                        <div key={i} style={{ marginBottom: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{w.title} @ {w.company}</div>
                                            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{w.dates}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Education */}
                            {parsed.education?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>Education</div>
                                    {parsed.education.map((e, i) => (
                                        <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>{e.degree} — {e.institution} {e.year && `(${e.year})`}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div>
                        <div className="dcard" style={{ marginBottom: 14 }}>
                            <div className="dcard-head"><span className="dcard-title">Parsed data</span></div>
                            <div style={{ padding: 14 }}>
                                {[
                                    ['Seniority', parsed.seniority_level?.replace('_', ' ')],
                                    ['Experience', candidate.years_experience ? `${candidate.years_experience} yrs` : null],
                                    ['Skills', `${skills.length} identified`],
                                ].filter(([,v]) => v).map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12 }}>
                                        <span style={{ color: 'var(--ink4)', width: 80 }}>{k}</span>
                                        <span style={{ fontWeight: 500 }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Outreach generator */}
            <div className="dcard">
                <div className="dcard-head">
                    <span className="dcard-title">✦ Draft outreach email</span>
                </div>
                <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 12 }}>
                        Generate a personalised cold outreach email for a specific role. Requires a mandate ID.
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <input className="form-input" style={{ flex: 1 }} placeholder="Mandate ID (UUID)" value={mandateId} onChange={e => setMandateId(e.target.value)} />
                        <button className="btn btn-secondary" onClick={generateOutreach} disabled={loadingOutreach || !mandateId}>
                            {loadingOutreach ? 'Generating…' : '✦ Generate'}
                        </button>
                    </div>
                    {outreach && (
                        <div style={{ background: 'var(--mist3)', border: '1px solid var(--wire)', borderRadius: 'var(--r)', padding: 14 }}>
                            <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginBottom: 4 }}>SUBJECT</div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{outreach.subject}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginBottom: 4 }}>BODY</div>
                            <pre style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{outreach.body}</pre>
                            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => { navigator.clipboard.writeText(`Subject: ${outreach.subject}\n\n${outreach.body}`) }}>Copy</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CandidateShow({ candidate }) {
    const [tab, setTab] = useState('Profile')

    const editForm = useForm({
        first_name:      candidate.first_name,
        last_name:       candidate.last_name,
        email:           candidate.email ?? '',
        phone:           candidate.phone ?? '',
        linkedin_url:    candidate.linkedin_url ?? '',
        current_role:    candidate.current_role ?? '',
        current_company: candidate.current_company ?? '',
        current_salary:  candidate.current_salary ?? '',
        expected_salary: candidate.expected_salary ?? '',
        salary_currency: candidate.salary_currency ?? 'SGD',
        nationality:     candidate.nationality ?? '',
        location:        candidate.location ?? '',
        recruiter_notes: candidate.recruiter_notes ?? '',
    })

    const cvForm = useForm({ cv: null, mandate_id: '' })

    return (
        <RecruiterLayout title={`${candidate.first_name} ${candidate.last_name}`}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {initials(`${candidate.first_name} ${candidate.last_name}`)}
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                        {candidate.first_name} {candidate.last_name}
                    </h1>
                    <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 4 }}>
                        {candidate.current_role && <span>{candidate.current_role}</span>}
                        {candidate.current_company && <span> @ {candidate.current_company}</span>}
                        {candidate.location && <span> · {candidate.location}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {candidate.cv_file_path && <span className="badge badge-jade" style={{ fontSize: 10 }}>✓ CV uploaded</span>}
                        {candidate.cv_parsed && <span className="badge badge-sea" style={{ fontSize: 10 }}>AI parsed</span>}
                        <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>
                            {candidate.submissions?.length ?? 0} submission{(candidate.submissions?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--wire)' }}>
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12,
                        borderBottom: tab === t ? '2px solid var(--sea2)' : '2px solid transparent',
                        color: tab === t ? 'var(--sea2)' : 'var(--ink4)',
                        fontWeight: tab === t ? 600 : 400,
                    }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Profile tab */}
            {tab === 'Profile' && (
                <form onSubmit={e => { e.preventDefault(); editForm.put(route('recruiter.candidates.update', candidate.id)) }}>
                    <div className="dcard">
                        <div className="dcard-head"><span className="dcard-title">Profile</span></div>
                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">First name *</label>
                                <input className="form-input" value={editForm.data.first_name} onChange={e => editForm.setData('first_name', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last name *</label>
                                <input className="form-input" value={editForm.data.last_name} onChange={e => editForm.setData('last_name', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={editForm.data.email} onChange={e => editForm.setData('email', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={editForm.data.phone} onChange={e => editForm.setData('phone', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">LinkedIn URL</label>
                                <input className="form-input" type="url" value={editForm.data.linkedin_url} onChange={e => editForm.setData('linkedin_url', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input className="form-input" value={editForm.data.location} onChange={e => editForm.setData('location', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nationality</label>
                                <input className="form-input" value={editForm.data.nationality} onChange={e => editForm.setData('nationality', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Current role</label>
                                <input className="form-input" value={editForm.data.current_role} onChange={e => editForm.setData('current_role', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current company</label>
                                <input className="form-input" value={editForm.data.current_company} onChange={e => editForm.setData('current_company', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current salary ({editForm.data.salary_currency})</label>
                                <input className="form-input" type="number" min="0" value={editForm.data.current_salary} onChange={e => editForm.setData('current_salary', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Expected salary ({editForm.data.salary_currency})</label>
                                <input className="form-input" type="number" min="0" value={editForm.data.expected_salary} onChange={e => editForm.setData('expected_salary', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Currency</label>
                                <select className="form-input" value={editForm.data.salary_currency} onChange={e => editForm.setData('salary_currency', e.target.value)}>
                                    <option value="SGD">SGD</option><option value="USD">USD</option><option value="MYR">MYR</option>
                                    <option value="IDR">IDR</option><option value="PHP">PHP</option><option value="THB">THB</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ padding: '0 16px 16px' }}>
                            <button type="submit" className="btn btn-primary" disabled={editForm.processing}>
                                {editForm.processing ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* CV tab */}
            {tab === 'CV' && (
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">CV</span></div>
                    <div style={{ padding: 20 }}>
                        {candidate.cv_file_path ? (
                            <div style={{ marginBottom: 16, padding: 12, background: 'var(--mist3)', borderRadius: 'var(--r)', border: '1px solid var(--wire)' }}>
                                <div style={{ fontSize: 12, fontWeight: 500 }}>📎 {candidate.cv_file_name ?? 'CV'}</div>
                                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4 }}>
                                    {candidate.cv_parsed ? '✓ AI parsed' : 'Not yet parsed'}
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 16 }}>No CV uploaded yet.</p>
                        )}
                        <form onSubmit={e => {
                            e.preventDefault()
                            cvForm.post(route('recruiter.candidates.upload-cv', candidate.id), {
                                forceFormData: true,
                                onSuccess: () => cvForm.reset()
                            })
                        }}>
                            <div className="form-group">
                                <label className="form-label">{candidate.cv_file_path ? 'Replace CV' : 'Upload CV'} (PDF, DOC, max 10MB)</label>
                                <input type="file" className="form-input" accept=".pdf,.doc,.docx"
                                    onChange={e => cvForm.setData('cv', e.target.files[0])} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={cvForm.processing || !cvForm.data.cv}>
                                {cvForm.processing ? 'Uploading…' : 'Upload CV'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Insights tab */}
            {tab === 'AI Insights' && (
                <AiInsightsPanel candidate={candidate} />
            )}

            {/* Submissions tab */}
            {tab === 'Submissions' && (
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Submissions ({candidate.submissions?.length ?? 0})</span></div>
                    {!candidate.submissions?.length
                        ? <p style={{ padding: 16, fontSize: 12, color: 'var(--ink4)' }}>No submissions yet.</p>
                        : candidate.submissions.map(s => (
                            <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{s.mandate?.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>
                                        {s.mandate?.client?.company_name} · {fmtDate(s.submitted_at)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ padding: '2px 8px', borderRadius: 'var(--rxs)', background: STAGE_COLORS[s.admin_review_status] ?? 'var(--mist4)', color: '#fff', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                                        {s.admin_review_status}
                                    </div>
                                    {s.ai_score != null && (
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink4)' }}>AI:{s.ai_score}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}

            {/* Notes tab */}
            {tab === 'Notes' && (
                <form onSubmit={e => { e.preventDefault(); editForm.put(route('recruiter.candidates.update', candidate.id)) }}>
                    <div className="dcard">
                        <div className="dcard-head"><span className="dcard-title">Recruiter notes</span></div>
                        <div style={{ padding: 16 }}>
                            <textarea className="form-input" rows={8} placeholder="Internal notes about this candidate…"
                                value={editForm.data.recruiter_notes} onChange={e => editForm.setData('recruiter_notes', e.target.value)} />
                            <div style={{ marginTop: 10 }}>
                                <button type="submit" className="btn btn-primary" disabled={editForm.processing}>
                                    {editForm.processing ? 'Saving…' : 'Save notes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </RecruiterLayout>
    )
}
