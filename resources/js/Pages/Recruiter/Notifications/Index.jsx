import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { useState } from 'react'
import { fmtRelative } from '@/lib/utils'

const TYPE_COLOR = {
    claim_approved:           'var(--jade2)',
    claim_rejected:           'var(--ruby2)',
    claim_pending:            'var(--amber2)',
    cdd_approved:             'var(--jade2)',
    cdd_rejected:             'var(--ruby2)',
    cdd_pending:              'var(--amber2)',
    cdd_slot_burned:          'var(--ruby2)',
    client_feedback_received: 'var(--sea2)',
    client_feedback:          'var(--sea2)',
    placement_confirmed:      'var(--jade2)',
    payout_requested:         'var(--violet2)',
    payout_processed:         'var(--jade2)',
    timer_a_warning:          'var(--amber2)',
    timer_a_failed:           'var(--ruby2)',
    timer_b_warning:          'var(--amber2)',
    timer_c_sla_breach:       'var(--ruby2)',
    slot_freed:               'var(--sea2)',
    new_role_available:       'var(--sea2)',
    account_approved:         'var(--jade2)',
    account_suspended:        'var(--ruby2)',
    role_dropped:             'var(--ruby2)',
    role_returned_to_pool:    'var(--amber2)',
    role_unclaimed_48h:       'var(--amber2)',
    role_unclaimed_72h:       'var(--ruby2)',
}

function TypeDot({ type }) {
    const color = TYPE_COLOR[type] ?? 'var(--ink4)'
    return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
}

function NotifItem({ notif, onRead }) {
    const isUnread = !notif.is_read
    return (
        <div
            role="button"
            onClick={() => { if (isUnread) onRead(notif.id) }}
            style={{
                display: 'flex', gap: 12, padding: '14px 20px',
                borderBottom: '1px solid var(--wire)',
                background: isUnread ? 'var(--sea-pale)' : 'transparent',
                cursor: isUnread ? 'pointer' : 'default',
            }}
        >
            <TypeDot type={notif.type} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isUnread ? 600 : 400, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {notif.title}
                </div>
                {notif.body && (
                    <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 3, lineHeight: 1.45 }}>
                        {notif.body}
                    </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                    {fmtRelative(notif.created_at)}
                </div>
            </div>
            {isUnread && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sea2)', flexShrink: 0, alignSelf: 'center' }} />
            )}
            {notif.action_url && (
                <a href={notif.action_url} onClick={e => e.stopPropagation()}
                    style={{ alignSelf: 'center', fontSize: 11, color: 'var(--sea2)', textDecoration: 'none', flexShrink: 0 }}>
                    View →
                </a>
            )}
        </div>
    )
}

export default function NotificationsIndex({ notifications = { data: [], links: [], last_page: 1 }, unread_count = 0 }) {
    const [localUnread, setLocalUnread] = useState(unread_count)
    const [localItems, setLocalItems] = useState(notifications.data ?? [])
    const csrf = () => document.querySelector('meta[name=csrf-token]')?.content

    const markRead = (id) => {
        fetch(route('notifications.read', id), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' },
        }).then(() => {
            setLocalItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setLocalUnread(prev => Math.max(0, prev - 1))
        })
    }

    const markAllRead = () => {
        fetch(route('notifications.read-all'), {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' },
        }).then(() => {
            setLocalItems(prev => prev.map(n => ({ ...n, is_read: true })))
            setLocalUnread(0)
        })
    }

    return (
        <RecruiterLayout title="Notifications">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                        Notifications
                    </h1>
                    {localUnread > 0 && <span className="cbadge cb-sea">{localUnread} unread</span>}
                </div>
                {localUnread > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>
                )}
            </div>

            <div className="dcard" style={{ padding: 0 }}>
                {localItems.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>All caught up</div>
                        <div style={{ fontSize: 13, color: 'var(--ink4)' }}>You have no notifications yet.</div>
                    </div>
                ) : (
                    localItems.map(n => <NotifItem key={n.id} notif={n} onRead={markRead} />)
                )}

                {notifications.last_page > 1 && (
                    <div style={{ display: 'flex', gap: 6, padding: '12px 20px', borderTop: '1px solid var(--wire)' }}>
                        {notifications.links?.map((link, i) => (
                            <a key={i} href={link.url} style={{
                                padding: '4px 10px', borderRadius: 'var(--rxs)', fontSize: 12, textDecoration: 'none',
                                background: link.active ? 'var(--sea2)' : 'var(--mist3)',
                                color: link.active ? '#fff' : 'var(--ink)',
                                pointerEvents: link.url ? 'auto' : 'none',
                                opacity: link.url ? 1 : 0.4,
                            }} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </RecruiterLayout>
    )
}
