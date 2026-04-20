import { router } from '@inertiajs/react'
import { initials } from '@/lib/utils'

export default function ClientLayout({ client, children, activeScreen = 'dashboard' }) {
    const accent = client?.accent_color ?? '#0B4F8A'

    return (
        <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
            {/* Top nav — dark ink with client branding */}
            <nav style={{ height: 56, background: 'var(--ink)', borderBottom: '1px solid var(--ink2)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', opacity: .7 }}>Sea Search</span>
                    <div style={{ width: 1, height: 20, background: 'var(--ink3)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: '#fff', letterSpacing: '.03em' }}>
                            {client?.company_name?.slice(0, 3).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{client?.company_name}</div>
                    </div>
                </div>

                {/* Top nav links */}
                <div style={{ display: 'flex', gap: 2, marginLeft: 28 }}>
                    {[
                        ['dashboard', 'Dashboard'],
                        ['submissions', 'Submissions'],
                        ['pipeline', 'Pipeline'],
                        ['compare', 'Compare'],
                        ['feedback', 'Interview Feedback'],
                        ['messages', 'Messages'],
                        ['notifications', 'Notifications'],
                    ].map(([id, label]) => (
                        <div key={id}
                            onClick={() => router.visit(route('client.portal.index', { screen: id }))}
                            style={{
                                fontSize: 12, padding: '5px 10px', borderRadius: 'var(--rsm)', cursor: 'pointer',
                                color: activeScreen === id ? '#fff' : 'rgba(255,255,255,.8)',
                                background: activeScreen === id ? 'rgba(255,255,255,.15)' : 'transparent',
                                fontWeight: activeScreen === id ? 500 : 400,
                            }}>
                            {label}
                        </div>
                    ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--ink3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,.5)' }}>🔔</div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, cursor: 'pointer' }}>
                        {initials(client?.contact_name ?? '')}
                    </div>
                </div>
            </nav>

            {/* Shell: sidebar + main */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 220, background: 'var(--paper)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
                    {/* Active mandate card */}
                    <div style={{ margin: '14px 12px', background: `${accent}12`, border: `1.5px solid ${accent}55`, borderRadius: 'var(--r)', padding: 12 }}>
                        <div style={{ fontSize: 9, color: accent, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4, fontWeight: 600 }}>Active mandate</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{client?.active_mandate_title ?? 'No active role'}</div>
                    </div>

                    {/* Nav items */}
                    <div style={{ padding: '6px 10px', flex: 1 }}>
                        {[
                            ['dashboard', '📊', 'Dashboard'],
                            ['submissions', '👤', 'Submissions'],
                            ['compare', '⊞', 'Compare'],
                            ['feedback', '💬', 'Interview Feedback'],
                            ['messages', '✉', 'Messages'],
                            ['notifications', '🔔', 'Notifications'],
                        ].map(([id, ico, lbl]) => (
                            <div key={id}
                                onClick={() => router.visit(route('client.portal.index', { screen: id }))}
                                className={`sbi${activeScreen === id ? ' on' : ''}`}
                                style={activeScreen === id
                                    ? { background: `${accent}20`, color: 'var(--ink)', fontWeight: 500, border: `1px solid ${accent}35`, borderRadius: 'var(--rsm)' }
                                    : { color: 'var(--ink3)' }}>
                                <span className="sbi-i">{ico}</span>
                                <span className="sbi-l">{lbl}</span>
                            </div>
                        ))}
                    </div>

                    {/* User strip */}
                    <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--paper2)', borderRadius: 'var(--rsm)', border: '1px solid var(--line)' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, flexShrink: 0 }}>
                                {initials(client?.contact_name ?? '')}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)' }}>{client?.contact_name}</div>
                                <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{client?.contact_title}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post(route('logout'))}
                                style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--mono)', flexShrink: 0, padding: '2px 4px' }}
                                title="Sign out"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>

                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--paper2)' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
