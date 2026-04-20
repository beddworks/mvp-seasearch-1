import { usePage } from '@inertiajs/react'
import FlashMessages from '@/Components/FlashMessages'
import { fmtCurrency, fmt } from '@/lib/utils'

export default function RecruiterDashboard({ recruiter, stats }) {
    const { auth } = usePage().props

    return (
        <div style={{ minHeight: '100vh', fontFamily: 'var(--font)', background: 'var(--mist2)' }}>
            {/* Topbar */}
            <div className="topbar">
                <div className="tb-logo-wrap">
                    <span className="logo">Sea<span>Search</span></span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--mist4)' }}>{auth.user?.name}</span>
                    <a href={route('logout')}
                        style={{ fontSize: 11, color: 'var(--ink4)', background: 'var(--ink2)', padding: '4px 10px', borderRadius: 'var(--rxs)', fontFamily: 'var(--mono)' }}
                        onClick={e => { e.preventDefault(); document.getElementById('logout-form').submit() }}>
                        Sign out
                    </a>
                    <form id="logout-form" method="POST" action={route('logout')} style={{ display: 'none' }}>
                        <input type="hidden" name="_token" value={document.querySelector('meta[name=csrf-token]')?.content} />
                    </form>
                </div>
            </div>

            {/* Hero band */}
            <div className="hero">
                <div className="h-earn">
                    <div style={{ fontSize: 11, color: 'var(--mist4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>
                        Total earnings
                    </div>
                    <div className="h-earn-num">{fmtCurrency(stats.total_earnings, 'SGD')}</div>
                    <div style={{ fontSize: 12, color: 'var(--mist4)', marginTop: 6 }}>
                        {stats.total_placements} placement{stats.total_placements !== 1 ? 's' : ''} total
                    </div>
                </div>
                <div className="h-metrics" style={{ gap: 28 }}>
                    {[
                        { label: 'Active mandates', value: stats.active_mandates, max: 2 },
                        { label: 'Pending CDD',     value: stats.pending_cdd },
                    ].map(m => (
                        <div key={m.label} style={{ borderRight: '1px solid var(--ink2)', paddingRight: 28, paddingLeft: 4 }}>
                            <div style={{ fontSize: 11, color: 'var(--mist4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                                {m.label}
                            </div>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                                {m.value}{m.max != null && <span style={{ fontSize: 14, color: 'var(--ink3)', fontWeight: 400 }}>/{m.max}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: 28 }}>
                <div className="dcard" style={{ padding: 24 }}>
                    <p style={{ color: 'var(--ink4)', fontSize: 13 }}>
                        Dashboard widgets will be built in Phase 5 (Job board & pipeline). Welcome, <strong>{auth.user?.name}</strong>!
                    </p>
                </div>
            </div>

            <FlashMessages />
        </div>
    )
}
