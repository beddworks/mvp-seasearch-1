# 18 — AI Vibe Coding Master Context
> SeaSearch PRD · v2.0  
> PREPEND THIS ENTIRE BLOCK TO ANY AI CODING PROMPT. No exceptions.

---

```
=== SEASEARCH — MASTER CODING CONTEXT v2.0 ===

WHAT IS THIS APP:
SeaSearch is an AI-powered executive recruitment platform for Southeast Asia.
B2B two-sided marketplace: companies post mandates, vetted recruiters pick and submit candidates, Sea Search takes a 20% platform fee on successful placements.

WHO THE USERS ARE:
1. Admin (Sea Search team) — full control, approves everything, manages CRUD
2. Recruiter (vetted headhunter) — picks roles, submits candidates, earns commissions
3. Client (hiring manager) — reviews submitted candidates via email links or portal
4. Candidate — passive, never accesses the platform

TECH STACK:
- Backend: Laravel 13
- Frontend: React 18 + Inertia.js (NOT a separate SPA)
- Styling: Custom CSS with CSS variables in app.css — DO NOT use Tailwind classes
- DB: MySQL, UUID primary keys, HasUuids trait on all models
- AI: Claude API claude-sonnet-4-6 — server-side ONLY, never in React
- Storage: Supabase Storage (S3-compatible)
- Queue: Laravel Queues — ParseCvJob, SyncGSheetJob, SendClientEmailJob
- Auth: Google SSO (Socialite) for recruiters, email/password for admins only
- Roles: users.role enum: super_admin | admin | recruiter | client

INERTIA RULES:
- All forms: useForm from @inertiajs/react — never raw fetch for mutations
- All data comes as props from Inertia::render() in controller
- Flash messages from usePage().props.flash.success / .error
- route() helper available in JS for named routes
- Shared props always available: auth.user, auth.recruiter, flash, unread_notifications
- CSRF token for fetch calls: document.querySelector('meta[name=csrf-token]').content

LARAVEL RULES:
- Controllers are thin — business logic in Services
- Services: ClaudeService, GoogleSheetsService, TimerService, CommissionService,
  NotificationService, TokenService, SlotService, ExceptionService
- All heavy work queued: ParseCvJob (AI), SyncGSheetJob (GSheet), SendClientEmailJob (email)
- Route middleware: role:admin, role:recruiter, role:client
- Route names: admin.dashboard, admin.claims.approve, recruiter.mandates.pick,
  recruiter.kanban.move, recruiter.submissions.store, recruiter.ai.brief, feedback.update

DESIGN SYSTEM (CRITICAL — use CSS variables ONLY):
CSS custom properties in app.css :root:
  --ink: #0D0C0A    --ink2: #2A2926   --ink3: #454340   --ink4: #6B6860
  --mist: #F9F8F5   --mist2: #F2F0EC  --mist3: #E8E5DF  --mist4: #D4D0C8
  --wire: #E0DDD6   --wire2: #C8C4BC
  --sea: #0B4F8A    --sea2: #1A6DB5   --sea3: #3589D4   --sea-pale: #E8F2FB
  --jade: #1A4D1E   --jade2: #2E7D33  --jade3: #4CAF52  --jade-pale: #EAF4EB
  --amber: #7A3B0A  --amber2: #B85C1A --amber3: #E07C3A --amber-pale: #FDF0E8
  --ruby: #7A1A1A   --ruby2: #B52525  --ruby-pale: #FBE8E8
  --violet: #2D1F6E --violet2: #4B3AA8 --violet-pale: #EEE9FB
  --gold: #6B4F00   --gold2: #C49A00  --gold-pale: #FDF8E1
  --font-head: 'Syne', sans-serif    --font: 'DM Sans', sans-serif
  --mono: 'DM Mono', monospace
  --sidebar: 230px  --topbar: 56px  --r: 12px  --rsm: 7px  --rxs: 4px

LAYOUT: Dark ink sidebar (230px) + dark topbar (56px) + light mist content.
No dark mode. Desktop only (~1200px min). No box-shadow — use border: 1px solid var(--wire).
Every stat card has: position:absolute; top:0; left:0; right:0; height:3px; background:{accent}

CSS CLASSES:
.btn .btn-primary .btn-secondary .btn-ghost .btn-sm .btn-danger .btn-success
.badge .badge-sea .badge-jade .badge-amber .badge-ruby .badge-violet .badge-gold
.cbadge .cb-sea .cb-jade .cb-amb .cb-vio .cb-rub .cb-gld
.dcard .dcard-head .dcard-title .dcard-ghost-btn
.sblock .sblock-head .sblock-body
.sbi .sbi.on .sbi-ico .sbi-lbl .sbadge .sbadge-a .sbadge-r
.sm .sm-bar .sm-num .sm-lbl
.table-wrap table thead th tbody td
.form-input .form-label .form-error .form-group
.stat-row (grid repeat-4 gap-10) .g21 (grid 1fr 340px) .g3 (grid 1fr 1fr 1fr)

CLIENT PORTAL uses: --paper:#FAFAF8 --paper2:#F4F3F0 --line:#D8D5CF
  Instrument Serif display font. Accent color configurable per client.

SHARED UTILITIES (resources/js/lib/utils.js — always import, never redefine):
  initials(name)        → "John Smith" → "JS"
  fmt(n)               → 12500 → "12.5k"
  fmtCurrency(n, cur)  → 5000 → "SGD 5,000"
  fmtDate(ts)          → ISO → "15 Apr 2026"
  fmtRelative(ts)      → ISO → "2h ago"
  stageColor(stage)    → 'hired' → 'var(--jade2)'

STAGE COLORS:
  sourced: var(--mist4)  screened: var(--amber2)  interview: var(--sea2)
  offered: var(--violet2) hired: var(--jade2)  rejected: var(--ruby2)

KEY DATABASE TABLES:
  users (id, name, email, google_id, role, status)
  recruiters (user_id, tier:junior|senior|elite, trust_level:standard|trusted,
              recruiter_group, active_mandates_count ≤ 2, profile_complete)
  clients (contact_email, gsheet_id, gsheet_url, accent_color)
  mandates (client_id, status:draft|active|paused|closed|filled|dropped,
            timer_a_days, timer_b_active:bool, timer_c_active:bool,
            is_fast_track, compensation_type_id, assignment_count ≤ 3)
  mandate_claims (mandate_id, recruiter_id,
                  status:pending|approved|rejected|withdrawn, assigned_at=Day0)
  candidates (recruiter_id, cv_url, parsed_profile:JSONB, cv_parsed_at)
  cdd_submissions (mandate_id, recruiter_id, candidate_id,
                   admin_review_status:pending|approved|rejected|bypassed,
                   client_status:pending|shortlisted|interview|offer_made|hired|rejected|on_hold,
                   token, exception_bypass:bool, submission_number 1-3)
  placements (cdd_submission_id, gross_reward, platform_fee, net_payout,
              penalty_amount, final_payout, payout_status)
  compensation_types (name, formula_type:percentage|hourly|fixed|milestone,
                      formula_fields:JSONB, trigger_condition, platform_fee_pct)
  exception_rules (rule_type, trust_level, role_type, is_active)
  notifications (user_id, type, title, body, action_url, is_read)
  report_templates (name, type, subject, body, variables[])

UNBREAKABLE BUSINESS RULES:
1. Recruiter MAX 2 active mandates (active_mandates_count < 2 to pick)
2. Admin MUST approve recruiter claim before Day 0 starts (mandate_claims.status=approved)
3. Admin MUST approve CDD before client sees it — UNLESS exception rule applies:
   (recruiter.trust_level='trusted' OR mandate.is_fast_track=true)
4. Max 2 admin CDD rejections per submission — 2nd = slot burned
5. Day 0 = claim.assigned_at — Timer A always ON (default 3 days first profile)
6. Timer B (full 3 profiles deadline) and Timer C (capacity lock) default OFF
   Admin configures per mandate via CRUD
7. Client feedback = tokenized link-click only — NOT email reply parsing
8. GSheet auto-updates via Google Sheets API — admin does NOT manually resend
9. Commission penalty only applies when Timer B is active
   Scaled: Day6=−10%, Day7=−20%, Day8+=−30%
10. After 3 Timer A failures = role DROPPED (client notified via admin report template)
11. Client NOT auto-notified on unclaimed roles — admin sends report manually
12. Edge Case B (all at capacity) = NO auto-assign — admin manually assigns
13. Compensation = CRUD formula engine (percentage/hourly/fixed/milestone)
    Platform fee default 20%, tier modifier: senior+5%, elite+10%
14. Exception rules managed by admin only — full audit log on every change

SERVICES TO USE:
  ClaudeService::parseCV(text) → array
  ClaudeService::scoreCandidate(profile, mandate) → array{overall_score, breakdown, green_flags, red_flags, summary}
  ClaudeService::generateBrief(submission) → string
  ClaudeService::draftOutreach(candidate, mandate) → array{subject, body}
  ClaudeService::generateInterviewQuestions(submission) → array
  GoogleSheetsService::createClientSheet(client) → spreadsheetId
  GoogleSheetsService::createMandateTab(mandate)
  GoogleSheetsService::addCddRow(submission) → rowIndex
  GoogleSheetsService::updateStatusCell(submission)
  TimerService::checkTimerA/B/C(claim)
  TimerService::calculatePenalty(claim) → float
  TimerService::checkAndFreeSlot(mandate, recruiterId)
  CommissionService::calculate(submission) → array{gross,fee,net,penalty,final}
  CommissionService::settle(submission) → Placement
  NotificationService::claimApproved/Rejected/cddApproved/etc.
  TokenService::generate(submission) → string
  TokenService::validate(token) → ?CddSubmission
  ExceptionService::shouldBypass(recruiter, mandate) → bool
  SlotService::checkAndFreeSlot(mandate, recruiterId)

QUEUED JOBS:
  ParseCvJob::dispatch($candidate, $mandateId)->onQueue('ai')
  SyncGSheetJob::dispatch($entity, 'add_row|update_status|create_tab')->onQueue('sheets')
  SendClientEmailJob::dispatch($submission)->onQueue('email')

NOW BUILD: [DESCRIBE YOUR TASK HERE]
=== END CONTEXT ===
```

---

## Per-Feature Prompt Templates

### Recruiter Dashboard
```
[PASTE MASTER CONTEXT ABOVE]

Build Pages/Recruiter/Dashboard.jsx for SeaSearch.

Layout: RecruiterLayout wrapper.

1. Hero band (dark ink bg, padding 20px 28px):
   - Left: YTD earnings (36px Syne bold white), period badge, change indicator (jade green)
   - Right: 3 metric cells separated by var(--ink2) borders:
     Active Mandates (22px), Placements YTD (22px), Avg Reward (22px)

2. Stat row (4 columns, 10px gap, padding 20px 28px):
   - Pending Claims (amber bar), Candidates This Month (sea bar),
     Interviews Scheduled (violet bar), Placements Quarter (jade bar)
   Each: .sm card with .sm-bar color bar at top, .sm-num, .sm-lbl

3. Two-column layout (g21, 14px gap, padding 0 28px 20px):
   Left: Active Roles card — list of up to 2 mandates with:
     - 3px left accent bar (var(--sea2)), company initials logo, role title, company
     - 5-segment pipeline bar (stage colors), days active, candidate count
     - Reward amount, "View workspace →" link
   Right: Quick Actions (2x2 .qa-grid), then Leaderboard card (top 5, gold/silver/bronze rank)

4. Three-column grid (g3, 14px gap, padding 0 28px 20px):
   - Recent candidates (.dcard, list with AI score badge and stage badge)
   - Tasks (.dcard, checkable task list .ti items)
   - Activity feed (.dcard, timestamped events with icons)

Props: recruiter, activeMandates[], stats{earnings_ytd,placements,active_mandates,avg_reward},
       leaderboard[], recentCandidates[], tasks[], recentActivity[]
Use CSS custom properties only. Import initials, fmt, fmtCurrency from lib/utils.js.
```

### Admin Claims Queue
```
[PASTE MASTER CONTEXT ABOVE]

Build Pages/Admin/Claims/Index.jsx for SeaSearch admin panel.

AdminLayout wrapper. Page title "Pending Role Claims" with count badge (badge-amber).

Tabs at top: Pending | Approved | Rejected (filter server-side via URL param)

Table (.table-wrap):
Columns: Recruiter (avatar+name+tier badge+trust badge) | Role title | Client |
         Submitted (relative time) | Retry count (if >0 show amber "Retry #N" badge) | Actions

Actions per row (Pending only):
- "Approve" → green button → POST admin.claims.approve (no body needed)
- "Reject" → ghost button → opens modal

Rejection modal:
- Title: "Reject claim"
- Recruiter name + role title shown
- Textarea: "Reason (required, shown to recruiter)" — min 10 chars
- Buttons: Cancel | Reject (danger button) → POST admin.claims.reject {note: string}

Optimistic updates: on approve, immediately move row to Approved tab.
Empty state if no claims: centered icon + "All caught up — no pending claims" in ink4.

Props: claims{paginated}, tab:'pending|approved|rejected'
Flash messages handled by shared FlashMessages component.
```

### Kanban Pipeline
```
[PASTE MASTER CONTEXT ABOVE]

Build Pages/Recruiter/Kanban/Show.jsx for SeaSearch.

Uses @dnd-kit/core and @dnd-kit/sortable for drag-and-drop.

Layout: RecruiterLayout. Inside: a topbar row, then 6-column kanban board.

Topbar (white bg, border-bottom var(--wire), padding 12px 20px):
- Left: company logo initials (36px, sea-pale bg), role title (15px 500), company (11px ink4)
- Badges: stage badges for Picked, Exclusive
- Stats bar: total candidates, top match %, days active (from claim.assigned_at), submitted count
- Right buttons: "Add candidate" (secondary), "Run AI matching" (violet, ✦ icon), "Submit to client" (primary)

Kanban columns (6): Sourced | Screened | Interview | Offered | Hired | Rejected
Column header: colored dot (stage color), title uppercase 9px, count badge .cbadge .cb-sea
Drop zone at bottom of each column: dashed border, "Drop here" text, 36px height

Kanban cards (.kcard style):
- 3px top accent bar (stage color)
- Avatar (28px initials circle), name (12px 500), current role+company (10px ink4)
- AI score top-right: green ≥80, amber 60-79, ruby <60
- Thin match progress bar (stage color)
- Chips: CV on file (jade), interview date (violet), client feedback (sea), rejection reason (ruby)
- Recruiter note (gray left-border block, 10px)
- Green/red flag pills (.cbadge .cb-jade or .cb-rub)
- Footer: date added, View button, Reject (×) button

Side panel (310px fixed right, opens on card click):
- Header: avatar, name, stage mover buttons (one per stage, active = filled)
- CV section: dashed upload zone if no CV, green file strip if CV present
- AI score ring (circular, colored), breakdown bars (5 dimensions with labels)
- Interview scheduling: date/time inputs + format select + notes → save
- Client feedback: existing feedback + sentiment badge; textarea + sentiment + save
- Action buttons: Submit to client, Draft outreach, Interview Qs, Mark offer, Reject

Rejection modal: 4 reasons (Client rejected / Candidate withdrew / Not suitable / Compensation mismatch) + optional note

Drag-and-drop: on dragEnd, optimistic state update, POST recruiter.kanban.move {submission_id, new_stage}

Props: mandate, claim, submissions{grouped by client_status}, stages[]
Import stageColor from lib/utils.js.
```

### Earnings Page
```
[PASTE MASTER CONTEXT ABOVE]

Build Pages/Recruiter/Earnings/Index.jsx for SeaSearch.

RecruiterLayout wrapper. Page has 4 sections:

1. Hero band (ink bg):
   - Large: "SGD {ytd_earnings}" (36px Syne white)
   - 3 metric cells: Pending rewards | Placements YTD | Avg reward per placement

2. Stat cards (4-column): YTD earnings (jade bar) | Pending balance (amber bar) |
   Placements YTD (sea bar) | Avg reward (violet bar)

3. Placement history table (.table-wrap, full width):
   Columns: Candidate | Role | Client | Date | Gross reward | Platform fee (20%) |
            Net payout | Penalty | Final payout | Status badge
   Status badge: pending=amber, processing=sea, paid=jade, on_hold=mist, failed=ruby
   Row click → opens fee breakdown side panel (shows all financials, penalty reason if any)
   Paginated with page controls

4. Pending rewards list (.dcard below table):
   Header: "Pending rewards — candidates at offer / hired stage"
   Each item: candidate name, mandate, client, status badge, estimated payout, payout timeline
   Timeline: Offer → Accepted → Notice period → Start date → Payout

5. Payout request panel (.dcard, right column):
   - Available balance (large jade number)
   - Bank account form: bank name, account number, account holder, SWIFT
   - "Request payout" primary button (disabled if balance = 0)
   - Payout history: date, amount, status

Props: summary{ytd_earnings, pending_rewards, placements_ytd, avg_reward, available_balance},
       monthly[], placements{paginated}, pending[], payoutHistory[]
```

### Admin Dashboard
```
[PASTE MASTER CONTEXT ABOVE]

Build Pages/Admin/Dashboard.jsx for SeaSearch admin.

AdminLayout (white sidebar 230px, NOT dark — admin panel has light sidebar to differentiate).

1. Hero band (ink bg, padding 20px 28px):
   "Good morning, {admin.name}" | MTD revenue | YTD revenue | Placements MTD

2. Alert strip (amber bg if any items need attention):
   - Unclaimed 24h: {n} roles
   - Pending claims: {n}
   - Pending CDD reviews: {n}
   - Show "View all" links per item

3. Stat row (8 cards, 2 rows of 4):
   Row 1: Pending claims (amber) | Pending CDD reviews (amber) | Active mandates (sea) | Unclaimed 24h (ruby)
   Row 2: Total recruiters (ink) | Placements MTD (jade) | Revenue MTD (jade) | Avg time to fill (sea)

4. Two-column layout (g21):
   Left col:
     - Pending claims table (compact): recruiter, role, client, submitted time, Approve/Reject inline buttons
     - Pending CDD reviews table: recruiter, candidate, role, submitted, Approve/Reject inline buttons
   Right col:
     - Quick actions (2x2 grid): Post new mandate | Add client | Approve all claims | View analytics
     - Report templates card: list of active templates with "Send" button per template
       Clicking Send: opens modal → select client → select mandate (optional) → preview → send

5. Bottom row (3 columns):
   - Unclaimed roles (list with age badges: 24h=amber, 48h=ruby, 72h=ruby+paused)
   - Recent activity feed (platform events, timestamped)
   - Platform stats mini chart (placements last 30 days)

Props: stats{}, pendingClaims[], pendingSubmissions[], unclaimedRoles[], recentActivity[], reportTemplates[]
Admin layout has light sidebar: background var(--mist), border-right var(--wire).
```
