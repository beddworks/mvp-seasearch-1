import { useForm, router } from '@inertiajs/react'

const INDUSTRIES = [
    'Technology', 'Finance & Banking', 'Healthcare', 'FMCG',
    'Consulting', 'Real Estate', 'Supply Chain', 'Legal',
]
const GEOS = [
    'Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Regional SEA',
]

export default function ProfileComplete({ recruiter }) {
    const { data, setData, post, processing, errors } = useForm({
        display_name:      recruiter.display_name || '',
        phone:             recruiter.phone || '',
        linkedin_url:      recruiter.linkedin_url || '',
        years_experience:  recruiter.years_experience || '',
        current_firm:      recruiter.current_firm || '',
        bio:               recruiter.bio || '',
        ea_license_number: recruiter.ea_license_number || '',
        ea_certificate:    null,
        industries:        recruiter.industries || [],
        geographies:       recruiter.geographies || [],
        specialty:         recruiter.specialty || '',
    })

    function toggleArr(field, value) {
        setData(field, data[field].includes(value)
            ? data[field].filter(v => v !== value)
            : [...data[field], value])
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--mist2)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
            {/* Topbar */}
            <div style={{ height: 'var(--topbar)', background: 'var(--ink)', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--ink2)', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    Sea<span style={{ color: 'var(--sea3)' }}>Search</span>
                </span>
            </div>

            <div style={{ maxWidth: 640, margin: '32px auto', width: '100%', padding: '0 20px' }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
                        Complete your profile
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--ink4)', marginTop: 4 }}>
                        Help clients and admin know who you are. You can skip this and complete later.
                    </p>
                </div>

                <form
                    onSubmit={e => { e.preventDefault(); post(route('profile.complete.store')) }}
                    encType="multipart/form-data"
                >
                    {/* Basic info */}
                    <div className="dcard" style={{ marginBottom: 16 }}>
                        <div className="dcard-head">
                            <span className="dcard-title">Basic info</span>
                        </div>
                        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Display name</label>
                                <input className="form-input" value={data.display_name}
                                    onChange={e => setData('display_name', e.target.value)} />
                                {errors.display_name && <p className="form-error">{errors.display_name}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={data.phone}
                                    onChange={e => setData('phone', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">LinkedIn URL</label>
                                <input className="form-input" type="url" value={data.linkedin_url}
                                    onChange={e => setData('linkedin_url', e.target.value)} />
                                {errors.linkedin_url && <p className="form-error">{errors.linkedin_url}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Years of experience</label>
                                <input className="form-input" type="number" min="0" max="50"
                                    value={data.years_experience}
                                    onChange={e => setData('years_experience', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current firm</label>
                                <input className="form-input" value={data.current_firm}
                                    onChange={e => setData('current_firm', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">
                                    Bio <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(shown to clients)</span>
                                </label>
                                <textarea className="form-input" rows={3} value={data.bio}
                                    onChange={e => setData('bio', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* EA License */}
                    <div className="dcard" style={{ marginBottom: 16 }}>
                        <div className="dcard-head">
                            <span className="dcard-title">EA License <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(Singapore)</span></span>
                        </div>
                        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">EA License number</label>
                                <input className="form-input" value={data.ea_license_number}
                                    onChange={e => setData('ea_license_number', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">EA Certificate (PDF, max 5 MB)</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setData('ea_certificate', e.target.files[0])}
                                    style={{ fontSize: 12, color: 'var(--ink4)' }}
                                />
                                {errors.ea_certificate && <p className="form-error">{errors.ea_certificate}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Specialty & focus */}
                    <div className="dcard" style={{ marginBottom: 24 }}>
                        <div className="dcard-head">
                            <span className="dcard-title">Specialty & focus</span>
                        </div>
                        <div style={{ padding: '14px 16px' }}>
                            <div className="form-group">
                                <label className="form-label">Primary specialty</label>
                                <input className="form-input"
                                    placeholder="e.g. CHRO / HR leadership in banking"
                                    value={data.specialty}
                                    onChange={e => setData('specialty', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Industries</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    {INDUSTRIES.map(ind => (
                                        <button
                                            key={ind}
                                            type="button"
                                            className={data.industries.includes(ind) ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                                            onClick={() => toggleArr('industries', ind)}
                                        >
                                            {ind}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Geographic focus</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    {GEOS.map(geo => (
                                        <button
                                            key={geo}
                                            type="button"
                                            className={data.geographies.includes(geo) ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                                            onClick={() => toggleArr('geographies', geo)}
                                        >
                                            {geo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn btn-primary" disabled={processing}>
                            {processing ? 'Saving…' : 'Save profile'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => router.post(route('profile.skip'))}
                        >
                            Skip for now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
