/**
 * SeaSearch shared utilities
 * Always import from here — never redefine.
 */

/** Get initials from a full name */
export function initials(name) {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/** Format a number as compact string: 12500 → "12.5k" */
export function fmt(n) {
    if (n == null) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
    return String(n)
}

/** Format currency: fmtCurrency(5000, 'SGD') → "SGD 5,000" */
export function fmtCurrency(amount, currency = 'SGD') {
    if (amount == null) return '—'
    return `${currency} ${Number(amount).toLocaleString()}`
}

/** Format ISO date string: fmtDate('2026-04-20') → "20 Apr 2026" */
export function fmtDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

/** Relative time: fmtRelative('2026-04-20T10:00:00Z') → "2h ago" */
export function fmtRelative(dateStr) {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    if (mins < 1)   return 'just now'
    if (mins < 60)  return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

/** Return CSS variable string for a kanban stage */
export function stageColor(stage) {
    const map = {
        // Recruiter kanban stages
        sourced:    'var(--mist4)',
        screened:   'var(--amber2)',
        offered:    'var(--violet2)',
        // Client-portal / shared stages
        pending:    'var(--mist4)',
        shortlisted:'var(--amber2)',
        interview:  'var(--sea2)',
        offer_made: 'var(--violet2)',
        on_hold:    'var(--ink4)',
        // Shared
        hired:     'var(--jade2)',
        rejected:  'var(--ruby2)',
    }
    return map[stage] ?? 'var(--ink4)'
}
