import AdminLayout from '@/Layouts/AdminLayout'
import { router } from '@inertiajs/react'
import { fmtDate } from '@/lib/utils'

export default function ClaimsIndex({ claims, pendingCount }) {
    function approve(id) {
        const note = window.prompt('Optional note for recruiter:') ?? ''
        router.post(route('admin.claims.approve', id), { note })
    }

    function reject(id) {
        const note = window.prompt('Rejection reason (required):')
        if (note) router.post(route('admin.claims.reject', id), { note })
    }

    return (
        <AdminLayout title="Claim approvals">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
                    Claim approvals
                    {pendingCount > 0 && <span className="badge badge-amber" style={{ marginLeft: 10, fontSize: 11 }}>{pendingCount} pending</span>}
                </h1>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Role</th><th>Client</th><th>Recruiter</th><th>Tier</th><th>Requested</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {claims.data?.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 500 }}>{c.mandate?.title}</td>
                                <td style={{ color: 'var(--ink4)' }}>{c.mandate?.client?.company_name}</td>
                                <td>
                                    <div style={{ fontSize: 12 }}>{c.recruiter?.user?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                                        {c.recruiter?.active_mandates_count}/2 active
                                    </div>
                                </td>
                                <td><span className={`badge badge-${c.recruiter?.tier === 'elite' ? 'gold' : c.recruiter?.tier === 'senior' ? 'violet' : 'sea'}`}>{c.recruiter?.tier}</span></td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{fmtDate(c.created_at)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-success btn-sm" onClick={() => approve(c.id)}>✓ Approve</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => reject(c.id)}>✗ Reject</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!claims.data?.length && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink4)', padding: 24 }}>No pending claims.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}
