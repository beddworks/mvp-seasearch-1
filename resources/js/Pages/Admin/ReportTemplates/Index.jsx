import AdminLayout from '@/Layouts/AdminLayout'
import { useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { fmtDate } from '@/lib/utils'

const TYPE_BADGE = {
    unclaimed_role: 'badge-amber',
    role_dropped:   'badge-ruby',
    role_update:    'badge-sea',
    general:        'badge-violet',
}

export default function ReportTemplatesIndex({ templates, clients, mandates }) {
    const [showNew, setShowNew] = useState(false)
    const [editId, setEditId] = useState(null)
    const [sendId, setSendId] = useState(null)

    const newForm = useForm({ name: '', type: 'general', subject: '', body: '' })
    const editForm = useForm({ name: '', subject: '', body: '' })
    const sendForm = useForm({ client_id: '', mandate_id: '', custom_message: '' })

    function startEdit(t) {
        setEditId(t.id)
        editForm.setData({ name: t.name, subject: t.subject, body: t.body })
    }

    return (
        <AdminLayout title="Report templates">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Report templates</h1>
                <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>{showNew ? 'Cancel' : '+ New template'}</button>
            </div>

            {showNew && (
                <div className="dcard" style={{ marginBottom: 20 }}>
                    <div className="dcard-head"><span className="dcard-title">New template</span></div>
                    <form onSubmit={e => { e.preventDefault(); newForm.post(route('admin.report-templates.store'), { onSuccess: () => { setShowNew(false); newForm.reset() } }) }} style={{ padding: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={newForm.data.name} onChange={e => newForm.setData('name', e.target.value)} /></div>
                            <div className="form-group"><label className="form-label">Type</label>
                                <select className="form-input" value={newForm.data.type} onChange={e => newForm.setData('type', e.target.value)}>
                                    <option value="general">General</option>
                                    <option value="unclaimed_role">Unclaimed role</option>
                                    <option value="role_dropped">Role dropped</option>
                                    <option value="role_update">Role update</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={newForm.data.subject} onChange={e => newForm.setData('subject', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Body (supports {'{'}role_title{'}'}, {'{'}client_name{'}'}, etc.)</label><textarea className="form-input" rows={5} value={newForm.data.body} onChange={e => newForm.setData('body', e.target.value)} /></div>
                        <button type="submit" className="btn btn-primary" disabled={newForm.processing}>Create template</button>
                    </form>
                </div>
            )}

            {/* Send modal */}
            {sendId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--mist)', border: '1px solid var(--wire)', borderRadius: 'var(--r)', padding: 24, width: 480 }}>
                        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Send report</h3>
                        <form onSubmit={e => { e.preventDefault(); sendForm.post(route('admin.report-templates.send', sendId), { onSuccess: () => setSendId(null) }) }}>
                            <div className="form-group"><label className="form-label">Client *</label>
                                <select className="form-input" value={sendForm.data.client_id} onChange={e => sendForm.setData('client_id', e.target.value)}>
                                    <option value="">Select client…</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} — {c.contact_name}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Mandate (optional)</label>
                                <select className="form-input" value={sendForm.data.mandate_id} onChange={e => sendForm.setData('mandate_id', e.target.value)}>
                                    <option value="">No mandate</option>
                                    {mandates.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Custom message</label><textarea className="form-input" rows={3} value={sendForm.data.custom_message} onChange={e => sendForm.setData('custom_message', e.target.value)} /></div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" className="btn btn-primary" disabled={sendForm.processing}>Send</button>
                                <button type="button" className="btn btn-ghost" onClick={() => setSendId(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {templates.map(t => (
                <div key={t.id} className="dcard" style={{ marginBottom: 12 }}>
                    {editId === t.id ? (
                        <form onSubmit={e => { e.preventDefault(); editForm.put(route('admin.report-templates.update', t.id), { onSuccess: () => setEditId(null) }) }}>
                            <div className="dcard-head">
                                <span className="dcard-title">
                                    <span className={`badge ${TYPE_BADGE[t.type] ?? 'badge-sea'}`}>{t.type}</span>
                                    <input className="form-input" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} style={{ marginLeft: 8, width: 200 }} />
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button type="submit" className="btn btn-success btn-sm" disabled={editForm.processing}>Save</button>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                                </div>
                            </div>
                            <div style={{ padding: 16 }}>
                                <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={editForm.data.subject} onChange={e => editForm.setData('subject', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">Body</label><textarea className="form-input" rows={5} value={editForm.data.body} onChange={e => editForm.setData('body', e.target.value)} /></div>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="dcard-head">
                                <span className="dcard-title">
                                    <span className={`badge ${TYPE_BADGE[t.type] ?? 'badge-sea'}`}>{t.type}</span>
                                    <span style={{ marginLeft: 8 }}>{t.name}</span>
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-primary btn-sm" onClick={() => setSendId(t.id)}>Send</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete template?')) router.delete(route('admin.report-templates.destroy', t.id)) }}>×</button>
                                </div>
                            </div>
                            <div style={{ padding: '10px 16px' }}>
                                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{t.subject}</div>
                                <div style={{ fontSize: 11, color: 'var(--ink4)', whiteSpace: 'pre-line', maxHeight: 60, overflow: 'hidden' }}>{t.body}</div>
                            </div>
                        </>
                    )}
                </div>
            ))}
            {!templates.length && <div className="dcard" style={{ padding: 24, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>No templates yet.</div>}
        </AdminLayout>
    )
}
