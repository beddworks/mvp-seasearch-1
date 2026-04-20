export default function FeedbackConfirmed() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--mist2)', fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column' }}>
            <nav style={{ height: 52, background: 'var(--ink)', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    Sea<span style={{ color: 'var(--sea3)' }}>Search</span>
                </div>
            </nav>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--jade-pale)', color: 'var(--jade2)', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        ✓
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                        Feedback received
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--ink4)', lineHeight: 1.7, marginBottom: 20 }}>
                        Thank you — your feedback has been recorded and your Sea Search team has been notified.
                        We'll be in touch shortly.
                    </p>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', padding: '10px 16px', background: 'var(--mist3)', borderRadius: 'var(--rsm)', border: '1px solid var(--wire)', display: 'inline-block' }}>
                        You may close this window.
                    </div>
                </div>
            </div>
        </div>
    )
}
