import AdminLayout from '@/Layouts/AdminLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { initials, fmtDate } from '@/lib/utils'

export default function RecruiterShow({ recruiter, activeMandates, recentPlacements, tiers, trustLevels, groups }) {
    const { data: tierData, setData: setTier, post: postTier, processing: tierProc } = useForm({ tier: recruiter.tier })
    const { data: trustData, setData: setTrust, post: postTrust, processing: trustProc } = useForm({ trust_level: recruiter.trust_level })
    const { data: groupData, setData: setGroup, post: postGroup, processing: groupProc } = useForm({
        recruiter_group: recruiter.recruiter_group ?? '',
        recruiter_group_secondary: recruiter.recruiter_group_secondary ?? '',
    })
    const { data: suspendData, setData: setSuspend, post: postSuspend, processing: suspendProc } = useForm({ reason: '' })

    const user = recruiter.user

    return (
        <AdminLayout title={user?.name}>
            <div style={{ marginBottom: 20 }}>
                <Link href={route('admin.recruiters.index')} style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>← Back to recruiters</Link>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--sea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                        {initials(user?.name)}
                    </div>
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>{user?.name}</h1>
                        <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 4 }}>{user?.email}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <span className={`badge badge-${recruiter.tier === 'elite' ? 'gold' : recruiter.tier === 'senior' ? 'violet' : 'sea'}`}>{recruiter.tier}</span>
                            <span className={`badge ${recruiter.trust_level === 'trusted' ? 'badge-jade' : 'badge-amber'}`}>{recruiter.trust_level}</span>
                            <span className={`badge ${user?.status === 'active' ? 'badge-jade' : 'badge-ruby'}`}>{user?.status}</span>
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        {user?.status !== 'active' && (
                            <button className="btn btn-success" onClick={() => router.post(route('admin.recruiters.approve', recruiter.id))}>
                                Approve
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {/* Tier */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Tier</span></div>
                    <form onSubmit={e => { e.preventDefault(); postTier(route('admin.recruiters.set-tier', recruiter.id)) }} style={{ padding: 14 }}>
                        <div className="form-group">
                            <select className="form-input" value={tierData.tier} onChange={e => setTier('tier', e.target.value)}>
                                {tiers.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={tierProc}>Update tier</button>
                    </form>
                </div>

                {/* Trust */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Trust level</span></div>
                    <form onSubmit={e => { e.preventDefault(); postTrust(route('admin.recruiters.set-trust', recruiter.id)) }} style={{ padding: 14 }}>
                        <div className="form-group">
                            <select className="form-input" value={trustData.trust_level} onChange={e => setTrust('trust_level', e.target.value)}>
                                {trustLevels.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={trustProc}>Update trust</button>
                    </form>
                </div>

                {/* Group */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Group</span></div>
                    <form onSubmit={e => { e.preventDefault(); postGroup(route('admin.recruiters.set-group', recruiter.id)) }} style={{ padding: 14 }}>
                        <div className="form-group">
                            <select className="form-input" value={groupData.recruiter_group} onChange={e => setGroup('recruiter_group', e.target.value)}>
                                <option value="">No group</option>
                                {groups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={groupProc}>Update group</button>
                    </form>
                </div>

                {/* Active mandates */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Active mandates ({activeMandates.length}/2)</span></div>
                    {activeMandates.length === 0
                        ? <p style={{ padding: 14, fontSize: 12, color: 'var(--ink4)' }}>No active mandates.</p>
                        : activeMandates.map(c => (
                            <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)' }}>
                                <div style={{ fontSize: 12, fontWeight: 500 }}>{c.mandate?.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{c.mandate?.client?.company_name} · since {fmtDate(c.assigned_at)}</div>
                            </div>
                        ))
                    }
                </div>

                {/* Suspend */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title" style={{ color: 'var(--ruby2)' }}>Suspend account</span></div>
                    <form onSubmit={e => { e.preventDefault(); if (confirm('Suspend this recruiter?')) postSuspend(route('admin.recruiters.suspend', recruiter.id)) }} style={{ padding: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Reason *</label>
                            <textarea className="form-input" rows={2} value={suspendData.reason} onChange={e => setSuspend('reason', e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-danger btn-sm" disabled={suspendProc || user?.status === 'suspended'}>
                            {user?.status === 'suspended' ? 'Already suspended' : 'Suspend'}
                        </button>
                    </form>
                </div>

                {/* Profile info */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Profile</span></div>
                    <div style={{ padding: 14 }}>
                        {[
                            ['Firm',      recruiter.current_firm],
                            ['Specialty', recruiter.specialty],
                            ['EA License',recruiter.ea_license_number],
                            ['LinkedIn',  recruiter.linkedin_url],
                        ].filter(([,v]) => v).map(([label, value]) => (
                            <div key={label} style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                                <div style={{ fontSize: 12, marginTop: 2 }}>{value}</div>
                            </div>
                        ))}
                        {!recruiter.profile_complete && <span className="badge badge-amber" style={{ fontSize: 9 }}>Profile incomplete</span>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
