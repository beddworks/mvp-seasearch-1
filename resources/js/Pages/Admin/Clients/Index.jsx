import AdminLayout from '@/Layouts/AdminLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { useState } from 'react'

export default function ClientsIndex({ clients }) {
    const [showForm, setShowForm] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        company_name:  '',
        industry:      '',
        contact_name:  '',
        contact_email: '',
        contact_title: '',
        accent_color:  '#1A6DB5',
    })

    function submit(e) {
        e.preventDefault()
        post(route('admin.clients.store'), { onSuccess: () => { setShowForm(false); reset() } })
    }

    return (
        <AdminLayout title="Clients">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Clients</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                    {showForm ? 'Cancel' : '+ New client'}
                </button>
            </div>

            {showForm && (
                <div className="dcard" style={{ marginBottom: 20 }}>
                    <div className="dcard-head"><span className="dcard-title">New client</span></div>
                    <form onSubmit={submit} style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Company name *</label>
                            <input className="form-input" value={data.company_name} onChange={e => setData('company_name', e.target.value)} />
                            {errors.company_name && <p className="form-error">{errors.company_name}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Industry</label>
                            <input className="form-input" value={data.industry} onChange={e => setData('industry', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact name *</label>
                            <input className="form-input" value={data.contact_name} onChange={e => setData('contact_name', e.target.value)} />
                            {errors.contact_name && <p className="form-error">{errors.contact_name}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact email *</label>
                            <input className="form-input" type="email" value={data.contact_email} onChange={e => setData('contact_email', e.target.value)} />
                            {errors.contact_email && <p className="form-error">{errors.contact_email}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact title</label>
                            <input className="form-input" placeholder="e.g. Head of Talent" value={data.contact_title} onChange={e => setData('contact_title', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Portal accent color</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="color" value={data.accent_color} onChange={e => setData('accent_color', e.target.value)} style={{ width: 40, height: 32, cursor: 'pointer', border: 'none' }} />
                                <input className="form-input" value={data.accent_color} onChange={e => setData('accent_color', e.target.value)} style={{ flex: 1 }} />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {processing ? 'Creating…' : 'Create client'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); reset() }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Company</th><th>Industry</th><th>Contact</th><th>Mandates</th><th>Accent</th><th></th></tr>
                    </thead>
                    <tbody>
                        {clients.data?.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 500 }}>{c.company_name}</td>
                                <td style={{ color: 'var(--ink4)' }}>{c.industry ?? '—'}</td>
                                <td>
                                    <div style={{ fontSize: 12 }}>{c.contact_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{c.contact_email}</div>
                                </td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{c.mandates_count}</td>
                                <td>
                                    {c.accent_color && (
                                        <div style={{ width: 20, height: 20, borderRadius: 4, background: c.accent_color, border: '1px solid var(--wire)' }} />
                                    )}
                                </td>
                                <td>
                                    <Link href={route('admin.clients.show', c.id)} className="btn btn-ghost btn-sm">View</Link>
                                </td>
                            </tr>
                        ))}
                        {!clients.data?.length && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink4)', padding: 24 }}>No clients yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}
