import AdminLayout from '@/Layouts/AdminLayout'
import { useForm, router } from '@inertiajs/react'
import { useState } from 'react'

function MandateRow({ mandate }) {
    const [editing, setEditing] = useState(false)
    const { data, setData, put, processing, errors } = useForm({
        timer_a_days:           mandate.timer_a_days,
        timer_b_active:         mandate.timer_b_active,
        timer_b_days:           mandate.timer_b_days,
        timer_b_penalty_d6:     mandate.timer_b_penalty_d6,
        timer_b_penalty_d7:     mandate.timer_b_penalty_d7,
        timer_b_penalty_d8plus: mandate.timer_b_penalty_d8plus,
        timer_c_active:         mandate.timer_c_active,
        timer_c_sla_days:       mandate.timer_c_sla_days,
    })

    const submit = e => {
        e.preventDefault()
        put(route('admin.timer-config.update', mandate.id), {
            onSuccess: () => setEditing(false),
        })
    }

    if (!editing) {
        return (
            <tr>
                <td style={{ fontWeight: 500 }}>{mandate.title}</td>
                <td style={{ color: 'var(--ink4)', fontSize: 12 }}>{mandate.client?.company_name ?? '—'}</td>
                <td>
                    <span className="cbadge cb-sea">{mandate.timer_a_days}d</span>
                </td>
                <td>
                    {mandate.timer_b_active
                        ? <span className="cbadge cb-vio">B on · {mandate.timer_b_days}d</span>
                        : <span className="cbadge" style={{ background: 'var(--mist3)', color: 'var(--ink4)' }}>B off</span>}
                </td>
                <td>
                    {mandate.timer_c_active
                        ? <span className="cbadge cb-amb">C on · {mandate.timer_c_sla_days}d</span>
                        : <span className="cbadge" style={{ background: 'var(--mist3)', color: 'var(--ink4)' }}>C off</span>}
                </td>
                <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
                </td>
            </tr>
        )
    }

    return (
        <tr style={{ background: 'var(--sea-pale)' }}>
            <td colSpan={6} style={{ padding: '12px 16px' }}>
                <form onSubmit={submit}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ minWidth: 100 }}>
                            <label className="form-label">Timer A days</label>
                            <input className="form-input" type="number" min="1" max="30"
                                value={data.timer_a_days} onChange={e => setData('timer_a_days', +e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end', paddingBottom: 4 }}>
                            <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" checked={data.timer_b_active}
                                    onChange={e => setData('timer_b_active', e.target.checked)} />
                                Timer B
                            </label>
                            <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" checked={data.timer_c_active}
                                    onChange={e => setData('timer_c_active', e.target.checked)} />
                                Timer C
                            </label>
                        </div>
                        <div className="form-group" style={{ minWidth: 90 }}>
                            <label className="form-label">B days</label>
                            <input className="form-input" type="number" min="1" max="30"
                                value={data.timer_b_days} onChange={e => setData('timer_b_days', +e.target.value)} />
                        </div>
                        <div className="form-group" style={{ minWidth: 90 }}>
                            <label className="form-label">C SLA days</label>
                            <input className="form-input" type="number" min="1" max="30"
                                value={data.timer_c_sla_days} onChange={e => setData('timer_c_sla_days', +e.target.value)} />
                        </div>
                        <div className="form-group" style={{ minWidth: 80 }}>
                            <label className="form-label">Penalty D6</label>
                            <input className="form-input" type="number" min="0" max="1" step="0.01"
                                value={data.timer_b_penalty_d6} onChange={e => setData('timer_b_penalty_d6', +e.target.value)} />
                        </div>
                        <div className="form-group" style={{ minWidth: 80 }}>
                            <label className="form-label">Penalty D7</label>
                            <input className="form-input" type="number" min="0" max="1" step="0.01"
                                value={data.timer_b_penalty_d7} onChange={e => setData('timer_b_penalty_d7', +e.target.value)} />
                        </div>
                        <div className="form-group" style={{ minWidth: 80 }}>
                            <label className="form-label">Penalty D8+</label>
                            <input className="form-input" type="number" min="0" max="1" step="0.01"
                                value={data.timer_b_penalty_d8plus} onChange={e => setData('timer_b_penalty_d8plus', +e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end', paddingBottom: 4 }}>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={processing}>
                                {processing ? 'Saving…' : 'Save'}
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </td>
        </tr>
    )
}

export default function TimerConfig({ defaults, mandates }) {
    const { data, setData, put, processing } = useForm(defaults)

    return (
        <AdminLayout title="Timer configuration">
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                Timer configuration
            </h1>
            <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 24 }}>
                Global defaults shown below. Override per mandate in the table.
            </p>

            {/* Global defaults card */}
            <div className="dcard" style={{ maxWidth: 560, marginBottom: 24 }}>
                <div className="dcard-head"><span className="dcard-title">⏱ Global timer defaults</span></div>
                <div style={{ padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Timer A — days</label>
                            <input className="form-input" type="number" min="1" max="30" value={data.timer_a_days}
                                onChange={e => setData('timer_a_days', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timer B — days</label>
                            <input className="form-input" type="number" min="1" max="30" value={data.timer_b_days}
                                onChange={e => setData('timer_b_days', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penalty D6 (fraction)</label>
                            <input className="form-input" type="number" min="0" max="1" step="0.01" value={data.timer_b_penalty_d6}
                                onChange={e => setData('timer_b_penalty_d6', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penalty D7 (fraction)</label>
                            <input className="form-input" type="number" min="0" max="1" step="0.01" value={data.timer_b_penalty_d7}
                                onChange={e => setData('timer_b_penalty_d7', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penalty D8+ (fraction)</label>
                            <input className="form-input" type="number" min="0" max="1" step="0.01" value={data.timer_b_penalty_d8plus}
                                onChange={e => setData('timer_b_penalty_d8plus', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timer C — client SLA days</label>
                            <input className="form-input" type="number" min="1" max="30" value={data.timer_c_sla_days}
                                onChange={e => setData('timer_c_sla_days', e.target.value)} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <input type="checkbox" checked={data.timer_b_active}
                                onChange={e => setData('timer_b_active', e.target.checked)} />
                            Timer B on by default
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <input type="checkbox" checked={data.timer_c_active}
                                onChange={e => setData('timer_c_active', e.target.checked)} />
                            Timer C on by default
                        </label>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 8 }}>
                        These defaults apply to new mandates. Existing mandates keep their own config.
                    </p>
                </div>
            </div>

            {/* Per-mandate overrides */}
            {mandates?.length > 0 && (
                <div className="dcard">
                    <div className="dcard-head">
                        <span className="dcard-title">Per-mandate timer overrides</span>
                        <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{mandates.length} active roles</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    <th>Client</th>
                                    <th>Timer A</th>
                                    <th>Timer B</th>
                                    <th>Timer C</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mandates.map(m => (
                                    <MandateRow key={m.id} mandate={m} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

