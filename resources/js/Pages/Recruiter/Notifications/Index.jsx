import RecruiterLayout from '@/Layouts/RecruiterLayout'

export default function NotificationsIndex({ notifications = [] }) {
    return (
        <RecruiterLayout title="Notifications">
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>
                Notifications
            </h1>
            <div className="dcard">
                {notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                        No notifications yet.
                    </div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--wire)' }}>
                            <div style={{ fontSize: 13, fontWeight: n.read_at ? 400 : 600 }}>{n.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4 }}>{n.body}</div>
                        </div>
                    ))
                )}
            </div>
        </RecruiterLayout>
    )
}
