# SeaSearch — Production Documentation Suite
> **Version:** 2.0 · **Stack:** Laravel 13 + React + Inertia.js  
> **Updated:** April 2026 · **Status:** Complete — no missing docs

---

## Document Index

| # | File | Lines | Status | Purpose |
|---|------|-------|--------|---------|
| 00 | `00_INDEX.md` | — | ✅ | Master navigation (this file) |
| 01 | `01_TECH_STACK.md` | 323 | ✅ | Stack, project structure, conventions, dependencies |
| 02 | `02_DATABASE_SCHEMA.md` | 555 | ✅ | Full MySQL schema, all tables, indexes, enums |
| 03 | `03_DESIGN_SYSTEM.md` | 494 | ✅ | All CSS tokens, components, layout rules, utils |
| 04 | `04_ARCHITECTURE.md` | 317 | ✅ | Laravel+Inertia structure, all routes, middleware |
| 05 | `05_AUTH_ONBOARDING.md` | — | ✅ NEW | SSO, registration, profile completion, all models |
| 06–09 | `06_to_09_FEATURES_*.md` | 616 | ✅ | Mandates, candidates, CDD submission, timers (old) |
| 09 | `09_FEATURE_TIMERS.md` | — | ✅ NEW | Timer engine complete — A/B/C + SlotService |
| 10–15 | `10_to_15_FEATURES_*.md` | 774 | ✅ | GSheet, client portal, kanban, commission, admin, notif (old) |
| 13 | `13_FEATURE_COMMISSION.md` | — | ✅ NEW | Commission engine + earnings + payout complete |
| 14 | `14_FEATURE_ADMIN.md` | — | ✅ NEW | Admin panel + report templates + analytics |
| 15 | `15_FEATURE_NOTIFICATIONS.md` | — | ✅ NEW | Full NotificationService + daily digest |
| 16 | `16_AI_CLAUDE.md` | 352 | ✅ | Claude API integration — all 5 prompts |
| 17 | `17_API_REFERENCE.md` | — | ✅ NEW | All routes, request shapes, validation rules |
| 18 | `18_AI_VIBE_CODING_CONTEXT.md` | — | ✅ UPDATED | Master AI context + 5 detailed per-feature prompts |

> **When in conflict between old combined files and new individual files — always use the newer individual file.**

---

## How to Use This Suite

**Starting a feature:**
1. Read `04_ARCHITECTURE.md` for routing pattern
2. Read the relevant feature file
3. Read `03_DESIGN_SYSTEM.md` for any UI questions
4. Check `17_API_REFERENCE.md` for request/response shapes

**Building with AI (vibe coding):**
1. Copy the full master context from `18_AI_VIBE_CODING_CONTEXT.md`
2. Paste the relevant per-feature prompt from the bottom of that file
3. The AI has everything it needs

**Database changes:**
Always update `02_DATABASE_SCHEMA.md` first, then migrations in the order defined in `05_AUTH_ONBOARDING.md` section 6.

**Auth/permissions questions:**
Go to `05_AUTH_ONBOARDING.md` — covers SSO, profile completion, all model relationships and scopes.

---

## Golden Rules (Non-negotiable)

1. **Laravel handles ALL business logic** — React is display only via Inertia props
2. **Never hardcode hex colors** — always `var(--sea2)` not `#1A6DB5`
3. **`useForm` for all forms** — never raw fetch/axios for mutations
4. **All Claude API calls server-side** — never expose API key to React
5. **Timer state is computed** — `claim.assigned_at + mandate.timer_a_days` not stored boolean
6. **Admin approval gates always run** — claim approval + CDD review are non-negotiable
7. **One compensation formula per mandate** — evaluated at commission settlement only
8. **`initials()`, `fmt()`, `stageColor()` always imported** — never redefined inline

---

## Build Priority (v2 confirmed order)

| Priority | What to build | Blocking dependency |
|----------|--------------|---------------------|
| 1 | Run migrations (order in `05_AUTH_ONBOARDING.md`) | Everything |
| 2 | Seed: admin user + compensation types + exception rule | Everything |
| 3 | Auth: Google SSO + login page + profile completion | Recruiters need accounts |
| 4 | Admin panel: mandate CRUD + client CRUD + recruiter management | Roles need to exist |
| 5 | Job board (Recruiter): mandate listing + pick flow + claim queue | Need mandates |
| 6 | Candidate profiles + CV upload + AI parsing | Need candidates for submission |
| 7 | Role workspace + CDD submission + admin review queue | Core flow |
| 8 | GSheet integration (auto-sync on approval) | Client delivery |
| 9 | Tokenized client feedback (public route, no auth) | Client feedback loop |
| 10 | Kanban pipeline tracker | Visibility |
| 11 | Timer engine (cron scheduler) | SLA enforcement |
| 12 | Earnings + payout centre | Commission settlement |
| 13 | Notification hub + daily digest | Operational reliability |
| 14 | Report templates (admin sends to client) | Edge case comms |
| 15 | Client portal (Stage 4 PRD) | Deferred — built last |

---

## What Was Fixed vs v1.0

| Gap | Fixed in |
|-----|---------|
| `05_AUTH_ONBOARDING.md` missing | `05_AUTH_ONBOARDING.md` ✅ |
| `17_API_REFERENCE.md` missing | `17_API_REFERENCE.md` ✅ |
| `SlotService` undefined | `09_FEATURE_TIMERS.md` ✅ |
| Timer B + C job logic incomplete | `09_FEATURE_TIMERS.md` ✅ |
| Stage 6 Earnings screens missing | `13_FEATURE_COMMISSION.md` ✅ |
| Report template system absent | `14_FEATURE_ADMIN.md` ✅ |
| `exception_rule_audit` unused | `14_FEATURE_ADMIN.md` ✅ |
| Model relationships not defined | `05_AUTH_ONBOARDING.md` ✅ |
| Migration order not specified | `05_AUTH_ONBOARDING.md` §6 ✅ |
| DatabaseSeeder missing | `05_AUTH_ONBOARDING.md` §7 ✅ |
| `--jade3` token undefined | `03_DESIGN_SYSTEM.md` updated ✅ |
| Daily digest incomplete | `15_FEATURE_NOTIFICATIONS.md` ✅ |
| Exception rule decision unclear | Briefing: "for now not do" → exception rules exist in schema but default OFF + audit log ✅ |
| Client portal design tokens partial | `03_DESIGN_SYSTEM.md` ✅ |
| `SyncGSheetJob` rowIndex bug | `09_FEATURE_TIMERS.md` + `10_FEATURE_GSHEET.md` fixed ✅ |
| AI vibe context outdated | `18_AI_VIBE_CODING_CONTEXT.md` rebuilt with 5 prompts ✅ |
