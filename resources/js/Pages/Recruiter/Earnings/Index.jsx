import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { fmtCurrency } from '@/lib/utils'

export default function EarningsIndex({ recruiter, stats, placements }) {
    return (
        <RecruiterLayout title="Earnings">
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>
                Earnings & payouts
            </h1>

            <div className="stat-row" style={{ marginBottom: 24 }}>
                <div className="sm">
                    <div className="sm-bar" style={{ background: 'var(--jade3)' }} />
                    <div className="sm-num">{fmtCurrency(stats?.total_earnings ?? 0, 'SGD')}</div>
                    <div className="sm-lbl">Total earned</div>
                </div>
                <div className="sm">
                    <div className="sm-bar" style={{ background: 'var(--amber2)' }} />
                    <div className="sm-num">{fmtCurrency(stats?.pending_payout ?? 0, 'SGD')}</div>
                    <div className="sm-lbl">Pending payout</div>
                </div>
                <div className="sm">
                    <div className="sm-bar" style={{ background: 'var(--sea3)' }} />
                    <div className="sm-num">{stats?.total_placements ?? 0}</div>
                    <div className="sm-lbl">Placements</div>
                </div>
            </div>

            <div className="dcard">
                <div className="dcard-head"><span className="dcard-title">Placement history</span></div>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                    Commission engine builds in a later phase. Your earnings will appear here.
                </div>
            </div>
        </RecruiterLayout>
    )
}
