import AdminLayout from '@/Layouts/AdminLayout'
import { Link, router } from '@inertiajs/react'
import { initials } from '@/lib/utils'

const TIER_BADGE = { junior: 'badge-sea', senior: 'badge-violet', elite: 'badge-gold' }

export default function RecruitersIndex({ recruiters, stats }) {
    return (
        <AdminLayout title="Recruiters">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Recruiters</h1>
            </div>

            <div className="stat-row" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total',   value: stats.total,   accent: 'var(--sea3)' },
                    { label: 'Active',  value: stats.active,  accent: 'var(--jade3)' },
                    { label: 'Pending', value: stats.pending, accent: 'var(--amber2)' },
                    { label: 'Available', value: `${stats.active} available`, accent: 'var(--mist4)' },
                ].map(c => (
                    <div className="sm" key={c.label}>
                        <div className="sm-bar" style={{ background: c.accent }} />
                        <div className="sm-num">{c.value}</div>
                        <div className="sm-lbl">{c.label}</div>
                    </div>
                ))}
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Recruiter</th><th>Tier</th><th>Trust</th><th>Active</th><th>Claims</th><th>Placements</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        {recruiters.data?.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                                            {initials(r.user?.name)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 500 }}>{r.user?.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{r.user?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className={`badge ${TIER_BADGE[r.tier] ?? 'badge-sea'}`}>{r.tier}</span></td>
                                <td>
                                    {r.trust_level === 'trusted'
                                        ? <span className="badge badge-jade">trusted</span>
                                        : <span style={{ fontSize: 11, color: 'var(--ink4)' }}>standard</span>
                                    }
                                </td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.active_mandates_count}/2</td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.claims_count}</td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.placements_count}</td>
                                <td>
                                    <span className={`badge ${r.user?.status === 'active' ? 'badge-jade' : r.user?.status === 'suspended' ? 'badge-ruby' : 'badge-amber'}`}>
                                        {r.user?.status}
                                    </span>
                                </td>
                                <td>
                                    <Link href={route('admin.recruiters.show', r.id)} className="btn btn-ghost btn-sm">Manage</Link>
                                </td>
                            </tr>
                        ))}
                        {!recruiters.data?.length && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink4)', padding: 24 }}>No recruiters yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}
