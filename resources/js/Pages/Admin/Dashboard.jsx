import { usePage } from '@inertiajs/react'
import FlashMessages from '@/Components/FlashMessages'

export default function AdminDashboard({ stats }) {
    const { auth } = usePage().props

    const statCards = [
        { label: 'Recruiters',       value: stats.total_recruiters, accent: 'var(--sea3)' },
        { label: 'Active mandates',  value: stats.active_mandates,  accent: 'var(--jade3)' },
        { label: 'Total users',      value: stats.total_users,       accent: 'var(--violet2)' },
        { label: 'Pending claims',   value: stats.pending_claims,    accent: 'var(--amber2)' },
    ]

    return (
        <div style={{ minHeight: '100vh', fontFamily: 'var(--font)', background: 'var(--mist2)' }}>
            {/* Topbar */}
            <div className="topbar">
                <div className="tb-logo-wrap">
                    <span className="logo">Sea<span>Search</span></span>
                </div>
                <div style={{ flex: 1, paddingLeft: 20 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                        Admin Panel
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--mist4)' }}>{auth.user?.name}</span>
                    <a href={route('logout')}
                        style={{ fontSize: 11, color: 'var(--ink4)', background: 'var(--ink2)', padding: '4px 10px', borderRadius: 'var(--rxs)', fontFamily: 'var(--mono)' }}
                        onClick={e => { e.preventDefault(); document.getElementById('logout-form-admin').submit() }}>
                        Sign out
                    </a>
                    <form id="logout-form-admin" method="POST" action={route('logout')} style={{ display: 'none' }}>
                        <input type="hidden" name="_token" value={document.querySelector('meta[name=csrf-token]')?.content} />
                    </form>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>
                    Platform overview
                </h1>

                {/* Stat cards */}
                <div className="stat-row" style={{ marginBottom: 24 }}>
                    {statCards.map(card => (
                        <div className="sm" key={card.label}>
                            <div className="sm-bar" style={{ background: card.accent }} />
                            <div className="sm-num">{card.value}</div>
                            <div className="sm-lbl">{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="dcard" style={{ padding: 24 }}>
                    <p style={{ color: 'var(--ink4)', fontSize: 13 }}>
                        Full admin panel (mandate CRUD, client management, recruiter management) will be built in Phase 3.
                    </p>
                </div>
            </div>

            <FlashMessages />
        </div>
    )
}
