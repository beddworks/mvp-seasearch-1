import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { fmtCurrency, fmtDate, fmtRelative } from '@/lib/utils'

const PAYOUT_STATUS_STYLE = {
    pending:    { bg: 'var(--amber-pale)',  color: 'var(--amber2)' },
    processing: { bg: 'var(--sea-pale)',    color: 'var(--sea2)' },
    paid:       { bg: 'var(--jade-pale)',   color: 'var(--jade2)' },
    failed:     { bg: 'var(--ruby-pale)',   color: 'var(--ruby2)' },
}

function PayoutModal({ balance, currency = 'SGD', onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        bank_name: '', account_number: '', account_holder: '', swift_code: '',
    })

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(13,12,10,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }} onClick={onClose}>
            <div className="dcard" style={{ width: 440, padding: 0 }} onClick={e => e.stopPropagation()}>
                <div className="dcard-head">
                    <span className="dcard-title">Request payout</span>
                    <button className="dcard-ghost-btn" onClick={onClose}>✕</button>
                </div>

                <div style={{ padding: '16px 20px' }}>
                    <div style={{
                        background: 'var(--jade-pale)', border: '1px solid var(--jade2)',
                        borderRadius: 'var(--rsm)', padding: '12px 16px', marginBottom: 20,
                    }}>
                        <div style={{ fontSize: 11, color: 'var(--jade)', marginBottom: 4 }}>Available balance</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--jade2)' }}>
                            {fmtCurrency(balance, currency)}
                        </div>
                    </div>

                    <form onSubmit={e => { e.preventDefault(); post(route('recruiter.earnings.payout-request'), { onSuccess: onClose }) }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Account holder name</label>
                                <input className="form-input" value={data.account_holder}
                                    onChange={e => setData('account_holder', e.target.value)}
                                    placeholder="Full legal name" />
                                {errors.account_holder && <p className="form-error">{errors.account_holder}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bank name</label>
                                <input className="form-input" value={data.bank_name}
                                    onChange={e => setData('bank_name', e.target.value)}
                                    placeholder="e.g. DBS Bank" />
                                {errors.bank_name && <p className="form-error">{errors.bank_name}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Account number</label>
                                <input className="form-input" value={data.account_number}
                                    onChange={e => setData('account_number', e.target.value)}
                                    placeholder="Bank account number" />
                                {errors.account_number && <p className="form-error">{errors.account_number}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">SWIFT / BIC code <span style={{ color: 'var(--ink4)' }}>(optional)</span></label>
                                <input className="form-input" value={data.swift_code}
                                    onChange={e => setData('swift_code', e.target.value)}
                                    placeholder="e.g. DBSSSGSG" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            <button type="submit" className="btn btn-primary" disabled={processing} style={{ flex: 1 }}>
                                {processing ? 'Submitting…' : `Request ${fmtCurrency(balance, currency)}`}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 10, textAlign: 'center' }}>
                            Payouts are processed within 2–3 business days via bank transfer.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default function EarningsIndex({ summary, placements, pending, payoutHistory }) {
    const [showPayout, setShowPayout] = useState(false)
    const flash = usePage().props.flash

    return (
        <RecruiterLayout title="Earnings">
            {showPayout && (
                <PayoutModal
                    balance={summary.available_balance}
                    onClose={() => setShowPayout(false)}
                />
            )}

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                        Earnings &amp; payouts
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--ink4)' }}>Track your placements and request bank transfer payouts</p>
                </div>
                {summary.available_balance > 0 && (
                    <button className="btn btn-primary" onClick={() => setShowPayout(true)}>
                        Request payout
                    </button>
                )}
            </div>

            {/* Stat cards */}
            <div className="stat-row" style={{ marginBottom: 24 }}>
                <div className="sm" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="sm-bar" style={{ background: 'var(--jade3)' }} />
                    <div className="sm-num" style={{ color: 'var(--jade2)' }}>{fmtCurrency(summary.ytd_earnings ?? 0, 'SGD')}</div>
                    <div className="sm-lbl">YTD earnings</div>
                </div>
                <div className="sm" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="sm-bar" style={{ background: 'var(--amber2)' }} />
                    <div className="sm-num">{fmtCurrency(summary.available_balance ?? 0, 'SGD')}</div>
                    <div className="sm-lbl">Available balance</div>
                </div>
                <div className="sm" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="sm-bar" style={{ background: 'var(--violet2)' }} />
                    <div className="sm-num">{fmtCurrency(summary.pending_rewards ?? 0, 'SGD')}</div>
                    <div className="sm-lbl">Pending rewards</div>
                </div>
                <div className="sm" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="sm-bar" style={{ background: 'var(--sea3)' }} />
                    <div className="sm-num">{summary.placements_ytd ?? 0}</div>
                    <div className="sm-lbl">Placements YTD</div>
                </div>
            </div>

            <div className="g21" style={{ alignItems: 'start' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Pending rewards */}
                    {pending?.length > 0 && (
                        <div className="dcard">
                            <div className="dcard-head">
                                <span className="dcard-title">Pending rewards</span>
                                <span className="cbadge cb-vio">{pending.length}</span>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Role</th>
                                            <th>Stage</th>
                                            <th style={{ textAlign: 'right' }}>Est. payout</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 500 }}>{p.candidate_name}</td>
                                                <td>
                                                    <div style={{ fontSize: 13 }}>{p.mandate_title}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{p.client_name}</div>
                                                </td>
                                                <td>
                                                    <span className="cbadge cb-vio" style={{ textTransform: 'capitalize' }}>
                                                        {p.client_status?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--jade2)' }}>
                                                    {fmtCurrency(p.estimated_payout ?? 0, p.currency ?? 'SGD')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Placement history */}
                    <div className="dcard">
                        <div className="dcard-head">
                            <span className="dcard-title">Placement history</span>
                        </div>
                        {placements?.data?.length > 0 ? (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Role</th>
                                            <th>Gross</th>
                                            <th>Fee</th>
                                            <th>Penalty</th>
                                            <th>Net payout</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {placements.data.map(p => {
                                            const st = PAYOUT_STATUS_STYLE[p.payout_status] ?? PAYOUT_STATUS_STYLE.pending
                                            return (
                                                <tr key={p.id}>
                                                    <td style={{ fontWeight: 500 }}>
                                                        {p.cdd_submission?.candidate?.full_name ?? '—'}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: 13 }}>{p.mandate?.title ?? '—'}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{p.mandate?.client?.company_name ?? ''}</div>
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                                                        {fmtCurrency(p.gross_reward, p.currency ?? 'SGD')}
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ruby2)' }}>
                                                        -{fmtCurrency(p.platform_fee, p.currency ?? 'SGD')}
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: p.penalty_amount > 0 ? 'var(--amber2)' : 'var(--ink4)' }}>
                                                        {p.penalty_amount > 0 ? `-${fmtCurrency(p.penalty_amount, p.currency ?? 'SGD')}` : '—'}
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--jade2)' }}>
                                                        {fmtCurrency(p.final_payout, p.currency ?? 'SGD')}
                                                    </td>
                                                    <td>
                                                        <span className="cbadge" style={{ background: st.bg, color: st.color }}>
                                                            {p.payout_status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>
                                                        {fmtDate(p.placed_at)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                                No placements yet. Settled placements will appear here.
                            </div>
                        )}

                        {/* Pagination */}
                        {placements?.last_page > 1 && (
                            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--wire)' }}>
                                {placements.links?.map((link, i) => (
                                    <a key={i} href={link.url} style={{
                                        padding: '4px 10px', borderRadius: 'var(--rxs)',
                                        fontSize: 12, textDecoration: 'none',
                                        background: link.active ? 'var(--sea2)' : 'var(--mist3)',
                                        color: link.active ? '#fff' : 'var(--ink)',
                                        pointerEvents: link.url ? 'auto' : 'none',
                                        opacity: link.url ? 1 : 0.4,
                                    }} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column: payout history sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="dcard">
                        <div className="dcard-head"><span className="dcard-title">Balance summary</span></div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Available for payout</span>
                                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--jade2)' }}>
                                    {fmtCurrency(summary.available_balance ?? 0, 'SGD')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Pending in pipeline</span>
                                <span style={{ fontFamily: 'var(--mono)', color: 'var(--violet2)' }}>
                                    {fmtCurrency(summary.pending_rewards ?? 0, 'SGD')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Avg per placement</span>
                                <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>
                                    {fmtCurrency(summary.avg_reward ?? 0, 'SGD')}
                                </span>
                            </div>
                            <div style={{ borderTop: '1px solid var(--wire)', paddingTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>All-time total</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--ink)' }}>
                                        {fmtCurrency(summary.total_earnings ?? 0, 'SGD')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {summary.available_balance > 0 && (
                            <div style={{ padding: '0 20px 16px' }}>
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => setShowPayout(true)}>
                                    Request payout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Payout history */}
                    {payoutHistory?.length > 0 && (
                        <div className="dcard">
                            <div className="dcard-head"><span className="dcard-title">Payout history</span></div>
                            <div style={{ padding: '4px 0' }}>
                                {payoutHistory.map(p => {
                                    const st = PAYOUT_STATUS_STYLE[p.payout_status] ?? PAYOUT_STATUS_STYLE.pending
                                    return (
                                        <div key={p.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px 20px', borderBottom: '1px solid var(--wire)',
                                        }}>
                                            <div>
                                                <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13 }}>
                                                    {fmtCurrency(p.final_payout, p.currency ?? 'SGD')}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                                                    {p.payout_date ? fmtDate(p.payout_date) : fmtDate(p.placed_at)}
                                                </div>
                                            </div>
                                            <span className="cbadge" style={{ background: st.bg, color: st.color }}>
                                                {p.payout_status}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </RecruiterLayout>
    )
}
