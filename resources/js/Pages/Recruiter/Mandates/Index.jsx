import RecruiterLayout from '@/Layouts/RecruiterLayout'
import { Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { fmtCurrency, fmtDate } from '@/lib/utils'

const TABS = [
    { key: 'all',       label: 'All active' },
    { key: 'unclaimed', label: 'Unclaimed' },
    { key: 'exclusive', label: '⭐ Exclusive' },
    { key: 'fast_track', label: '⚡ Fast-track' },
]

const SENIORITY_LABELS = {
    c_suite: 'C-Suite',
    vp_director: 'VP/Director',
    manager: 'Manager',
    ic: 'Individual Contributor',
}

export default function MandatesIndex({ mandates, myClaimedIds = [], industries = [], filters = {}, canPickMore, activeMandatesCount }) {
    const [query, setQuery] = useState(filters)

    function applyFilter(key, val) {
        const next = { ...query, [key]: val }
        setQuery(next)
        router.get(route('recruiter.mandates.index'), next, { preserveState: true, replace: true })
    }

    function setTab(tab) {
        applyFilter('tab', tab)
    }

    const activeTab = query.tab ?? 'all'

    return (
        <RecruiterLayout title="Job board">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Job board</h1>
                    {!canPickMore && (
                        <div style={{ fontSize: 11, color: 'var(--amber2)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                            ⚠ Both slots filled ({activeMandatesCount}/2). Complete a role to pick a new one.
                        </div>
                    )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink4)' }}>
                    Slots: <strong style={{ color: activeMandatesCount >= 2 ? 'var(--ruby2)' : 'var(--jade3)' }}>{activeMandatesCount}/2</strong>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--wire)', paddingBottom: 0 }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        style={{
                            padding: '7px 14px', fontSize: 12, border: 'none', background: 'none', cursor: 'pointer',
                            borderBottom: activeTab === t.key ? '2px solid var(--sea2)' : '2px solid transparent',
                            color: activeTab === t.key ? 'var(--sea2)' : 'var(--ink4)',
                            fontWeight: activeTab === t.key ? 600 : 400,
                            fontFamily: 'var(--font)',
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {industries.length > 0 && (
                    <select className="form-input" style={{ width: 180 }} value={query.industry ?? ''} onChange={e => applyFilter('industry', e.target.value)}>
                        <option value="">All industries</option>
                        {industries.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                )}
                <select className="form-input" style={{ width: 160 }} value={query.seniority ?? ''} onChange={e => applyFilter('seniority', e.target.value)}>
                    <option value="">All seniority</option>
                    {Object.entries(SENIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select className="form-input" style={{ width: 140 }} value={query.type ?? ''} onChange={e => applyFilter('type', e.target.value)}>
                    <option value="">All types</option>
                    <option value="full_time">Full time</option>
                    <option value="contract">Contract</option>
                    <option value="part_time">Part time</option>
                </select>
                {(query.industry || query.seniority || query.type) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setQuery({}); router.get(route('recruiter.mandates.index'), {}, { replace: true }) }}>
                        Clear filters
                    </button>
                )}
            </div>

            {/* Role cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {mandates.data?.map(m => {
                    const isClaimed = myClaimedIds?.includes(m.id)
                    return (
                        <div key={m.id} className="dcard" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                {/* Left accent bar */}
                                <div style={{ width: 4, background: m.is_exclusive ? 'var(--gold2)' : m.is_fast_track ? 'var(--sea3)' : 'var(--sea2)', flexShrink: 0 }} />

                                <div style={{ flex: 1, padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{m.title}</span>
                                                {m.is_exclusive && <span className="cbadge cb-gld">Exclusive</span>}
                                                {m.is_fast_track && <span className="cbadge cb-sea">Fast-track</span>}
                                                {m.is_featured && <span className="cbadge cb-vio">Featured</span>}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--ink4)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                <span>🏢 {m.client?.company_name}</span>
                                                {m.location && <span>📍 {m.location}</span>}
                                                {m.seniority && <span>🎯 {SENIORITY_LABELS[m.seniority] ?? m.seniority}</span>}
                                                {m.industry && <span>🏭 {m.industry}</span>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {m.reward_pct && (
                                                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--jade2)' }}>
                                                    {m.reward_pct}%
                                                </div>
                                            )}
                                            {m.salary_min && m.salary_max && (
                                                <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                                                    {m.salary_currency} {Math.floor(m.salary_min / 1000)}k–{Math.floor(m.salary_max / 1000)}k
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {m.description && (
                                        <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 8, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                                            dangerouslySetInnerHTML={{ __html: m.description }} />
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                        <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>
                                            {m.approved_claim ? (
                                                <span style={{ color: 'var(--amber2)' }}>Claimed by {m.approved_claim?.recruiter?.user?.name}</span>
                                            ) : (
                                                <span style={{ color: 'var(--jade2)' }}>Available</span>
                                            )}
                                            {' · '}Posted {fmtDate(m.original_post_date)}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Link href={route('recruiter.mandates.show', m.id)} className="btn btn-ghost btn-sm">View JD</Link>
                                            {!isClaimed && !m.approved_claim && canPickMore && m.status === 'active' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => {
                                                    if (confirm(`Pick "${m.title}"? This will send a claim request to admin.`)) {
                                                        router.post(route('recruiter.mandates.pick', m.id))
                                                    }
                                                }}>
                                                    Pick role
                                                </button>
                                            )}
                                            {isClaimed && <span className="badge badge-sea" style={{ fontSize: 10 }}>Pending approval</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {!mandates.data?.length && (
                    <div className="dcard" style={{ padding: 40, textAlign: 'center' }}>
                        <p style={{ color: 'var(--ink4)', fontSize: 13 }}>No active roles match your filters.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {mandates.last_page > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
                    {mandates.links?.map((l, i) => (
                        l.url && <button key={i} className={`btn btn-sm ${l.active ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => router.get(l.url)}
                            dangerouslySetInnerHTML={{ __html: l.label }} />
                    ))}
                </div>
            )}
        </RecruiterLayout>
    )
}
