import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { Link, router } from '@inertiajs/react'
import { fmtCurrency, fmtDate } from '@/lib/utils'

export default function MandateShow({ mandate, existingClaim, canPick }) {
    const flagSection = (label, items, color) => items?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {items.map((item, i) => (
                    <span key={i} style={{ background: 'var(--mist3)', border: `1px solid ${color}`, borderRadius: 'var(--rxs)', padding: '3px 8px', fontSize: 11, color: 'var(--ink)' }}>{item}</span>
                ))}
            </div>
        </div>
    )

    return (
        <RecruiterLayout title={mandate.title}>
            <div style={{ marginBottom: 16 }}>
                <Link href={route('recruiter.mandates.index')} style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>← Back to job board</Link>
            </div>

            <div className="g21" style={{ alignItems: 'start' }}>
                {/* JD */}
                <div>
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div style={{ padding: '20px 20px 4px' }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                {mandate.is_exclusive && <span className="cbadge cb-gld">Exclusive</span>}
                                {mandate.is_fast_track && <span className="cbadge cb-sea">Fast-track</span>}
                                {mandate.is_remote && <span className="cbadge cb-jade">Remote</span>}
                            </div>
                            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{mandate.title}</h1>
                            <div style={{ fontSize: 12, color: 'var(--ink4)', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                                <span>🏢 {mandate.client?.company_name}</span>
                                {mandate.location && <span>📍 {mandate.location}</span>}
                                {mandate.seniority && <span>🎯 {mandate.seniority}</span>}
                                {mandate.industry && <span>🏭 {mandate.industry}</span>}
                                {mandate.contract_type && <span>📄 {mandate.contract_type.replace('_', ' ')}</span>}
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid var(--wire)', padding: 20 }}>
                            {mandate.description && (
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Description</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: mandate.description }} />
                                </div>
                            )}
                            {flagSection('Must-haves', mandate.must_haves, 'var(--jade3)')}
                            {flagSection('Nice-to-haves', mandate.nice_to_haves, 'var(--sea3)')}
                            {flagSection('Green flags', mandate.green_flags, 'var(--jade2)')}
                            {flagSection('Red flags', mandate.red_flags, 'var(--ruby2)')}
                        </div>
                    </div>

                    {mandate.screening_questions?.length > 0 && (
                        <div className="dcard">
                            <div className="dcard-head"><span className="dcard-title">Screening questions</span></div>
                            <ol style={{ padding: '10px 20px 14px 30px', margin: 0 }}>
                                {mandate.screening_questions.map((q, i) => (
                                    <li key={i} style={{ fontSize: 13, marginBottom: 8, color: 'var(--ink)' }}>
                                        {typeof q === 'object' ? q.question : q}
                                        {q.required && <span style={{ fontSize: 11, color: 'var(--ruby2)', marginLeft: 6 }}>required</span>}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>

                {/* Right: reward + action */}
                <div>
                    {/* Reward card */}
                    <div className="dcard" style={{ marginBottom: 14 }}>
                        <div style={{ padding: 18 }}>
                            <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Placement reward</div>
                            {mandate.reward_pct && (
                                <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, color: 'var(--jade2)', marginTop: 4 }}>
                                    {mandate.reward_pct}%
                                </div>
                            )}
                            {mandate.salary_min && mandate.salary_max && (
                                <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                                    Base: {mandate.salary_currency} {Math.floor(mandate.salary_min / 1000)}k – {Math.floor(mandate.salary_max / 1000)}k/yr
                                </div>
                            )}
                            {mandate.reward_pct && mandate.salary_min && (
                                <div style={{ fontSize: 11, color: 'var(--jade3)', marginTop: 6, fontFamily: 'var(--mono)' }}>
                                    Est. fee: {mandate.salary_currency} {Math.floor(mandate.salary_min * mandate.reward_pct / 100 / 1000)}k–{Math.floor(mandate.salary_max * mandate.reward_pct / 100 / 1000)}k
                                </div>
                            )}
                            <div style={{ borderTop: '1px solid var(--wire)', marginTop: 12, paddingTop: 12 }}>
                                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                                    <div>Timer A: {mandate.timer_a_days ?? 5} days to submit CDD</div>
                                    {mandate.timer_b_active && <div style={{ marginTop: 2 }}>Timer B: penalty applies</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pick action */}
                    <div className="dcard">
                        <div style={{ padding: 18, textAlign: 'center' }}>
                            {existingClaim ? (
                                <div>
                                    <span className={`badge badge-${existingClaim.status === 'approved' ? 'jade' : 'amber'}`} style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        {existingClaim.status === 'approved' ? '✓ Claim approved' : '⏳ Pending approval'}
                                    </span>
                                    {existingClaim.status === 'approved' && (
                                        <Link href={route('recruiter.mandates.workspace', mandate.id)} className="btn btn-primary" style={{ width: '100%' }}>
                                            Open workspace →
                                        </Link>
                                    )}
                                </div>
                            ) : canPick ? (
                                <div>
                                    <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 12 }}>
                                        Picking this role sends a claim request to admin. Once approved, your timer starts.
                                    </p>
                                    <button className="btn btn-primary" style={{ width: '100%' }}
                                        onClick={() => {
                                            if (confirm(`Pick "${mandate.title}"? Your claim will be reviewed by admin.`)) {
                                                router.post(route('recruiter.mandates.pick', mandate.id))
                                            }
                                        }}>
                                        Pick this role
                                    </button>
                                </div>
                            ) : (
                                <p style={{ fontSize: 12, color: 'var(--ink4)' }}>
                                    {mandate.approved_claim ? 'This role is already claimed.' : 'Both your slots are full. Complete a role first.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </RecruiterLayout>
    )
}
