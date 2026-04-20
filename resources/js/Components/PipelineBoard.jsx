import { useState } from 'react'
import {
    DndContext, DragOverlay, PointerSensor,
    useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core'
import { initials, stageColor } from '@/lib/utils'

const STAGE_LABELS = {
    pending:     'Pending',
    shortlisted: 'Shortlisted',
    interview:   'Interview',
    offer_made:  'Offer Made',
    hired:       'Hired',
    rejected:    'Rejected',
    on_hold:     'On Hold',
}

const DEFAULT_STAGES = ['pending', 'shortlisted', 'interview', 'offer_made', 'hired', 'rejected']

const CSRF = () => document.querySelector('meta[name=csrf-token]')?.content ?? ''
const scoreColor = s => s >= 80 ? 'var(--jade2)' : s >= 60 ? 'var(--amber2)' : 'var(--ruby2)'

// ── Droppable column ──────────────────────────────────────────────────────────
function DroppableCol({ id, children, isDragging }) {
    const { setNodeRef, isOver } = useDroppable({ id })
    return (
        <div ref={setNodeRef} style={{
            display: 'flex', flexDirection: 'column',
            background: isOver && isDragging ? 'var(--sea-pale)' : 'var(--mist2)',
            borderRadius: 'var(--r)',
            border: isOver && isDragging ? '1.5px solid var(--sea3)' : '1px solid var(--wire)',
            overflow: 'hidden', transition: 'background .15s, border-color .15s',
        }}>
            {children}
        </div>
    )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ sub, onClick, isDraggable }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: sub.id })
    const c = sub.candidate
    const nameParts = c ? [(c.first_name ?? ''), (c.last_name ?? '')].join(' ').trim() : '\u2014'
    const score = sub.ai_score

    const inner = (
        <div onClick={onClick} style={{
            background: '#fff', border: '1px solid var(--wire)', borderRadius: 'var(--r)',
            padding: '10px 12px', marginBottom: 6, userSelect: 'none',
            cursor: isDraggable ? 'grab' : 'pointer',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                    width: 30, height: 30, borderRadius: '50%', background: 'var(--sea-pale)',
                    color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, flexShrink: 0, border: '1px solid var(--wire)',
                }}>
                    {initials(nameParts)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameParts}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[c?.current_role, c?.current_company].filter(Boolean).join(' \xb7 ')}
                    </div>
                </div>
                {score != null && (
                    <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        border: '2px solid ' + scoreColor(score),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 600, color: scoreColor(score), flexShrink: 0,
                    }}>{score}</div>
                )}
            </div>
            {sub.admin_review_status && sub.admin_review_status !== 'approved' && (
                <div style={{ marginTop: 6 }}>
                    <span className={'badge badge-' + (sub.admin_review_status === 'rejected' ? 'ruby' : 'amber')} style={{ fontSize: 9 }}>
                        {sub.admin_review_status}
                    </span>
                </div>
            )}
        </div>
    )

    if (!isDraggable) return inner

    return (
        <div ref={setNodeRef}
            style={{ transform: transform ? 'translate(' + transform.x + 'px,' + transform.y + 'px)' : undefined, opacity: isDragging ? 0.4 : 1 }}
            {...listeners} {...attributes}
        >
            {inner}
        </div>
    )
}

// ── Side panel ────────────────────────────────────────────────────────────────
function SidePanel({ sub, onClose, stages, onMove, moving }) {
    const c = sub.candidate
    const nameParts = c ? [(c.first_name ?? ''), (c.last_name ?? '')].join(' ').trim() : '\u2014'
    const score = sub.ai_score

    return (
        <div style={{ width: 308, flexShrink: 0, background: '#fff', borderLeft: '1px solid var(--wire)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--wire)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--mist)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sea-pale)', color: 'var(--sea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, border: '1px solid var(--wire)' }}>
                        {initials(nameParts)}
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{nameParts}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>{[c?.current_role, c?.current_company].filter(Boolean).join(' @ ')}</div>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>\xd7</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                {/* Stage + move buttons */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Stage</div>
                    {onMove ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {stages.map(s => (
                                <button key={s} disabled={moving || s === sub.client_status} onClick={() => onMove(sub.id, s)}
                                    style={{
                                        fontSize: 10, padding: '4px 9px', borderRadius: 20, border: 'none',
                                        cursor: s === sub.client_status || moving ? 'default' : 'pointer',
                                        background: s === sub.client_status ? stageColor(s) : 'var(--mist3)',
                                        color: s === sub.client_status ? '#fff' : 'var(--ink3)',
                                        fontWeight: s === sub.client_status ? 600 : 400,
                                        opacity: moving && s !== sub.client_status ? 0.5 : 1,
                                    }}>
                                    {STAGE_LABELS[s] ?? s}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, color: '#fff', background: stageColor(sub.client_status) }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.6)' }} />
                            {STAGE_LABELS[sub.client_status] ?? sub.client_status}
                        </span>
                    )}
                </div>

                {score != null && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>AI Match Score</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid ' + scoreColor(score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: scoreColor(score) }}>{score}</div>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--wire)' }}>
                                <div style={{ width: score + '%', height: '100%', background: scoreColor(score), borderRadius: 3 }} />
                            </div>
                        </div>
                    </div>
                )}

                {sub.ai_summary && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>AI Summary</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, borderLeft: '3px solid var(--violet2)', background: 'var(--mist)', borderRadius: '0 var(--rsm) var(--rsm) 0', padding: '7px 10px' }}>{sub.ai_summary}</div>
                    </div>
                )}

                {(sub.green_flags?.length > 0 || sub.red_flags?.length > 0) && (
                    <div style={{ marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {sub.green_flags?.length > 0 && (
                            <div style={{ background: 'var(--jade-pale)', borderRadius: 'var(--rsm)', padding: '7px 9px' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--jade)', marginBottom: 4 }}>Strengths</div>
                                {sub.green_flags.map((f, i) => <div key={i} style={{ fontSize: 10, color: 'var(--jade)', display: 'flex', gap: 4, marginBottom: 2 }}><span>\u2713</span><span>{f}</span></div>)}
                            </div>
                        )}
                        {sub.red_flags?.length > 0 && (
                            <div style={{ background: 'var(--ruby-pale)', borderRadius: 'var(--rsm)', padding: '7px 9px' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ruby2)', marginBottom: 4 }}>Watch-outs</div>
                                {sub.red_flags.map((f, i) => <div key={i} style={{ fontSize: 10, color: 'var(--ruby2)', display: 'flex', gap: 4, marginBottom: 2 }}><span>!</span><span>{f}</span></div>)}
                            </div>
                        )}
                    </div>
                )}

                {sub.recruiter_note && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Recruiter Note</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, background: 'var(--mist)', borderRadius: 'var(--rsm)', padding: '7px 9px', border: '1px solid var(--wire)' }}>{sub.recruiter_note}</div>
                    </div>
                )}

                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Review Status</div>
                    <span className={'badge badge-' + (sub.admin_review_status === 'approved' ? 'jade' : sub.admin_review_status === 'rejected' ? 'ruby' : 'amber')}>{sub.admin_review_status}</span>
                </div>

                {sub.client_feedback && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Client Feedback</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, background: 'var(--sea-pale)', borderRadius: 'var(--rsm)', padding: '7px 9px', border: '1px solid var(--sea-soft)' }}>{sub.client_feedback}</div>
                    </div>
                )}

                {sub.interview_date && (
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', marginBottom: 6 }}>Interview</div>
                        <div style={{ fontSize: 12, color: 'var(--ink)' }}>{sub.interview_date}</div>
                        {sub.interview_format && <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{sub.interview_format}</div>}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * PipelineBoard
 * Props:
 *   submissions  array of CDD submission objects
 *   stages       optional stage array (defaults to 6 client-portal stages)
 *   moveUrl      optional POST URL { submission_id, new_stage } — enables drag-drop
 */
export default function PipelineBoard({ submissions: initialSubs = [], stages: stagesProp, moveUrl }) {
    const stages = stagesProp ?? DEFAULT_STAGES
    const isDraggable = !!moveUrl

    const [cards, setCards]      = useState(() => buildCols(stages, initialSubs))
    const [panel, setPanel]      = useState(null)
    const [activeCard, setACard] = useState(null)
    const [moving, setMoving]    = useState(false)

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

    function buildCols(stgs, subs) {
        const m = {}
        stgs.forEach(s => { m[s] = [] })
        subs.forEach(sub => {
            const st = sub.client_status ?? stgs[0]
            if (m[st] !== undefined) m[st].push(sub)
            else if (m[stgs[0]]) m[stgs[0]].push(sub)
        })
        return m
    }

    function applyMove(subId, newStage) {
        setCards(prev => {
            const all = Object.values(prev).flat()
            const updated = {}
            stages.forEach(s => { updated[s] = (prev[s] || []).filter(c => c.id !== subId) })
            const card = all.find(c => c.id === subId)
            if (card) updated[newStage] = [...(updated[newStage] || []), { ...card, client_status: newStage }]
            return updated
        })
        setPanel(p => p?.id === subId ? { ...p, client_status: newStage } : p)
    }

    async function postMove(subId, newStage) {
        setMoving(true)
        try {
            await fetch(moveUrl, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': CSRF(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ submission_id: subId, new_stage: newStage }),
            })
        } finally {
            setMoving(false)
        }
    }

    function handleMove(subId, newStage) {
        applyMove(subId, newStage)
        postMove(subId, newStage)
    }

    function handleDragEnd({ active, over }) {
        setACard(null)
        if (!over || !stages.includes(over.id)) return
        const card = Object.values(cards).flat().find(c => c.id === active.id)
        if (!card || card.client_status === over.id) return
        handleMove(card.id, over.id)
    }

    const all        = Object.values(cards).flat()
    const total      = all.length
    const topScore   = all.reduce((mx, s) => (s.ai_score ?? 0) > mx ? s.ai_score : mx, 0)
    const inProgress = (cards['shortlisted']?.length ?? 0) + (cards['interview']?.length ?? 0) + (cards['offer_made']?.length ?? 0)
    const hired      = cards['hired']?.length ?? 0

    const board = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 10, paddingBottom: 10, flexShrink: 0, alignItems: 'center' }}>
                {[['Total', total], ['Top Score', topScore || '\u2014'], ['In Progress', inProgress], ['Hired', hired]].map(([lbl, val]) => (
                    <div key={lbl} style={{ background: 'var(--mist)', border: '1px solid var(--wire)', borderRadius: 'var(--rsm)', padding: '5px 13px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{val}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 1 }}>{lbl}</div>
                    </div>
                ))}
                {isDraggable && (
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>\u21c4</span> Drag cards between columns
                    </div>
                )}
            </div>

            {/* Board + side panel */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + stages.length + ', 196px)', gap: 8, height: '100%', minHeight: 320 }}>
                        {stages.map(stage => (
                            <DroppableCol key={stage} id={stage} isDragging={!!activeCard}>
                                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--wire)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stageColor(stage), flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{STAGE_LABELS[stage] ?? stage}</span>
                                    <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink4)', background: 'var(--wire)', padding: '1px 5px', borderRadius: 10 }}>{cards[stage]?.length ?? 0}</span>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
                                    {(cards[stage] ?? []).map(sub => (
                                        <Card key={sub.id} sub={sub} isDraggable={isDraggable} onClick={() => setPanel(sub)} />
                                    ))}
                                    {(cards[stage]?.length ?? 0) === 0 && (
                                        <div style={{ padding: 10, textAlign: 'center', fontSize: 11, color: 'var(--ink4)', opacity: 0.4 }}>Empty</div>
                                    )}
                                </div>
                            </DroppableCol>
                        ))}
                    </div>
                </div>
                {panel && (
                    <SidePanel
                        sub={panel}
                        onClose={() => setPanel(null)}
                        stages={stages}
                        onMove={isDraggable ? handleMove : null}
                        moving={moving}
                    />
                )}
            </div>
        </div>
    )

    if (!isDraggable) return board

    return (
        <DndContext
            sensors={sensors}
            onDragStart={({ active }) => setACard(Object.values(cards).flat().find(c => c.id === active.id) ?? null)}
            onDragEnd={handleDragEnd}
        >
            {board}
            <DragOverlay>
                {activeCard && <Card sub={activeCard} isDraggable />}
            </DragOverlay>
        </DndContext>
    )
}
