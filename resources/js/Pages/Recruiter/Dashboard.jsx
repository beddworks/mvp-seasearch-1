import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { Link } from '@inertiajs/react'
import { fmtCurrency, fmt } from '@/lib/utils'

export default function RecruiterDashboard({ recruiter, stats, activeMandates = [], recentCandidates = [] }) {
    return (
        <RecruiterLayout title="Dashboard">
            {/* Hero band */}
            <div style={{ background: 'var(--ink)', borderRadius: 'var(--r)', padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Welcome back</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                        {recruiter?.display_name ?? recruiter?.user?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mist4)', marginTop: 4 }}>
                        {recruiter?.tier} · {recruiter?.trust_level}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--jade3)' }}>
                        {fmtCurrency(stats?.total_earnings ?? 0, 'SGD')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginTop: 2 }}>TOTAL EARNINGS</div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="stat-row" style={{ marginBottom: 24 }}>
                <div className="sm">
                    <div className="sm-bar" style={{ background: 'var(--sea3)' }} />
                    <div className="sm-num">{stats?.active_mandates ?? 0}/2</div>
                    <div className="sm-lbl">Active slots</div>
                </div>
                <div className="sm">
                    <div className="sm-bar" style={{ background: 'var(--jade3)' }} />
                    <div className="sm-num">{stats?.total_placements ?? 0}</div>
                    <div className="sm-lbl">Placements</div>
                </div>
                <div className="sm">
                    <div className="sm-bar" style={{ background: 'var(--amber2)' }} />
                    <div className="sm-num">{stats?.pending_cdd ?? 0}</div>
                    <div className="sm-lbl">Pending CDD</div>
                </div>
                <div className="sm">
                    <div className="sm-bar" style={{ background: 'var(--violet2)' }} />
                    <div className="sm-num">{stats?.total_candidates ?? 0}</div>
                    <div className="sm-lbl">Candidates</div>
                </div>
            </div>

            <div className="g21" style={{ alignItems: 'start' }}>
                {/* Active mandates */}
                <div>
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div className="dcard-head">
                            <span className="dcard-title">📋 Active roles</span>
                            <Link href={route('recruiter.mandates.index')} className="dcard-ghost-btn">Browse all</Link>
                        </div>
                        {activeMandates.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center' }}>
                                <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 10 }}>You have no active roles. Pick one to start.</p>
                                <Link href={route('recruiter.mandates.index')} className="btn btn-primary btn-sm">Browse job board</Link>
                            </div>
                        ) : (
                            activeMandates.map(claim => (
                                <div key={claim.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--wire)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{claim.mandate?.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{claim.mandate?.client?.company_name}</div>
                                        </div>
                                        <Link href={route('recruiter.kanban.show', claim.mandate?.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--sea2)' }}>
                                            Pipeline →
                                        </Link>
                                        <Link href={route('recruiter.mandates.workspace', claim.mandate?.id)} className="btn btn-ghost btn-sm">
                                            Workspace →
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                <div>
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div className="dcard-head"><span className="dcard-title">Quick actions</span></div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Link href={route('recruiter.mandates.index')} className="btn btn-primary">Browse job board</Link>
                            <Link href={route('recruiter.candidates.index')} className="btn btn-secondary">My candidates</Link>
                            <Link href={route('recruiter.earnings.index')} className="btn btn-ghost">View earnings</Link>
                        </div>
                    </div>

                    {recentCandidates.length > 0 && (
                        <div className="dcard">
                            <div className="dcard-head">
                                <span className="dcard-title">Recent candidates</span>
                                <Link href={route('recruiter.candidates.index')} className="dcard-ghost-btn">View all</Link>
                            </div>
                            {recentCandidates.map(c => (
                                <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{c.first_name} {c.last_name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{c.current_role ?? 'No current role'}</div>
                                    </div>
                                    <Link href={route('recruiter.candidates.show', c.id)} className="btn btn-ghost btn-sm">View</Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </RecruiterLayout>
    )
}
