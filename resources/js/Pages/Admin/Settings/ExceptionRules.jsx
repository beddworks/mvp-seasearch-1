import AdminLayout from '@/Layouts/AdminLayout'
import { useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { fmtDate } from '@/lib/utils'

export default function ExceptionRules({ rules }) {
    const [showNew, setShowNew] = useState(false)
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', description: '', rule_type: 'recruiter_trust', trust_level: 'trusted', role_type: '',
    })

    return (
        <AdminLayout title="Exception rules">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Exception rules</h1>
                <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>{showNew ? 'Cancel' : '+ New rule'}</button>
            </div>

            <div className="dcard" style={{ marginBottom: 16, padding: 14, background: 'var(--amber-pale)' }}>
                <p style={{ fontSize: 12, color: 'var(--amber)' }}>
                    <strong>⚡ Exception rules</strong> bypass the admin CDD review step. When active, trusted recruiter submissions go directly to the client without admin approval. Enable with caution.
                </p>
            </div>

            {showNew && (
                <div className="dcard" style={{ marginBottom: 20 }}>
                    <div className="dcard-head"><span className="dcard-title">New rule</span></div>
                    <form onSubmit={e => { e.preventDefault(); post(route('admin.exception-rules.store'), { onSuccess: () => { setShowNew(false); reset() } }) }} style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />{errors.name && <p className="form-error">{errors.name}</p>}</div>
                        <div className="form-group"><label className="form-label">Rule type</label>
                            <select className="form-input" value={data.rule_type} onChange={e => setData('rule_type', e.target.value)}>
                                <option value="recruiter_trust">Recruiter trust level</option>
                                <option value="role_type">Role type</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Description</label><textarea className="form-input" rows={2} value={data.description} onChange={e => setData('description', e.target.value)} /></div>
                        <div style={{ gridColumn: '1/-1' }}><button type="submit" className="btn btn-primary" disabled={processing}>Create rule</button></div>
                    </form>
                </div>
            )}

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Status</th><th>Created</th><th></th></tr></thead>
                    <tbody>
                        {rules.map(r => (
                            <tr key={r.id}>
                                <td style={{ fontWeight: 500 }}>{r.name}</td>
                                <td><span className="cbadge cb-vio">{r.rule_type}</span></td>
                                <td style={{ fontSize: 11, color: 'var(--ink4)', maxWidth: 240 }}>{r.description}</td>
                                <td>
                                    <button
                                        className={`badge ${r.is_active ? 'badge-jade' : 'badge-amber'}`}
                                        onClick={() => router.post(route('admin.exception-rules.toggle', r.id))}
                                        style={{ cursor: 'pointer', border: 'none' }}
                                    >
                                        {r.is_active ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{fmtDate(r.created_at)}</td>
                                <td>
                                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete rule?')) router.delete(route('admin.exception-rules.destroy', r.id)) }}>×</button>
                                </td>
                            </tr>
                        ))}
                        {!rules.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink4)', padding: 24 }}>No exception rules.</td></tr>}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}
