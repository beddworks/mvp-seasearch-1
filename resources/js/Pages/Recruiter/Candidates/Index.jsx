import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { fmtDate } from '@/lib/utils'

export default function CandidatesIndex({ candidates }) {
    const [showNew, setShowNew] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name:      '',
        last_name:       '',
        email:           '',
        phone:           '',
        linkedin_url:    '',
        current_role:    '',
        current_company: '',
        location:        '',
        nationality:     '',
        recruiter_notes: '',
    })

    function submit(e) {
        e.preventDefault()
        post(route('recruiter.candidates.store'), {
            onSuccess: () => { setShowNew(false); reset() }
        })
    }

    return (
        <RecruiterLayout title="Candidates">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
                    My candidates
                </h1>
                <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>
                    {showNew ? 'Cancel' : '+ Add candidate'}
                </button>
            </div>

            {showNew && (
                <div className="dcard" style={{ marginBottom: 20 }}>
                    <div className="dcard-head"><span className="dcard-title">New candidate</span></div>
                    <form onSubmit={submit} style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">First name *</label>
                            <input className="form-input" value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
                            {errors.first_name && <p className="form-error">{errors.first_name}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last name *</label>
                            <input className="form-input" value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                            {errors.last_name && <p className="form-error">{errors.last_name}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Current role</label>
                            <input className="form-input" value={data.current_role} onChange={e => setData('current_role', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Current company</label>
                            <input className="form-input" value={data.current_company} onChange={e => setData('current_company', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input className="form-input" value={data.location} onChange={e => setData('location', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nationality</label>
                            <input className="form-input" value={data.nationality} onChange={e => setData('nationality', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">LinkedIn URL</label>
                            <input className="form-input" type="url" value={data.linkedin_url} onChange={e => setData('linkedin_url', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Recruiter notes</label>
                            <textarea className="form-input" rows={2} value={data.recruiter_notes} onChange={e => setData('recruiter_notes', e.target.value)} />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {processing ? 'Adding…' : 'Add candidate'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => { setShowNew(false); reset() }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Candidate</th><th>Current role</th><th>Location</th><th>CV</th><th>Submissions</th><th></th></tr>
                    </thead>
                    <tbody>
                        {candidates.data?.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</div>
                                    {c.email && <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{c.email}</div>}
                                </td>
                                <td style={{ color: 'var(--ink4)', fontSize: 12 }}>{c.current_role ?? '—'}</td>
                                <td style={{ color: 'var(--ink4)', fontSize: 12 }}>{c.location ?? '—'}</td>
                                <td>
                                    {c.cv_file_path
                                        ? <span className="badge badge-jade" style={{ fontSize: 9 }}>✓ CV</span>
                                        : <span style={{ fontSize: 11, color: 'var(--ink4)' }}>No CV</span>
                                    }
                                </td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{c.submissions_count ?? 0}</td>
                                <td>
                                    <Link href={route('recruiter.candidates.show', c.id)} className="btn btn-ghost btn-sm">View</Link>
                                </td>
                            </tr>
                        ))}
                        {!candidates.data?.length && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink4)', padding: 32 }}>
                                No candidates yet. Add your first candidate to get started.
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </RecruiterLayout>
    )
}
