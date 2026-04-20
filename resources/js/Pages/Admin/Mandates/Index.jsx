import AdminLayout from '@/Layouts/AdminLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { fmtDate } from '@/lib/utils'

const STATUS_BADGE = {
    draft:   'badge badge-amber',
    active:  'badge badge-jade',
    paused:  'badge badge-sea',
    closed:  'badge badge-ruby',
    filled:  'badge badge-jade',
    dropped: 'badge badge-ruby',
}

export default function MandatesIndex({ mandates, clients, compensationTypes, stats }) {
    const [showForm, setShowForm] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        client_id:            '',
        compensation_type_id: '',
        title:                '',
        description:          '',
        location:             '',
        seniority:            '',
        industry:             '',
        contract_type:        'perm',
        salary_min:           '',
        salary_max:           '',
        salary_currency:      'SGD',
        reward_pct:           '',
        is_fast_track:        false,
        is_exclusive:         false,
        timer_a_days:         5,
        timer_b_active:       false,
    })

    function submit(e) {
        e.preventDefault()
        post(route('admin.mandates.store'), {
            onSuccess: () => { setShowForm(false); reset() },
        })
    }

    return (
        <AdminLayout title="Mandates">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Mandates</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                    {showForm ? 'Cancel' : '+ New mandate'}
                </button>
            </div>

            {/* Stat row */}
            <div className="stat-row" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Active',  value: stats.active,  accent: 'var(--jade3)' },
                    { label: 'Draft',   value: stats.draft,   accent: 'var(--amber2)' },
                    { label: 'Filled',  value: stats.filled,  accent: 'var(--sea3)' },
                    { label: 'Dropped', value: stats.dropped, accent: 'var(--ruby2)' },
                ].map(c => (
                    <div className="sm" key={c.label}>
                        <div className="sm-bar" style={{ background: c.accent }} />
                        <div className="sm-num">{c.value}</div>
                        <div className="sm-lbl">{c.label}</div>
                    </div>
                ))}
            </div>

            {/* Create form */}
            {showForm && (
                <div className="dcard" style={{ marginBottom: 20 }}>
                    <div className="dcard-head"><span className="dcard-title">New mandate</span></div>
                    <form onSubmit={submit} style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Client *</label>
                            <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">Select client…</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                            </select>
                            {errors.client_id && <p className="form-error">{errors.client_id}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input className="form-input" value={data.title} onChange={e => setData('title', e.target.value)} />
                            {errors.title && <p className="form-error">{errors.title}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input className="form-input" value={data.location} onChange={e => setData('location', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Seniority</label>
                            <input className="form-input" placeholder="e.g. VP, Director, C-level" value={data.seniority} onChange={e => setData('seniority', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Industry</label>
                            <input className="form-input" value={data.industry} onChange={e => setData('industry', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contract type</label>
                            <select className="form-input" value={data.contract_type} onChange={e => setData('contract_type', e.target.value)}>
                                <option value="perm">Permanent</option>
                                <option value="contract">Contract</option>
                                <option value="interim">Interim</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reward % (of base salary)</label>
                            <input className="form-input" type="number" min="0" max="100" step="0.5" value={data.reward_pct} onChange={e => setData('reward_pct', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timer A (days to submit CDD)</label>
                            <input className="form-input" type="number" min="1" max="30" value={data.timer_a_days} onChange={e => setData('timer_a_days', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Description</label>
                            <textarea className="form-input" rows={3} value={data.description} onChange={e => setData('description', e.target.value)} />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={data.is_fast_track} onChange={e => setData('is_fast_track', e.target.checked)} />
                                Fast-track (bypasses admin CDD review)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={data.is_exclusive} onChange={e => setData('is_exclusive', e.target.checked)} />
                                Exclusive
                            </label>
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {processing ? 'Creating…' : 'Create mandate'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); reset() }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th><th>Client</th><th>Status</th><th>Recruiter</th><th>Posted</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {mandates.data?.map(m => (
                            <tr key={m.id}>
                                <td style={{ fontWeight: 500 }}>{m.title}</td>
                                <td>{m.client?.company_name}</td>
                                <td><span className={STATUS_BADGE[m.status] ?? 'badge badge-sea'}>{m.status}</span></td>
                                <td style={{ color: 'var(--ink4)' }}>{m.active_claim?.recruiter?.user?.name ?? '—'}</td>
                                <td style={{ color: 'var(--ink4)', fontFamily: 'var(--mono)', fontSize: 11 }}>{fmtDate(m.original_post_date)}</td>
                                <td>
                                    <Link href={route('admin.mandates.show', m.id)} className="btn btn-ghost btn-sm">View</Link>
                                </td>
                            </tr>
                        ))}
                        {!mandates.data?.length && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink4)', padding: 24 }}>No mandates yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {mandates.last_page > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                    {mandates.links?.map((l, i) => (
                        l.url && <button key={i} className={`btn btn-sm ${l.active ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => router.get(l.url)}
                            dangerouslySetInnerHTML={{ __html: l.label }} />
                    ))}
                </div>
            )}
        </AdminLayout>
    )
}
