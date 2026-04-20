# 02 — Database Schema
> SeaSearch Production Documentation · v1.0  
> MySQL 15+ · All tables use UUID primary keys · All include created_at, updated_at

---

## Entity Relationship Overview

```
users ──────────────── recruiters (1:1)
users ──────────────── clients (1:1, via company)
compensation_types ──── mandates (M:1)
mandates ───────────── mandate_claims (1:M)
mandate_claims ─────── recruiters (M:1)
mandates ───────────── cdd_submissions (1:M)
cdd_submissions ─────── candidates (M:1)
cdd_submissions ─────── recruiters (M:1)
cdd_submissions ─────── placements (1:1)
candidates ─────────── recruiters (M:1)
clients ────────────── mandates (1:M)
```

---

## Tables

### users
```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  email_verified_at TIMESTAMP,
  password          TEXT,                          -- nullable for SSO-only users
  google_id         TEXT UNIQUE,                   -- Google SSO identifier
  avatar_url        TEXT,
  role              TEXT NOT NULL DEFAULT 'recruiter'
                    CHECK (role IN ('super_admin','admin','recruiter','client')),
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','pending','suspended')),
  remember_token    TEXT,
  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_role ON users(role);
```

---

### recruiters
One-to-one with users. Extended profile for recruiter-role users.
```sql
CREATE TABLE recruiters (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Profile
  display_name          TEXT,
  phone                 TEXT,
  linkedin_url          TEXT,
  bio                   TEXT,
  avatar_url            TEXT,
  years_experience      INTEGER,
  current_firm          TEXT,
  ea_license_number     TEXT,                      -- Singapore EA license
  ea_certificate_url    TEXT,                      -- Supabase Storage path
  profile_complete      BOOLEAN DEFAULT false,

  -- Segmentation (3 independent attributes — never merge)
  recruiter_group       TEXT,                      -- Dwikar / Emma / BTI / Jiebei / custom
  recruiter_group_secondary TEXT,                  -- optional secondary tag
  tier                  TEXT NOT NULL DEFAULT 'junior'
                        CHECK (tier IN ('junior','senior','elite')),
  trust_level           TEXT NOT NULL DEFAULT 'standard'
                        CHECK (trust_level IN ('standard','trusted')),

  -- Focus areas
  industries            TEXT[],
  seniority_focus       TEXT[],
  geographies           TEXT[],
  specialty             TEXT,

  -- Stats (denormalized for performance)
  total_placements      INTEGER DEFAULT 0,
  total_earnings        NUMERIC(12,2) DEFAULT 0,
  active_mandates_count INTEGER DEFAULT 0,         -- must be ≤ 2

  created_at            TIMESTAMP DEFAULT now(),
  updated_at            TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_recruiters_user_id ON recruiters(user_id);
CREATE INDEX idx_recruiters_trust_level ON recruiters(trust_level);
CREATE INDEX idx_recruiters_tier ON recruiters(tier);
CREATE INDEX idx_recruiters_group ON recruiters(recruiter_group);
```

---

### clients
```sql
CREATE TABLE clients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
                    -- nullable: admin-managed clients may not have user accounts yet

  company_name      TEXT NOT NULL,
  industry          TEXT,
  logo_url          TEXT,
  accent_color      TEXT DEFAULT '#0B4F8A',        -- hex for client portal branding
  website           TEXT,

  -- Primary contact (may not have user account)
  contact_name      TEXT,
  contact_email     TEXT NOT NULL,
  contact_title     TEXT,

  -- GSheet
  gsheet_url        TEXT,                          -- master GSheet link (sent to client once)
  gsheet_id         TEXT,                          -- Google Sheets ID for API calls

  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive')),

  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_clients_company ON clients(company_name);
```

---

### compensation_types
CRUD-managed by admin. Scalable formula engine.
```sql
CREATE TABLE compensation_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,                 -- e.g. "Percentage", "Hourly", "Fixed Rate"
  is_active         BOOLEAN DEFAULT true,
  formula_type      TEXT NOT NULL
                    CHECK (formula_type IN ('percentage','hourly','fixed','milestone')),
  formula_fields    JSONB NOT NULL DEFAULT '{}',
                    -- percentage: {reward_pct, platform_fee_pct}
                    -- hourly: {hourly_rate, hours_billed, platform_fee_pct}
                    -- fixed: {fixed_amount, platform_fee_pct}
                    -- milestone: {milestones: [{name, amount}], platform_fee_pct}
  trigger_condition TEXT NOT NULL DEFAULT 'on_hire'
                    CHECK (trigger_condition IN ('on_hire','on_invoice','on_milestone')),
  platform_fee_pct  NUMERIC(5,4) DEFAULT 0.20,    -- 0.20 = 20%
  notes             TEXT,
  sort_order        INTEGER DEFAULT 0,

  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now()
);

-- Seed defaults
INSERT INTO compensation_types (name, formula_type, formula_fields, trigger_condition) VALUES
  ('Percentage of Salary', 'percentage', '{"reward_pct": 0.15, "platform_fee_pct": 0.20}', 'on_hire'),
  ('Hourly Rate',          'hourly',     '{"hourly_rate": 0, "hours_billed": 0, "platform_fee_pct": 0.20}', 'on_invoice'),
  ('Fixed Fee',            'fixed',      '{"fixed_amount": 0, "platform_fee_pct": 0.20}', 'on_hire'),
  ('Per Project',          'milestone',  '{"milestones": [], "platform_fee_pct": 0.20}', 'on_milestone');
```

---

### mandates
The core "role" entity.
```sql
CREATE TABLE mandates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  posted_by_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
                          -- admin or recruiter who created the mandate
  compensation_type_id    UUID REFERENCES compensation_types(id) ON DELETE SET NULL,

  -- Role details
  title                   TEXT NOT NULL,
  description             TEXT,                    -- full JD, rich text (HTML)
  location                TEXT,
  seniority               TEXT
                          CHECK (seniority IN ('c_suite','vp_director','manager','ic')),
  industry                TEXT,
  contract_type           TEXT DEFAULT 'full_time'
                          CHECK (contract_type IN ('full_time','contract','part_time')),
  openings_count          INTEGER DEFAULT 1,
  is_remote               BOOLEAN DEFAULT false,

  -- Compensation / reward
  salary_min              NUMERIC(12,2),
  salary_max              NUMERIC(12,2),
  salary_currency         TEXT DEFAULT 'SGD',
  reward_min              NUMERIC(12,2),
  reward_max              NUMERIC(12,2),
  reward_pct              NUMERIC(5,4),            -- % of first-year salary

  -- Screening
  must_haves              TEXT[] DEFAULT '{}',
  nice_to_haves           TEXT[] DEFAULT '{}',
  green_flags             TEXT[] DEFAULT '{}',
  red_flags               TEXT[] DEFAULT '{}',
  screening_questions     JSONB DEFAULT '[]',
  ideal_candidates        JSONB DEFAULT '[]',      -- reference profiles (do not contact)
  ideal_source_companies  TEXT[] DEFAULT '{}',

  -- Status & visibility
  status                  TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','active','paused','closed','filled','dropped')),
  is_exclusive            BOOLEAN DEFAULT false,
  exclusive_recruiter_id  UUID REFERENCES recruiters(id) ON DELETE SET NULL,
  exclusive_expires_at    TIMESTAMP,
  is_featured             BOOLEAN DEFAULT false,
  is_fast_track           BOOLEAN DEFAULT false,   -- exception rule: skip admin CDD review

  -- Timer configuration (per mandate, overrides global defaults)
  timer_a_days            INTEGER DEFAULT 3,       -- days to submit first profile
  timer_b_active          BOOLEAN DEFAULT false,   -- full submission deadline
  timer_b_days            INTEGER DEFAULT 5,
  timer_b_penalty_d6      NUMERIC(5,4) DEFAULT 0.10,
  timer_b_penalty_d7      NUMERIC(5,4) DEFAULT 0.20,
  timer_b_penalty_d8plus  NUMERIC(5,4) DEFAULT 0.30,
  timer_c_active          BOOLEAN DEFAULT false,   -- capacity lock until client responds
  timer_c_sla_days        INTEGER DEFAULT 5,

  -- GSheet tab reference
  gsheet_tab_name         TEXT,                    -- tab name in client's master GSheet

  -- Metadata
  published_at            TIMESTAMP,
  original_post_date      TIMESTAMP,               -- for global age tracking across reassignments
  assignment_count        INTEGER DEFAULT 0,       -- how many times reassigned (max 3)

  created_at              TIMESTAMP DEFAULT now(),
  updated_at              TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_mandates_client_id ON mandates(client_id);
CREATE INDEX idx_mandates_status ON mandates(status);
CREATE INDEX idx_mandates_seniority ON mandates(seniority);
CREATE INDEX idx_mandates_industry ON mandates(industry);
CREATE INDEX idx_mandates_is_exclusive ON mandates(is_exclusive);
```

---

### mandate_claims
Recruiter claim + admin approval gate.
```sql
CREATE TABLE mandate_claims (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id        UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  recruiter_id      UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,

  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','withdrawn')),

  -- Admin review
  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_note        TEXT,
  reviewed_at       TIMESTAMP,

  -- Retry tracking
  rejection_count   INTEGER DEFAULT 0,
  is_retry          BOOLEAN DEFAULT false,

  -- Day 0 — set when status → approved
  assigned_at       TIMESTAMP,                     -- this is Day 0

  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now(),

  UNIQUE(mandate_id, recruiter_id)                 -- one claim per recruiter per mandate
);

CREATE INDEX idx_mandate_claims_mandate ON mandate_claims(mandate_id);
CREATE INDEX idx_mandate_claims_recruiter ON mandate_claims(recruiter_id);
CREATE INDEX idx_mandate_claims_status ON mandate_claims(status);
```

---

### candidates
```sql
CREATE TABLE candidates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id      UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,

  -- Basic info
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  linkedin_url      TEXT,
  current_role      TEXT,
  current_company   TEXT,
  location          TEXT,
  years_experience  INTEGER,

  -- CV
  cv_url            TEXT,                          -- Supabase Storage path
  cv_original_name  TEXT,
  cv_uploaded_at    TIMESTAMP,
  cv_parsed_at      TIMESTAMP,

  -- AI parsed data (raw from Claude)
  parsed_profile    JSONB,
  -- structure: {
  --   name, email, phone, linkedin, current_role, current_company,
  --   years_experience, seniority_level,
  --   work_history: [{title, company, dates, description}],
  --   education: [{degree, institution, year}],
  --   skills: [string],
  --   achievements: [string]
  -- }

  skills            TEXT[] DEFAULT '{}',
  notes             TEXT,                          -- recruiter's internal notes

  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_candidates_recruiter_id ON candidates(recruiter_id);
```

---

### cdd_submissions
One record per candidate submitted to a mandate. Central to the submission flow.
```sql
CREATE TABLE cdd_submissions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id                UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  recruiter_id              UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  candidate_id              UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Submission
  submitted_at              TIMESTAMP DEFAULT now(),
  recruiter_note            TEXT,                  -- recruiter's note to admin/client
  submission_number         INTEGER,               -- 1, 2, or 3 for this mandate

  -- AI scoring (populated by ParseCvJob)
  ai_score                  INTEGER,               -- 0–100
  score_breakdown           JSONB,
  -- { experience: int, industry: int, scope: int, leadership: int, digital: int }
  ai_summary                TEXT,                  -- 3–5 sentence client-ready summary
  green_flags               TEXT[] DEFAULT '{}',
  red_flags                 TEXT[] DEFAULT '{}',

  -- Admin review gate
  admin_review_status       TEXT NOT NULL DEFAULT 'pending'
                            CHECK (admin_review_status IN
                              ('pending','approved','rejected','bypassed')),
  admin_reviewed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_reviewed_at         TIMESTAMP,
  admin_note                TEXT,
  admin_rejection_count     INTEGER DEFAULT 0,    -- max 2; on 2nd rejection slot is burned
  exception_bypass          BOOLEAN DEFAULT false, -- true if trust_level=trusted or fast_track

  -- Client feedback
  client_status             TEXT NOT NULL DEFAULT 'pending'
                            CHECK (client_status IN
                              ('pending','shortlisted','interview',
                               'offer_made','hired','rejected','on_hold')),
  client_status_updated_at  TIMESTAMP,
  client_rejection_reason   TEXT,

  -- Interview tracking
  interview_date            TIMESTAMP,
  interview_format          TEXT,
  interview_notes           TEXT,
  interview_feedback        TEXT,
  interview_feedback_stars  INTEGER CHECK (interview_feedback_stars BETWEEN 1 AND 5),
  interview_verdict         TEXT
                            CHECK (interview_verdict IN
                              ('strong_yes','yes','uncertain','no')),

  -- Client tokenized link
  token                     TEXT UNIQUE,           -- one-time token for email link
  token_created_at          TIMESTAMP,
  token_used_at             TIMESTAMP,
  token_action              TEXT,                  -- what action the token triggers

  -- GSheet
  gsheet_row_index          INTEGER,              -- row number in role tab

  -- Penalty (computed at settlement, stored for record)
  penalty_applied           NUMERIC(5,4) DEFAULT 0,
  days_late                 INTEGER DEFAULT 0,

  created_at                TIMESTAMP DEFAULT now(),
  updated_at                TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_cdd_submissions_mandate ON cdd_submissions(mandate_id);
CREATE INDEX idx_cdd_submissions_recruiter ON cdd_submissions(recruiter_id);
CREATE INDEX idx_cdd_submissions_candidate ON cdd_submissions(candidate_id);
CREATE INDEX idx_cdd_submissions_admin_status ON cdd_submissions(admin_review_status);
CREATE INDEX idx_cdd_submissions_client_status ON cdd_submissions(client_status);
CREATE INDEX idx_cdd_submissions_token ON cdd_submissions(token);
```

---

### placements
Final placement record — created when a candidate is marked Hired.
```sql
CREATE TABLE placements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cdd_submission_id     UUID UNIQUE NOT NULL REFERENCES cdd_submissions(id),
  mandate_id            UUID NOT NULL REFERENCES mandates(id),
  recruiter_id          UUID NOT NULL REFERENCES recruiters(id),
  client_id             UUID NOT NULL REFERENCES clients(id),

  -- Financials
  gross_reward          NUMERIC(12,2) NOT NULL,
  platform_fee          NUMERIC(12,2) NOT NULL,   -- gross × platform_fee_pct
  net_payout            NUMERIC(12,2) NOT NULL,   -- gross − platform_fee
  penalty_amount        NUMERIC(12,2) DEFAULT 0,  -- deducted from net_payout
  final_payout          NUMERIC(12,2) NOT NULL,   -- net_payout − penalty_amount
  currency              TEXT DEFAULT 'SGD',

  -- Payout status
  payout_status         TEXT NOT NULL DEFAULT 'pending'
                        CHECK (payout_status IN
                          ('pending','processing','paid','on_hold','failed')),
  payout_date           TIMESTAMP,
  stripe_transfer_id    TEXT,

  -- Dates
  candidate_start_date  DATE,
  placed_at             TIMESTAMP DEFAULT now(),

  created_at            TIMESTAMP DEFAULT now(),
  updated_at            TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_placements_recruiter ON placements(recruiter_id);
CREATE INDEX idx_placements_client ON placements(client_id);
CREATE INDEX idx_placements_payout_status ON placements(payout_status);
```

---

### exception_rules
Admin-configured rules for bypassing CDD review.
```sql
CREATE TABLE exception_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN DEFAULT true,
  rule_type       TEXT NOT NULL
                  CHECK (rule_type IN ('recruiter_trust','role_type','both')),
  -- Conditions (OR logic by default)
  trust_level     TEXT,                           -- 'trusted' — if rule_type includes recruiter
  role_type       TEXT,                           -- 'fast_track' — if rule_type includes role
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT now(),
  updated_at      TIMESTAMP DEFAULT now()
);

-- Audit log for exception rule changes
CREATE TABLE exception_rule_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id     UUID REFERENCES exception_rules(id) ON DELETE CASCADE,
  changed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT CHECK (action IN ('created','updated','deleted','toggled')),
  old_value   JSONB,
  new_value   JSONB,
  changed_at  TIMESTAMP DEFAULT now()
);
```

---

### notifications
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  -- Types: claim_pending, claim_approved, claim_rejected,
  --   cdd_pending, cdd_approved, cdd_rejected, cdd_to_client,
  --   client_feedback, timer_a_warning, timer_a_deadline,
  --   timer_b_warning, role_dropped, placement_confirmed,
  --   payout_processed, daily_digest
  title         TEXT NOT NULL,
  body          TEXT,
  action_url    TEXT,                             -- Inertia route to navigate on click
  is_read       BOOLEAN DEFAULT false,
  read_at       TIMESTAMP,
  metadata      JSONB DEFAULT '{}',              -- extra data per notification type
  created_at    TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

---

### gsheet_sync_log
Tracks every GSheet write for debugging.
```sql
CREATE TABLE gsheet_sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id),
  mandate_id      UUID REFERENCES mandates(id),
  cdd_submission_id UUID REFERENCES cdd_submissions(id),
  action          TEXT CHECK (action IN ('row_added','row_updated','tab_created')),
  gsheet_id       TEXT,
  tab_name        TEXT,
  row_index       INTEGER,
  success         BOOLEAN DEFAULT true,
  error_message   TEXT,
  synced_at       TIMESTAMP DEFAULT now()
);
```

---

## Enums Reference

| Column | Values |
|--------|--------|
| `users.role` | super_admin, admin, recruiter, client |
| `users.status` | active, pending, suspended |
| `recruiters.tier` | junior, senior, elite |
| `recruiters.trust_level` | standard, trusted |
| `mandates.status` | draft, active, paused, closed, filled, dropped |
| `mandates.seniority` | c_suite, vp_director, manager, ic |
| `mandate_claims.status` | pending, approved, rejected, withdrawn |
| `cdd_submissions.admin_review_status` | pending, approved, rejected, bypassed |
| `cdd_submissions.client_status` | pending, shortlisted, interview, offer_made, hired, rejected, on_hold |
| `placements.payout_status` | pending, processing, paid, on_hold, failed |
| `compensation_types.formula_type` | percentage, hourly, fixed, milestone |
| `compensation_types.trigger_condition` | on_hire, on_invoice, on_milestone |

---

## Indexes Summary

All foreign keys are indexed. Additional indexes on frequently-queried columns: status fields, role/trust_level, timestamps for timer queries.

```sql
-- Timer queries — frequently needed
CREATE INDEX idx_cdd_submitted_at ON cdd_submissions(submitted_at);
CREATE INDEX idx_claims_assigned_at ON mandate_claims(assigned_at);
CREATE INDEX idx_mandates_original_post ON mandates(original_post_date);
```
