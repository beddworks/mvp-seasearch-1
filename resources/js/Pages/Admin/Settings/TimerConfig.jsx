import AdminLayout from '@/Layouts/AdminLayout'
import { useForm } from '@inertiajs/react'

export default function TimerConfig({ defaults }) {
    const { data, setData, put, processing } = useForm(defaults)

    return (
        <AdminLayout title="Timer configuration">
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Timer configuration</h1>
            <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 24 }}>
                These are reference defaults. Timers are configured per mandate when creating or editing.
            </p>

            <div className="dcard" style={{ maxWidth: 560 }}>
                <div className="dcard-head"><span className="dcard-title">⏱ Default timer settings</span></div>
                <form onSubmit={e => { e.preventDefault(); put(route('admin.timer-config.update')) }} style={{ padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Timer A — days to submit CDD</label>
                            <input className="form-input" type="number" min="1" max="30" value={data.timer_a_days} onChange={e => setData('timer_a_days', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timer B — days to placement</label>
                            <input className="form-input" type="number" min="1" max="30" value={data.timer_b_days} onChange={e => setData('timer_b_days', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penalty D6 (%)</label>
                            <input className="form-input" type="number" min="0" max="100" value={data.timer_b_penalty_d6} onChange={e => setData('timer_b_penalty_d6', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penalty D7 (%)</label>
                            <input className="form-input" type="number" min="0" max="100" value={data.timer_b_penalty_d7} onChange={e => setData('timer_b_penalty_d7', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Penalty D8+ (%)</label>
                            <input className="form-input" type="number" min="0" max="100" value={data.timer_b_penalty_d8plus} onChange={e => setData('timer_b_penalty_d8plus', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timer C — client SLA days</label>
                            <input className="form-input" type="number" min="1" max="30" value={data.timer_c_sla_days} onChange={e => setData('timer_c_sla_days', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <input type="checkbox" checked={data.timer_b_active} onChange={e => setData('timer_b_active', e.target.checked)} />
                            Timer B active by default
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <input type="checkbox" checked={data.timer_c_active} onChange={e => setData('timer_c_active', e.target.checked)} />
                            Timer C active by default
                        </label>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <button type="submit" className="btn btn-primary" disabled={processing}>
                            {processing ? 'Saving…' : 'Save defaults'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    )
}
