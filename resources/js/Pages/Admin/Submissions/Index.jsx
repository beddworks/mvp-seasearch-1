import AdminLayout from '@/Layouts/AdminLayout'
import { router } from '@inertiajs/react'
import { fmtDate } from '@/lib/utils'

export default function SubmissionsIndex({ submissions, pendingCount }) {
    function approve(id) {
        const note = window.prompt('Optional note:') ?? ''
        router.post(route('admin.submissions.approve', id), { note })
    }

    function reject(id) {
        const note = window.prompt('Rejection reason (required):')
        if (note) router.post(route('admin.submissions.reject', id), { note })
    }

    return (
        <AdminLayout title="CDD review queue">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
                    CDD review queue
                    {pendingCount > 0 && <span className="badge badge-amber" style={{ marginLeft: 10, fontSize: 11 }}>{pendingCount} pending</span>}
                </h1>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Candidate</th><th>Role</th><th>Client</th><th>Recruiter</th><th>AI Score</th><th>Submitted</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {submissions.data?.map(s => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: 500 }}>
                                    {s.candidate?.first_name} {s.candidate?.last_name}
                                    {s.admin_rejection_count > 0 && (
                                        <span className="badge badge-amber" style={{ marginLeft: 6, fontSize: 9 }}>
                                            {s.admin_rejection_count} prior rejection{s.admin_rejection_count > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </td>
                                <td style={{ color: 'var(--ink4)' }}>{s.mandate?.title}</td>
                                <td style={{ color: 'var(--ink4)' }}>{s.mandate?.client?.company_name}</td>
                                <td style={{ fontSize: 11 }}>{s.recruiter?.user?.name}</td>
                                <td>
                                    {s.ai_score != null
                                        ? <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: s.ai_score >= 70 ? 'var(--jade2)' : s.ai_score >= 40 ? 'var(--amber2)' : 'var(--ruby2)', fontWeight: 600 }}>{s.ai_score}</span>
                                        : <span style={{ color: 'var(--ink4)', fontSize: 11 }}>—</span>
                                    }
                                </td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{fmtDate(s.submitted_at)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-success btn-sm" onClick={() => approve(s.id)}>✓ Approve</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => reject(s.id)}>✗ Reject</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!submissions.data?.length && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink4)', padding: 24 }}>No pending CDD submissions.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}
