import AdminLayout from '@/Layouts/AdminLayout'
import { Link, useForm, router } from '@inertiajs/react'
import { fmt, fmtCurrency } from '@/lib/utils'

export default function Analytics({ funnel, leaderboard, revenue }) {
    const funnelSteps = [
        { label: 'Mandates posted',    value: funnel.mandates_posted },
        { label: 'Mandates picked',    value: funnel.mandates_picked },
        { label: 'CDD submitted',      value: funnel.cdd_submitted },
        { label: 'To interview',       value: funnel.cdd_to_interview },
        { label: 'Offers made',        value: funnel.offers_made },
        { label: 'Placements',         value: funnel.placements },
    ]

    const maxFunnel = funnelSteps[0]?.value || 1

    return (
        <AdminLayout title="Analytics">
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>Analytics</h1>

            {/* Revenue summary */}
            <div className="stat-row" style={{ marginBottom: 24 }}>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--gold2)' }} /><div className="sm-num">{fmtCurrency(revenue.mtd, 'SGD')}</div><div className="sm-lbl">Revenue MTD</div></div>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--jade3)' }} /><div className="sm-num">{fmtCurrency(revenue.ytd, 'SGD')}</div><div className="sm-lbl">Revenue YTD</div></div>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--sea3)' }} /><div className="sm-num">{funnel.placements}</div><div className="sm-lbl">Placements YTD</div></div>
                <div className="sm"><div className="sm-bar" style={{ background: 'var(--violet2)' }} /><div className="sm-num">{funnel.mandates_posted}</div><div className="sm-lbl">Mandates posted YTD</div></div>
            </div>

            <div className="g21" style={{ alignItems: 'start' }}>
                {/* Funnel */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">📊 Placement funnel (YTD)</span></div>
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
                                        borderRadius: 3,
                                        transition: 'width .3s',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="dcard">
                    <div className="dcard-head"><span className="dcard-title">🏆 Recruiter leaderboard (YTD)</span></div>
                    {leaderboard.length === 0
                        ? <p style={{ padding: 16, fontSize: 12, color: 'var(--ink4)' }}>No placements yet.</p>
                        : leaderboard.map((r, i) => (
                            <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--wire)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ width: 20, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink4)', textAlign: 'center' }}>
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.user?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{r.placements_ytd} placements</div>
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--jade2)', fontWeight: 600 }}>
                                    {fmtCurrency(r.earnings_ytd ?? 0, 'SGD')}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </AdminLayout>
    )
}
