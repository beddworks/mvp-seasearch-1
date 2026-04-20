import { usePage, Link, router } from '@inertiajs/react'
import FlashMessages from '@/Components/FlashMessages'

const NAV = [
    { label: 'Dashboard',   href: 'recruiter.dashboard',       icon: '⬛' },
    { label: 'Job board',   href: 'recruiter.mandates.index',  icon: '📋' },
    { label: 'Candidates',  href: 'recruiter.candidates.index',icon: '👤' },
    { label: 'Earnings',    href: 'recruiter.earnings.index',  icon: '💰' },
]

export default function RecruiterLayout({ title, children }) {
    const { auth, unread_notifications } = usePage().props

    const recruiter = auth?.recruiter

    function SideNavItem({ label, href, icon }) {
        const active = route().current(href) || route().current(href.replace('.index', '.*'))?.()
        return (
            <Link href={route(href)} className={`sbi${route().current()?.startsWith(href.split('.').slice(0, 2).join('.')) ? ' on' : ''}`}>
                <span className="sbi-ico">{icon}</span>
                <span className="sbi-lbl">{label}</span>
            </Link>
        )
    }

    return (
        <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
            {/* Topbar */}
            <div className="topbar">
                <div className="tb-logo-wrap">
                    <div>
                        <div className="logo">Sea<span>Search</span></div>
                        <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', letterSpacing: '.06em', marginTop: 1 }}>RECRUITER</div>
                    </div>
                </div>
                <div style={{ flex: 1, paddingLeft: 20 }}>
                    {title && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--mist4)' }}>{title}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingRight: 4 }}>
                    {/* Slot counter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ink2)', borderRadius: 6, padding: '3px 10px' }}>
                        <span style={{ fontSize: 10, color: 'var(--mist4)', fontFamily: 'var(--mono)' }}>SLOTS</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: recruiter?.active_mandates_count >= 2 ? 'var(--ruby2)' : 'var(--jade3)', fontFamily: 'var(--mono)' }}>
                            {recruiter?.active_mandates_count ?? 0}/2
                        </span>
                    </div>
                    {/* Notification bell */}
                    <Link href={route('recruiter.notifications.index')} style={{ position: 'relative', color: 'var(--mist4)', textDecoration: 'none', fontSize: 16 }}>
                        🔔
                        {unread_notifications > 0 && (
                            <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--ruby2)', color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)' }}>
                                {unread_notifications > 9 ? '9+' : unread_notifications}
                            </span>
                        )}
                    </Link>
                    <span style={{ fontSize: 12, color: 'var(--mist4)' }}>{auth.user?.name}</span>
                    <button
                        type="button"
                        onClick={() => router.post(route('logout'))}
                        style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--mono)' }}
                    >
                        Sign out
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-inner">
                        {/* Avatar / name */}
                        <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--ink2)', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                                    {auth.user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--mist4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {recruiter?.display_name ?? auth.user?.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginTop: 1, textTransform: 'uppercase' }}>
                                        {recruiter?.tier ?? 'junior'}
                                        {recruiter?.trust_level === 'trusted' && ' · trusted'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sb-sec-lbl">Navigation</div>
                        {NAV.map(item => (
                            <SideNavItem key={item.href} {...item} />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--mist2)', padding: 28 }}>
                    {children}
                </main>
            </div>

            <FlashMessages />
        </div>
    )
}
