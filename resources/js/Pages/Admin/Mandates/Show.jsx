import { useState } from 'react'
import AdminLayout from '@/Layouts/AdminLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { fmtDate, fmtCurrency } from '@/lib/utils'
import PipelineBoard from '@/Components/PipelineBoard'

const STATUS_BADGE = {
    draft: 'badge badge-amber', active: 'badge badge-jade', paused: 'badge badge-sea',
    closed: 'badge badge-ruby', filled: 'badge badge-jade', dropped: 'badge badge-ruby',
}

export default function MandateShow({ mandate, clients, compensationTypes, recruiters }) {
    const [tab, setTab] = useState('details')
    const { data, setData, put, processing, errors } = useForm({
        client_id:            mandate.client_id,
        compensation_type_id: mandate.compensation_type_id ?? '',
        title:                mandate.title,
        description:          mandate.description ?? '',
        location:             mandate.location ?? '',
        seniority:            mandate.seniority ?? '',
        industry:             mandate.industry ?? '',
        contract_type:        mandate.contract_type ?? 'perm',
        salary_min:           mandate.salary_min ?? '',
        salary_max:           mandate.salary_max ?? '',
        salary_currency:      mandate.salary_currency ?? 'SGD',
        reward_pct:           mandate.reward_pct ?? '',
        is_fast_track:        mandate.is_fast_track ?? false,
        is_exclusive:         mandate.is_exclusive ?? false,
        timer_a_days:         mandate.timer_a_days ?? 5,
        timer_b_active:       mandate.timer_b_active ?? false,
        timer_b_days:         mandate.timer_b_days ?? 5,
        timer_b_penalty_d6:   mandate.timer_b_penalty_d6 ?? 10,
        timer_b_penalty_d7:   mandate.timer_b_penalty_d7 ?? 20,
        timer_b_penalty_d8plus: mandate.timer_b_penalty_d8plus ?? 30,
        timer_c_active:       mandate.timer_c_active ?? false,
        timer_c_sla_days:     mandate.timer_c_sla_days ?? 5,
    })

    const { data: reassignData, setData: setReassign, post: postReassign, processing: reassignProcessing } = useForm({ recruiter_id: '' })

    return (
        <AdminLayout title={mandate.title}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <Link href={route('admin.mandates.index')} style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>← Back to mandates</Link>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginTop: 6 }}>{mandate.title}</h1>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                        <span className={STATUS_BADGE[mandate.status] ?? 'badge badge-sea'}>{mandate.status}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{mandate.client?.company_name}</span>
                        {mandate.is_fast_track && <span className="cbadge cb-jade">Fast-track</span>}
                        {mandate.is_exclusive && <span className="cbadge cb-gold">Exclusive</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {mandate.status === 'draft' && (
                        <button className="btn btn-success" onClick={() => router.post(route('admin.mandates.publish', mandate.id))}>Publish</button>
                    )}
                    {mandate.status === 'active' && (
                        <button className="btn btn-secondary" onClick={() => router.post(route('admin.mandates.pause', mandate.id))}>Pause</button>
                    )}
                    {['active','paused','draft'].includes(mandate.status) && (
                        <button className="btn btn-danger" onClick={() => {
                            if (confirm('Close this mandate?')) router.post(route('admin.mandates.close', mandate.id))
                        }}>Close</button>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--wire)', marginBottom: 18 }}>
                {[['details', 'Details'], ['pipeline', `Pipeline (${mandate.submissions?.length ?? 0})`]].map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        style={{
                            padding: '8px 16px', fontSize: 13, fontWeight: tab === id ? 600 : 400,
                            color: tab === id ? 'var(--sea)' : 'var(--ink4)',
                            background: 'none', border: 'none', borderBottom: tab === id ? '2px solid var(--sea)' : '2px solid transparent',
                            cursor: 'pointer', marginBottom: -1, transition: 'all .15s',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Pipeline tab */}
            {tab === 'pipeline' && (
                <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
                    <PipelineBoard submissions={mandate.submissions ?? []} />
                </div>
            )}

            {/* Details tab */}
            {tab === 'details' && (
            <div className="g21" style={{ alignItems: 'start' }}>
                {/* Edit form */}
                <form onSubmit={e => { e.preventDefault(); put(route('admin.mandates.update', mandate.id)) }}>
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div className="dcard-head"><span className="dcard-title">Mandate details</span></div>
                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Client</label>
                                <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                </select>
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
                                <input className="form-input" value={data.seniority} onChange={e => setData('seniority', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Industry</label>
                                <input className="form-input" value={data.industry} onChange={e => setData('industry', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reward %</label>
                                <input className="form-input" type="number" step="0.5" value={data.reward_pct} onChange={e => setData('reward_pct', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows={4} value={data.description} onChange={e => setData('description', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                    <input type="checkbox" checked={data.is_fast_track} onChange={e => setData('is_fast_track', e.target.checked)} />
                                    Fast-track
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                    <input type="checkbox" checked={data.is_exclusive} onChange={e => setData('is_exclusive', e.target.checked)} />
                                    Exclusive
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                    <input type="checkbox" checked={data.timer_b_active} onChange={e => setData('timer_b_active', e.target.checked)} />
                                    Timer B (penalty)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                    <input type="checkbox" checked={data.timer_c_active} onChange={e => setData('timer_c_active', e.target.checked)} />
                                    Timer C (client SLA)
                                </label>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Timer A (days)</label>
                                <input className="form-input" type="number" min="1" max="30" value={data.timer_a_days} onChange={e => setData('timer_a_days', e.target.value)} />
                            </div>
                            {data.timer_b_active && <>
                                <div className="form-group">
                                    <label className="form-label">Timer B days</label>
                                    <input className="form-input" type="number" min="1" value={data.timer_b_days} onChange={e => setData('timer_b_days', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Penalty D6 (%)</label>
                                    <input className="form-input" type="number" min="0" max="100" value={data.timer_b_penalty_d6} onChange={e => setData('timer_b_penalty_d6', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Penalty D7 (%)</label>
                                    <input className="form-input" type="number" min="0" max="100" value={data.timer_b_penalty_d7} onChange={e => setData('timer_b_penalty_d7', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Penalty D8+ (%)</label>
                                    <input className="form-input" type="number" min="0" max="100" value={data.timer_b_penalty_d8plus} onChange={e => setData('timer_b_penalty_d8plus', e.target.value)} />
                                </div>
                            </>}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={processing}>
                        {processing ? 'Saving…' : 'Save changes'}
                    </button>
                </form>

                {/* Right col — assignment + submissions */}
                <div>
                    {/* Current assignment */}
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div className="dcard-head"><span className="dcard-title">Assignment</span></div>
                        <div style={{ padding: 16 }}>
                            {mandate.active_claim?.recruiter ? (
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{mandate.active_claim.recruiter.user?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>Since {fmtDate(mandate.active_claim.assigned_at)}</div>
                                </div>
                            ) : (
                                <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 12 }}>No recruiter assigned.</p>
                            )}

                            {recruiters.length > 0 && (
                                <form onSubmit={e => { e.preventDefault(); postReassign(route('admin.mandates.reassign', mandate.id)) }} style={{ marginTop: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Manually assign recruiter</label>
                                        <select className="form-input" value={reassignData.recruiter_id} onChange={e => setReassign('recruiter_id', e.target.value)}>
                                            <option value="">Select…</option>
                                            {recruiters.map(r => (
                                                <option key={r.id} value={r.id}>{r.user?.name} ({r.active_mandates_count}/2)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={reassignProcessing || !reassignData.recruiter_id}>
                                        Assign
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Submissions summary */}
                    <div className="dcard">
                        <div className="dcard-head"><span className="dcard-title">CDD submissions ({mandate.submissions?.length ?? 0})</span></div>
                        {mandate.submissions?.length === 0
                            ? <p style={{ padding: 14, fontSize: 12, color: 'var(--ink4)' }}>No submissions yet.</p>
                            : mandate.submissions?.map(s => (
                                <div key={s.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{s.candidate?.first_name} {s.candidate?.last_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>
                                        <span className={`badge badge-${s.admin_review_status === 'approved' ? 'jade' : s.admin_review_status === 'rejected' ? 'ruby' : 'amber'}`} style={{ fontSize: 9 }}>
                                            {s.admin_review_status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
            )} {/* end details tab */}
        </AdminLayout>
    )
}
