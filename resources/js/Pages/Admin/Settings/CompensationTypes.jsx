import AdminLayout from '@/Layouts/AdminLayout'
import { useForm, router } from '@inertiajs/react'
import { useState } from 'react'

export default function CompensationTypes({ compensationTypes }) {
    const [editId, setEditId] = useState(null)
    const [showNew, setShowNew] = useState(false)

    const newForm = useForm({
        name: '', formula_type: 'percentage', trigger_condition: 'on_hire',
        platform_fee_pct: 0.2, notes: '',
    })

    const editForm = useForm({
        name: '', trigger_condition: 'on_hire', platform_fee_pct: 0.2, is_active: true, notes: '',
    })

    function startEdit(ct) {
        setEditId(ct.id)
        editForm.setData({ name: ct.name, trigger_condition: ct.trigger_condition, platform_fee_pct: ct.platform_fee_pct, is_active: ct.is_active, notes: ct.notes ?? '' })
    }

    return (
        <AdminLayout title="Compensation types">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Compensation types</h1>
                <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>{showNew ? 'Cancel' : '+ New type'}</button>
            </div>

            {showNew && (
                <div className="dcard" style={{ marginBottom: 20 }}>
                    <div className="dcard-head"><span className="dcard-title">New compensation type</span></div>
                    <form onSubmit={e => { e.preventDefault(); newForm.post(route('admin.compensation-types.store'), { onSuccess: () => { setShowNew(false); newForm.reset() } }) }} style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={newForm.data.name} onChange={e => newForm.setData('name', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Formula type</label>
                            <select className="form-input" value={newForm.data.formula_type} onChange={e => newForm.setData('formula_type', e.target.value)}>
                                <option value="percentage">Percentage</option><option value="hourly">Hourly</option><option value="fixed">Fixed</option><option value="milestone">Milestone</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Trigger</label><input className="form-input" value={newForm.data.trigger_condition} onChange={e => newForm.setData('trigger_condition', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Platform fee (e.g. 0.20 = 20%)</label><input className="form-input" type="number" step="0.01" min="0" max="1" value={newForm.data.platform_fee_pct} onChange={e => newForm.setData('platform_fee_pct', e.target.value)} /></div>
                        <div style={{ gridColumn: '1/-1' }}><button type="submit" className="btn btn-primary" disabled={newForm.processing}>Create</button></div>
                    </form>
                </div>
            )}

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>Type</th><th>Trigger</th><th>Platform fee</th><th>Active</th><th></th></tr></thead>
                    <tbody>
                        {compensationTypes.map(ct => (
                            <tr key={ct.id}>
                                {editId === ct.id ? (
                                    <>
                                        <td><input className="form-input" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} style={{ width: 140 }} /></td>
                                        <td style={{ color: 'var(--ink4)', fontFamily: 'var(--mono)', fontSize: 11 }}>{ct.formula_type}</td>
                                        <td><input className="form-input" value={editForm.data.trigger_condition} onChange={e => editForm.setData('trigger_condition', e.target.value)} style={{ width: 120 }} /></td>
                                        <td><input className="form-input" type="number" step="0.01" min="0" max="1" value={editForm.data.platform_fee_pct} onChange={e => editForm.setData('platform_fee_pct', e.target.value)} style={{ width: 80 }} /></td>
                                        <td><input type="checkbox" checked={editForm.data.is_active} onChange={e => editForm.setData('is_active', e.target.checked)} /></td>
                                        <td style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-success btn-sm" onClick={() => editForm.put(route('admin.compensation-types.update', ct.id), { onSuccess: () => setEditId(null) })}>Save</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{ fontWeight: 500 }}>{ct.name}</td>
                                        <td><span className="cbadge cb-sea">{ct.formula_type}</span></td>
                                        <td style={{ color: 'var(--ink4)', fontSize: 11 }}>{ct.trigger_condition}</td>
                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{(ct.platform_fee_pct * 100).toFixed(0)}%</td>
                                        <td><span className={`badge ${ct.is_active ? 'badge-jade' : 'badge-ruby'}`} style={{ fontSize: 9 }}>{ct.is_active ? 'active' : 'inactive'}</span></td>
                                        <td style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => startEdit(ct)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete?')) router.delete(route('admin.compensation-types.destroy', ct.id)) }}>×</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}
