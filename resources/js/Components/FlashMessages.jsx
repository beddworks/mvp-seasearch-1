import { usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'

export default function FlashMessages() {
    const { flash } = usePage().props
    const [visible, setVisible] = useState({ success: !!flash?.success, error: !!flash?.error })

    // Reset visibility when flash changes (navigations)
    useEffect(() => {
        setVisible({ success: !!flash?.success, error: !!flash?.error })
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setVisible({ success: false, error: false }), 4000)
            return () => clearTimeout(t)
        }
    }, [flash?.success, flash?.error])

    if (!visible.success && !visible.error) return null

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
            {visible.success && flash?.success && (
                <div className="flash-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <span>{flash.success}</span>
                    <button onClick={() => setVisible(v => ({ ...v, success: false }))}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</button>
                </div>
            )}
            {visible.error && flash?.error && (
                <div className="flash-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <span>{flash.error}</span>
                    <button onClick={() => setVisible(v => ({ ...v, error: false }))}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</button>
                </div>
            )}
        </div>
    )
}
