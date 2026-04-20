import AdminLayout from '@/Layouts/AdminLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { fmtDate } from '@/lib/utils'

export default function ClientShow({ client, mandates }) {
    const { data, setData, put, processing, errors } = useForm({
        company_name:  client.company_name,
        industry:      client.industry ?? '',
        contact_name:  client.contact_name,
        contact_email: client.contact_email,
        contact_title: client.contact_title ?? '',
        accent_color:  client.accent_color ?? '#1A6DB5',
    })

    return (
        <AdminLayout title={client.company_name}>
            <div style={{ marginBottom: 20 }}>
                <Link href={route('admin.clients.index')} style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>← Back to clients</Link>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginTop: 6 }}>{client.company_name}</h1>
            </div>

            <div className="g21" style={{ alignItems: 'start' }}>
                {/* Edit form */}
                <form onSubmit={e => { e.preventDefault(); put(route('admin.clients.update', client.id)) }}>
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div className="dcard-head"><span className="dcard-title">Client details</span></div>
                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                                <input className="form-input" value={data.contact_title} onChange={e => setData('contact_title', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Portal accent color</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="color" value={data.accent_color} onChange={e => setData('accent_color', e.target.value)} style={{ width: 40, height: 32, cursor: 'pointer', border: 'none' }} />
                                    <input className="form-input" value={data.accent_color} onChange={e => setData('accent_color', e.target.value)} style={{ flex: 1 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn btn-primary" disabled={processing}>
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => router.post(route('admin.clients.send-gsheet', client.id))}>
                            Send GSheet
                        </button>
                    </div>
                </form>

                {/* Mandates */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Mandates ({mandates.total})</span></div>
                    {mandates.data?.length === 0
                        ? <p style={{ padding: 14, fontSize: 12, color: 'var(--ink4)' }}>No mandates yet.</p>
                        : mandates.data?.map(m => (
                            <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{m.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>
                                        <span className={`badge badge-${m.status === 'active' ? 'jade' : m.status === 'draft' ? 'amber' : 'ruby'}`} style={{ fontSize: 9 }}>{m.status}</span>
                                        {m.active_claim?.recruiter?.user?.name && <span style={{ marginLeft: 6 }}>{m.active_claim.recruiter.user.name}</span>}
                                    </div>
                                </div>
                                <Link href={route('admin.mandates.show', m.id)} className="btn btn-ghost btn-sm">View</Link>
                            </div>
                        ))
                    }
                </div>
            </div>
        </AdminLayout>
    )
}
