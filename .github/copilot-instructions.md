# SeaSearch — GitHub Copilot Instructions
> File location: `.github/copilot-instructions.md`  
> Copilot reads this automatically on every suggestion in this repo.

---

## What This Project Is

SeaSearch is an AI-powered executive recruitment platform for Southeast Asia.
B2B two-sided marketplace: companies post hiring mandates, vetted recruiters pick and submit candidates, Sea Search takes a 20% platform fee on successful placements.

**Three user roles:**
- `admin` — Sea Search internal team. Full platform control.
- `recruiter` — Vetted headhunter. Picks roles, submits candidates, earns commissions.
- `client` — Hiring manager at a company. Reviews candidates via email links or portal.
- Candidates are passive — they never access the platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13 |
| Frontend | React 18 + Inertia.js (NOT a separate SPA) |
| Styling | Custom CSS variables in `app.css` — **no Tailwind classes** |
| Database | MySQL · UUID primary keys · `HasUuids` on all models |
| Auth | Google SSO via Socialite (recruiters) · Email/password (admin only) |
| AI | Claude API `claude-sonnet-4-6` — **server-side only, never in React** |
| Storage | Supabase Storage (S3-compatible) |
| Queue | Laravel Queues — `ParseCvJob` · `SyncGSheetJob` · `SendClientEmailJob` |
| Payments | Stripe Connect |
| Email | Resend via Laravel Mail |

---

## Prototype HTML Reference (docs/sample-html/)

**Before writing any UI code, open the relevant HTML file.**
These are fully working visual prototypes — the source of truth for all UI patterns, CSS classes, colors, and layout structure.

| File | Screen |
|------|--------|
| `00_platform-shell.html` | Master navigation shell — dark sidebar, topbar, iframe nav |
| `01_recruiter-dashboard.html` | Recruiter dashboard — hero band, stat cards, active roles, leaderboard, chart |
| `02_job-listings.html` | Job board — 8 filter tabs, role cards, reward panels, pick confirmation |
| `03_role-workspace.html` | Role workspace — JD, flags, Q&A, AI matching, premium upsell |
| `04_candidate-profiles.html` | Candidate profiles — CV upload banner, AI processing overlay, 4 tabs, score ring |
| `05_kanban-pipeline.html` | Kanban — drag-drop columns, side panel, rejection modal, add candidate modal |
| `06_client-portal.html` | Client portal — 6 screens, approve/reject/info modals, paper design system |
| `07_gap-fills-pick-submit-placement.html` | Pick confirmation, submit profile, placement confirmed, dashboard |
| `08_pick-confirmation.html` | Pick confirmation modal standalone |
| `design-system-sample.html` | All CSS tokens, components, and UI patterns in one reference page |

**Workflow when building UI:**
1. Open the matching HTML file in `docs/sample-html/`
2. Identify the CSS classes and token names used
3. Translate to React JSX — same structure, same tokens, no deviation

---

## Documentation (docs/)

Read the relevant doc before writing feature code.

| File | Read when |
|------|-----------|
| `00_INDEX.md` | Start here — build order, golden rules |
| `01_TECH_STACK.md` | Project structure, conventions, all dependencies |
| `02_DATABASE_SCHEMA.md` | Full SQL schema — all tables, columns, indexes |
| `03_DESIGN_SYSTEM.md` | **Any UI work** — tokens, components, layout, utils |
| `04_ARCHITECTURE.md` | Routes, middleware, Inertia patterns |
| `05_AUTH_ONBOARDING.md` | SSO, profile, all model relationships and scopes |
| `06_to_09_FEATURES_*.md` | Mandates, CDD submission (legacy combined file) |
| `07_FEATURE_CANDIDATES.md` | Candidate model, controller, CV upload, 4-tab React page |
| `09_FEATURE_TIMERS.md` | Timer A/B/C engine, SlotService, cron |
| `10_to_15_FEATURES_*.md` | GSheet, kanban, commission (legacy combined file) |
| `11_FEATURE_CLIENT_PORTAL.md` | Client layout, 6 screens, 3 modals, tokenized feedback |
| `12_FEATURE_KANBAN.md` | Kanban columns, side panel, all modals, submit-to-client |
| `13_FEATURE_COMMISSION.md` | Formula engine, EarningsController, Stripe payout |
| `14_FEATURE_ADMIN.md` | Admin panel, report templates, analytics |
| `15_FEATURE_NOTIFICATIONS.md` | NotificationService, daily digest |
| `16_AI_CLAUDE.md` | All 5 Claude prompts — parse, score, brief, outreach, questions |
| `17_API_REFERENCE.md` | Every route, request body, validation rules |
| `18_AI_VIBE_CODING_CONTEXT.md` | **Master AI context** — prepend to any Claude/GPT coding prompt |

> When old combined file (`06_to_09_`, `10_to_15_`) conflicts with a newer individual file, always use the newer individual file.

---

## Design System — Non-Negotiable

### Never hardcode colors. Always use CSS variables.

```css
/* ✅ correct */
color: var(--sea2);
background: var(--mist2);
border: 1px solid var(--wire);

/* ❌ wrong */
color: #1A6DB5;
background: #F2F0EC;
```

### Full token list

```
/* Ink (dark neutrals) */
--ink:    #0D0C0A   dark text, sidebar bg
--ink2:   #2A2926   sidebar dividers
--ink3:   #454340   muted labels in dark zones
--ink4:   #6B6860   secondary text in light zones

/* Mist (light neutrals) */
--mist:   #F9F8F5   card backgrounds
--mist2:  #F2F0EC   page background
--mist3:  #E8E5DF   hover states
--mist4:  #D4D0C8   disabled, sidebar text

/* Wire (borders) */
--wire:   #E0DDD6   default borders
--wire2:  #C8C4BC   stronger borders

/* Sea (primary blue) */
--sea:    #0B4F8A   active nav, brand
--sea2:   #1A6DB5   primary buttons, links
--sea3:   #3589D4   accents, chart color
--sea-pale:#E8F2FB  chip backgrounds
--sea-soft:#C5DFF5  chip borders

/* Jade (success/green) */
--jade:   #1A4D1E   strong success text
--jade2:  #2E7D33   badges, hired stage
--jade3:  #4CAF52   sidebar earnings number
--jade-pale: #EAF4EB

/* Amber (warning/orange) */
--amber2: #B85C1A   warning badges, screened stage
--amber-pale: #FDF0E8

/* Ruby (error/red) */
--ruby2:  #B52525   error badges, rejected
--ruby-pale: #FBE8E8

/* Violet (AI/purple) */
--violet2: #4B3AA8  AI accent, offered stage
--violet-pale: #EEE9FB

/* Gold (exclusive/premium) */
--gold2:  #C49A00   exclusive badges
--gold-pale: #FDF8E1

/* Fonts */
--font-head: 'Syne', sans-serif      headings, hero numbers
--font:      'DM Sans', sans-serif   body text
--mono:      'DM Mono', monospace    badges, timestamps, numbers

/* Layout */
--sidebar: 230px
--topbar:  56px
--r:    12px   card border-radius
--rsm:  7px    input border-radius
--rxs:  4px    chip border-radius
```

### Layout rules

- **Shell:** dark ink sidebar (230px) + dark topbar (56px) + light mist content area
- **No dark mode toggle** — fixed dual-zone design
- **Desktop only** — no mobile breakpoints (min ~1200px)
- **Cards:** `border: 1px solid var(--wire)` — **no box-shadow ever**
- **Stat cards:** always have a 3px top accent bar:
  ```css
  position: absolute; top: 0; left: 0; right: 0; height: 3px; background: {accentColor};
  ```

### CSS classes (defined in app.css — do not recreate)

```
.btn .btn-primary .btn-secondary .btn-ghost .btn-sm .btn-danger .btn-success
.badge .badge-sea .badge-jade .badge-amber .badge-ruby .badge-violet .badge-gold
.cbadge .cb-sea .cb-jade .cb-amb .cb-vio .cb-rub .cb-gld
.dcard .dcard-head .dcard-title .dcard-ghost-btn
.sblock .sblock-head .sblock-body
.sbi .sbi.on .sbi-ico .sbi-lbl .sbadge .sbadge-a .sbadge-r
.sm .sm-bar .sm-num .sm-lbl
.table-wrap table thead th tbody td
.form-input .form-label .form-error .form-group
.stat-row   → grid repeat(4,1fr) gap:10px
.g21        → grid 1fr 340px gap:14px
.g3         → grid 1fr 1fr 1fr gap:14px
```

### Client portal — separate design system

```
--paper:  #FAFAF8   page bg
--paper2: #F4F3F0   secondary bg
--line:   #D8D5CF   borders
Font:     'Instrument Serif' for display headings (not Syne)
Accent:   configurable per client → clients.accent_color
```

### Kanban stage colors

```js
sourced:   'var(--mist4)'
screened:  'var(--amber2)'
interview: 'var(--sea2)'
offered:   'var(--violet2)'
hired:     'var(--jade2)'
rejected:  'var(--ruby2)'
```

---

## Laravel + Inertia Patterns

### Forms — always useForm, never raw fetch for mutations

```jsx
// ✅
import { useForm } from '@inertiajs/react'
const { data, setData, post, processing, errors } = useForm({ name: '' })
<form onSubmit={e => { e.preventDefault(); post(route('recruiter.candidates.store')) }}>

// ❌ never
fetch('/recruiter/candidates', { method: 'POST', body: formData })
```

### Props — all data from controller via Inertia::render

```php
// Controller
return Inertia::render('Recruiter/Dashboard', [
    'recruiter' => RecruiterResource::make($recruiter),
    'stats'     => $stats,
]);
```
```jsx
// Page component
export default function Dashboard({ recruiter, stats }) { ... }
```

### Thin controllers — business logic in Services

```php
// ✅ controller delegates to service
public function approve(MandateClaim $claim) {
    $this->claimService->approve($claim, auth()->user());
    return redirect()->back()->with('success', 'Approved.');
}
```

### Queue heavy operations

```php
ParseCvJob::dispatch($candidate, $mandateId)->onQueue('ai');
SyncGSheetJob::dispatch($submission, 'add_row')->onQueue('sheets');
SendClientEmailJob::dispatch($submission)->onQueue('email');
```

### CSRF for fetch (AI endpoints only)

```js
headers: {
    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
    'Content-Type': 'application/json',
}
```

### Flash messages (auto-handled by FlashMessages component)

```php
return redirect()->back()->with('success', 'Done.');
return redirect()->back()->with('error', 'Failed.');
```

### Shared props (always available via HandleInertiaRequests)

```js
usePage().props.auth.user          // { id, name, email, role }
usePage().props.auth.recruiter     // { id, tier, trust_level, active_mandates_count }
usePage().props.flash              // { success, error }
usePage().props.unread_notifications // integer
```

---

## Core Business Rules

1. **Max 2 active mandates per recruiter** — `active_mandates_count < 2` before allowing pick
2. **Admin approves recruiter claim** — `mandate_claims.status = approved` before Day 0
3. **Admin approves CDD** before client sees it — UNLESS exception:
   - `recruiter.trust_level = 'trusted'` OR `mandate.is_fast_track = true`
4. **Max 2 CDD rejections** — 2nd rejection = slot burned, recruiter must source new candidate
5. **Day 0 = `claim.assigned_at`** — Timer A starts immediately
6. **Timer B and Timer C default OFF** — admin configures per mandate
7. **Client feedback = tokenized one-time link** — never email reply parsing
8. **GSheet auto-updates via Google Sheets API** — never manual resend
9. **Commission penalty only if Timer B active** — Day 6: −10%, Day 7: −20%, Day 8+: −30%
10. **3 Timer A failures = role DROPPED** — `mandate.assignment_count` max 3
11. **Client NOT auto-notified on unclaimed roles** — admin sends report via template manually
12. **No auto-assign when all at capacity** — admin assigns manually
13. **Timer state is always computed** — never store `is_overdue` as boolean

---

## Shared Utilities (always import, never redefine)

```js
import { initials, fmt, fmtCurrency, fmtDate, fmtRelative, stageColor } from '@/lib/utils'

initials('John Smith')      // → 'JS'
fmt(12500)                  // → '12.5k'
fmtCurrency(5000, 'SGD')   // → 'SGD 5,000'
fmtDate('2026-04-20')      // → '20 Apr 2026'
fmtRelative('2026-04-20')  // → '2h ago'
stageColor('hired')         // → 'var(--jade2)'
```

---

## Key Services

```
ClaudeService           parseCV() · scoreCandidate() · generateBrief() · draftOutreach() · generateInterviewQuestions()
GoogleSheetsService     createClientSheet() · createMandateTab() · addCddRow() · updateStatusCell()
TimerService            checkTimerA() · checkTimerB() · checkTimerC() · calculatePenalty() · checkAndFreeSlot()
CommissionService       calculate() · settle()
NotificationService     (all event types — see 15_FEATURE_NOTIFICATIONS.md)
TokenService            generate() · validate() · markUsed()
ExceptionService        shouldBypass(recruiter, mandate) → bool
SlotService             checkAndFreeSlot() · adminFreeSlot()
```

---

## Route Names

```
admin.dashboard
admin.mandates.index|store|show|update|publish|pause|close|reassign
admin.claims.index|approve|reject
admin.submissions.index|approve|reject
admin.clients.index|store|show|update|send-gsheet
admin.recruiters.index|show|approve|suspend|set-tier|set-trust|set-group
admin.compensation-types.index|store|update|destroy
admin.exception-rules.index|store|toggle|destroy
admin.timer-config.index|update
admin.report-templates.index|store|update|destroy|send|preview
admin.analytics.index

recruiter.dashboard
recruiter.mandates.index|show|pick|workspace
recruiter.candidates.index|show|store|update|upload-cv|save-note|cv
recruiter.submissions.store|update
recruiter.kanban.show|move|schedule-interview|save-client-feedback|submit-to-client|reject|add-candidate
recruiter.earnings.index|payout-request
recruiter.ai.brief|outreach|questions|matching
recruiter.notifications.index|read|read-all

client.portal.index|messages.send|notifications.read-all|submissions.update-status

feedback.show|update         ← public, no auth required
auth.google                  ← SSO redirect
login|logout
profile.complete|profile.complete.store|profile.skip
```

---

## Database Quick Reference

```
users               role: super_admin|admin|recruiter|client · status: active|pending|suspended
recruiters          tier: junior|senior|elite · trust_level: standard|trusted · active_mandates_count ≤ 2
clients             gsheet_id · gsheet_url · accent_color
mandates            status: draft|active|paused|closed|filled|dropped · assignment_count ≤ 3
                    timer_a_days · timer_b_active(bool,default:false) · timer_c_active(bool,default:false)
                    compensation_type_id · is_fast_track
mandate_claims      status: pending|approved|rejected · assigned_at = Day 0
cdd_submissions     admin_review_status: pending|approved|rejected|bypassed
                    client_status: pending|shortlisted|interview|offer_made|hired|rejected|on_hold
                    token (one-time) · exception_bypass · submission_number 1-3
placements          gross_reward · platform_fee · net_payout · penalty_amount · final_payout
compensation_types  formula_type: percentage|hourly|fixed|milestone · formula_fields: JSONB
exception_rules     rule_type: recruiter_trust|role_type|both · is_active(default:false)
report_templates    type: unclaimed_role|role_dropped|role_update|general
```

---

## Environment Variables

```env
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=${APP_URL}/auth/google/callback
GOOGLE_SHEETS_CREDENTIALS=    # path to service account JSON
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
RESEND_KEY=
MAIL_FROM_ADDRESS=hello@seasearch.asia
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=seasearch-files
AWS_ENDPOINT=                 # Supabase S3-compatible endpoint
```

---

## Build Order

| # | Task |
|---|------|
| 1 | Run migrations (FK-safe order in `05_AUTH_ONBOARDING.md §6`) |
| 2 | Run seeder — admin user + compensation types + exception rule |
| 3 | Google SSO + login page + profile completion |
| 4 | Admin: mandate CRUD + client CRUD + recruiter management |
| 5 | Job board + pick flow + admin claim approval queue |
| 6 | Candidate profiles + CV upload + AI parsing |
| 7 | Role workspace + CDD submission + admin review queue |
| 8 | GSheet integration + tokenized client feedback |
| 9 | Kanban pipeline |
| 10 | Timer engine + cron scheduler |
| 11 | Earnings + payout centre |
| 12 | Notifications hub + daily digest |
| 13 | Client portal auth (Stage 4 — deferred, build last) |
