import { usePage, Link, router } from '@inertiajs/react'
import FlashMessages from '@/Components/FlashMessages'

const NAV = [
    { label: 'Dashboard',    href: 'admin.dashboard',            icon: '⬛' },
    { label: 'Mandates',     href: 'admin.mandates.index',       icon: '📋' },
    { label: 'Claims',       href: 'admin.claims.index',         icon: '✋' },
    { label: 'CDD Review',   href: 'admin.submissions.index',    icon: '📄' },
    { label: 'Clients',      href: 'admin.clients.index',        icon: '🏢' },
    { label: 'Recruiters',   href: 'admin.recruiters.index',     icon: '👤' },
    { label: 'Report Tpls',  href: 'admin.report-templates.index', icon: '📧' },
    { label: 'Analytics',    href: 'admin.analytics.index',      icon: '📊' },
]

const SETTINGS = [
    { label: 'Comp Types',    href: 'admin.compensation-types.index', icon: '💰' },
    { label: 'Exception Rules', href: 'admin.exception-rules.index', icon: '⚡' },
    { label: 'Timer Config',  href: 'admin.timer-config.index',    icon: '⏱' },
]

export default function AdminLayout({ title, children }) {
    const { auth, flash, unread_notifications } = usePage().props
    const current = route().current()

    function SideNavItem({ label, href, icon, badge }) {
        const active = current?.startsWith(href.replace(/\./g, '-').split('-').slice(0, 2).join('-'))
            || route().current(href)
        return (
            <Link href={route(href)} className={`sbi${active ? ' on' : ''}`}>
                <span className="sbi-ico">{icon}</span>
                <span className="sbi-lbl">{label}</span>
                {badge > 0 && <span className="sbadge sbadge-a">{badge}</span>}
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
                        <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', letterSpacing: '.06em', marginTop: 1 }}>ADMIN PANEL</div>
                    </div>
                </div>
                <div style={{ flex: 1, paddingLeft: 20 }}>
                    {title && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--mist4)' }}>{title}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingRight: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--mist4)' }}>{auth.user?.name}</span>
                    <form method="POST" action={route('logout')} onSubmit={e => { e.preventDefault(); router.post(route('logout')) }}>
                        <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
                            Sign out
                        </button>
                    </form>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-inner">
                        <div className="sb-sec-lbl" style={{ marginTop: 8 }}>Main</div>
                        {NAV.map(item => (
                            <SideNavItem key={item.href} {...item} />
                        ))}
                        <div className="sb-sec-lbl" style={{ marginTop: 16 }}>Settings</div>
                        {SETTINGS.map(item => (
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
