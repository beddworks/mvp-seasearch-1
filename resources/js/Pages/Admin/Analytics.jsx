import AdminLayout from '@/Layouts/AdminLayout'
import { fmtCurrency } from '@/lib/utils'

const SATISFACTION_COLORS = {
    shortlisted: 'var(--sea2)',
    interview:   'var(--violet2)',
    offer_made:  'var(--amber2)',
    hired:       'var(--jade2)',
    rejected:    'var(--ruby2)',
    on_hold:     'var(--ink4)',
}

export default function Analytics({ funnel, leaderboard, revenue, monthlyRevenue = [], avgTimeToFill = 0, clientSatisfaction = {} }) {
    const funnelSteps = [
        { label: 'Mandates posted',  value: funnel.mandates_posted },
        { label: 'Mandates picked',  value: funnel.mandates_picked },
        { label: 'CDD submitted',    value: funnel.cdd_submitted },
        { label: 'To interview',     value: funnel.cdd_to_interview },
        { label: 'Offers made',      value: funnel.offers_made },
        { label: 'Placements',       value: funnel.placements },
    ]
    const maxFunnel  = funnelSteps[0]?.value || 1
    const maxRevenue = Math.max(...(monthlyRevenue.map(m => parseFloat(m.revenue) || 0)), 1)
    const satisfactionTotal = Object.values(clientSatisfaction).reduce((a, b) => a + b, 0) || 1

    return (
        <AdminLayout title="Analytics">
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>Analytics</h1>

            {/* KPI strip */}
            <div className="stat-row" style={{ marginBottom: 24 }}>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--gold2)' }} /><div className="sm-num">{fmtCurrency(revenue.mtd, 'SGD')}</div><div className="sm-lbl">Revenue MTD</div></div>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--jade3)' }} /><div className="sm-num">{fmtCurrency(revenue.ytd, 'SGD')}</div><div className="sm-lbl">Revenue YTD</div></div>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--sea3)' }} /><div className="sm-num">{funnel.placements}</div><div className="sm-lbl">Placements YTD</div></div>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--violet2)' }} /><div className="sm-num">{avgTimeToFill > 0 ? `${Math.round(avgTimeToFill)}d` : '—'}</div><div className="sm-lbl">Avg days to fill</div></div>
            </div>

            {/* Monthly revenue chart */}
            {monthlyRevenue.length > 0 && (
                <div className="dcard" style={{ marginBottom: 16 }}>
                    <div className="dcard-head"><span className="dcard-title">Monthly revenue (last 12 months)</span></div>
                    <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120 }}>
                            {monthlyRevenue.map(m => {
                                const rev = parseFloat(m.revenue) || 0
                                const pct = maxRevenue > 0 ? (rev / maxRevenue) * 100 : 0
                                return (
                                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${m.month}: ${fmtCurrency(rev, 'SGD')}`}>
                                        <div style={{ width: '100%', background: 'var(--sea3)', borderRadius: '3px 3px 0 0', height: `${Math.max(pct, 2)}%`, minHeight: 3, transition: 'height .3s' }} />
                                        <div style={{ fontSize: 9, color: 'var(--ink4)', fontFamily: 'var(--mono)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap', transformOrigin: 'top center' }}>                                            {m.month?.slice(5)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 11, color: 'var(--ink4)' }}>
                            <span>{monthlyRevenue[0]?.month}</span>
                            <span>{monthlyRevenue[monthlyRevenue.length - 1]?.month}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="g21" style={{ alignItems: 'start' }}>
                {/* Left: funnel + leaderboard */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="dcard">
                        <div className="dcard-head"><span className="dcard-title">Placement funnel (YTD)</span></div>
                        <div style={{ padding: 16 }}>
                            {funnelSteps.map((step, i) => (
                                <div key={step.label} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12 }}>{step.label}</span>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>{step.value}</span>
                                    </div>
                                    <div style={{ height: 6, background: 'var(--wire)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${maxFunnel > 0 ? (step.value / maxFunnel) * 100 : 0}%`,
                                            background: i === funnelSteps.length - 1 ? 'var(--jade3)' : 'var(--sea3)',
                                            borderRadius: 3, transition: 'width .3s',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dcard">
                        <div className="dcard-head"><span className="dcard-title">Recruiter leaderboard (YTD)</span></div>
                        {leaderboard.length === 0
                            ? <p style={{ padding: 16, fontSize: 12, color: 'var(--ink4)' }}>No placements yet.</p>
                            : leaderboard.map((r, i) => (
                                <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ width: 24, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink4)', textAlign: 'center' }}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{r.user?.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{r.placements_ytd} placement{r.placements_ytd !== 1 ? 's' : ''}</div>
                                    </div>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--jade2)', fontWeight: 600 }}>
                                        {fmtCurrency(r.earnings_ytd ?? 0, 'SGD')}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Right: client satisfaction */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Object.keys(clientSatisfaction).length > 0 && (
                        <div className="dcard">
                            <div className="dcard-head"><span className="dcard-title">Client feedback breakdown</span></div>
                            <div style={{ padding: '16px 20px' }}>
                                {Object.entries(clientSatisfaction)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([status, count]) => {
                                        const pct = Math.round((count / satisfactionTotal) * 100)
                                        const color = SATISFACTION_COLORS[status] ?? 'var(--ink4)'
                                        return (
                                            <div key={status} style={{ marginBottom: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>{count} <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>({pct}%)</span></span>
                                                </div>
                                                <div style={{ height: 6, background: 'var(--wire)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .3s' }} />
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    )}

                    {avgTimeToFill > 0 && (
                        <div className="dcard">
                            <div className="dcard-head"><span className="dcard-title">Speed to fill</span></div>
                            <div style={{ padding: '20px 20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--sea2)', lineHeight: 1 }}>
                                        {Math.round(avgTimeToFill)}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 6 }}>avg days from claim to placement (YTD)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
