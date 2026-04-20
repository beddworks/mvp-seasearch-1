import AdminLayout from '@/Layouts/AdminLayout'
import { Link, router } from '@inertiajs/react'
import { fmtCurrency, fmtDate, fmtRelative } from '@/lib/utils'

export default function AdminDashboard({ stats, pendingClaims = [], pendingSubmissions = [], unclaimedRoles = [], recentActivity = [] }) {
    const statCards = [
        { label: 'Active mandates',    value: stats.active_mandates,      accent: 'var(--sea3)' },
        { label: 'Pending claims',     value: stats.pending_claims,       accent: 'var(--amber2)' },
        { label: 'Pending CDD review', value: stats.pending_cdd_reviews,  accent: 'var(--violet2)' },
        { label: 'Unclaimed 24h+',     value: stats.unclaimed_24h,        accent: 'var(--ruby2)' },
        { label: 'Total recruiters',   value: stats.total_recruiters,     accent: 'var(--jade3)' },
        { label: 'Active recruiters',  value: stats.active_recruiters,    accent: 'var(--jade2)' },
        { label: 'Placements MTD',     value: stats.placements_mtd,       accent: 'var(--sea2)' },
        { label: 'Revenue MTD',        value: fmtCurrency(stats.revenue_mtd ?? 0, 'SGD'), accent: 'var(--gold2)' },
        { label: 'Placements YTD',     value: stats.placements_ytd,       accent: 'var(--jade2)' },
        { label: 'Revenue YTD',        value: fmtCurrency(stats.revenue_ytd ?? 0, 'SGD'), accent: 'var(--jade3)' },
    ]

    return (
        <AdminLayout title="Dashboard">
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>
                Platform overview
            </h1>

            {/* Stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 24 }}>
                {statCards.map(c => (
                    <div className="sm" key={c.label}>
                        <div className="sm-bar" style={{ background: c.accent }} />
                        <div className="sm-num">{c.value}</div>
                        <div className="sm-lbl">{c.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Pending Claims */}
                <div className="dcard">
                    <div className="dcard-head">
                        <span className="dcard-title">✋ Pending claims</span>
                        <Link href={route('admin.claims.index')} className="dcard-ghost-btn">View all</Link>
                    </div>
                    {pendingClaims.length === 0
                        ? <p style={{ padding: 16, fontSize: 12, color: 'var(--ink4)' }}>No pending claims.</p>
                        : pendingClaims.map(c => (
                            <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{c.mandate?.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{c.recruiter?.user?.name} · {c.mandate?.client?.company_name}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-success btn-sm" onClick={() => router.post(route('admin.claims.approve', c.id), {})}>Approve</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => {
                                        const note = prompt('Rejection reason:')
                                        if (note) router.post(route('admin.claims.reject', c.id), { note })
                                    }}>Reject</button>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* Pending CDD */}
                <div className="dcard">
                    <div className="dcard-head">
                        <span className="dcard-title">📄 Pending CDD review</span>
                        <Link href={route('admin.submissions.index')} className="dcard-ghost-btn">View all</Link>
                    </div>
                    {pendingSubmissions.length === 0
                        ? <p style={{ padding: 16, fontSize: 12, color: 'var(--ink4)' }}>No pending CDD submissions.</p>
                        : pendingSubmissions.map(s => (
                            <div key={s.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{s.candidate?.first_name} {s.candidate?.last_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{s.mandate?.title} · {s.recruiter?.user?.name}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-success btn-sm" onClick={() => router.post(route('admin.submissions.approve', s.id), {})}>Approve</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => {
                                        const note = prompt('Rejection reason:')
                                        if (note) router.post(route('admin.submissions.reject', s.id), { note })
                                    }}>Reject</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Unclaimed roles */}
            {unclaimedRoles.length > 0 && (
                <div className="dcard" style={{ marginBottom: 16 }}>
                    <div className="dcard-head">
                        <span className="dcard-title" style={{ color: 'var(--ruby2)' }}>⚠ Unclaimed roles (24h+)</span>
                        <Link href={route('admin.mandates.index')} className="dcard-ghost-btn">Manage</Link>
                    </div>
                    <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead><tr><th>Role</th><th>Client</th><th>Posted</th><th></th></tr></thead>
                            <tbody>
                                {unclaimedRoles.map(m => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: 500 }}>{m.title}</td>
                                        <td>{m.client?.company_name}</td>
                                        <td>{fmtDate(m.original_post_date)}</td>
                                        <td><Link href={route('admin.mandates.show', m.id)} className="btn btn-ghost btn-sm">View</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent activity */}
            {recentActivity.length > 0 && (
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">Recent activity</span></div>
                    {recentActivity.map(a => (
                        <div key={a.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 12, color: 'var(--ink)' }}>{a.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', flexShrink: 0, marginLeft: 12 }}>{fmtRelative(a.created_at)}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent activity */}
            {recentActivity.length > 0 && (
                <div className="dcard" style={{ marginTop: 16 }}>
                    <div className="dcard-head"><span className="dcard-title">Recent activity</span></div>
                    {recentActivity.map(a => (
                        <div key={a.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 12, color: 'var(--ink)' }}>{a.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', flexShrink: 0, marginLeft: 12 }}>{fmtRelative(a.created_at)}</div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    )
}
