# 17 — API Reference
> SeaSearch PRD · v2.0  
> All routes are Inertia/web routes. JSON responses only for AJAX endpoints marked [JSON].  
> Tokenized feedback route is public (no auth). All others require auth.

---

## Auth Routes

| Method | Route | Controller | Auth | Notes |
|--------|-------|-----------|------|-------|
| GET | `/login` | LoginController@show | guest | Login page |
| POST | `/login` | LoginController@store | guest | Admin email login only |
| POST | `/logout` | LoginController@destroy | auth | Any role |
| GET | `/auth/google` | GoogleSsoController@redirect | guest | Redirects to Google |
| GET | `/auth/google/callback` | GoogleSsoController@callback | guest | OAuth callback |
| GET | `/profile/complete` | ProfileController@show | auth | Profile completion page |
| POST | `/profile/complete` | ProfileController@store | auth | Save profile |
| POST | `/profile/skip` | ProfileController@skip | auth | Skip profile |

---

## Recruiter Routes

All require `auth` + `role:recruiter` middleware.

### Dashboard
| Method | Route | Controller | Response |
|--------|-------|-----------|---------|
| GET | `/recruiter/dashboard` | RecruiterDashboardController@index | Inertia: Recruiter/Dashboard |

**Props:** `recruiter, activeMandates, stats{earnings_ytd, placements, active_mandates, avg_reward}, leaderboard[], recentCandidates[], tasks[], recentActivity[]`

---

### Mandates (Job Board)
| Method | Route | Name | Response |
|--------|-------|------|---------|
| GET | `/recruiter/mandates` | `recruiter.mandates.index` | Inertia: Recruiter/Mandates/Index |
| GET | `/recruiter/mandates/{mandate}` | `recruiter.mandates.show` | Inertia: Recruiter/Mandates/Show |
| POST | `/recruiter/mandates/{mandate}/pick` | `recruiter.mandates.pick` | Redirect + flash |
| GET | `/recruiter/mandates/{mandate}/workspace` | `recruiter.mandates.workspace` | Inertia: Recruiter/Mandates/Workspace |

**Index props:** `mandates{paginated}, filters{industry,location,seniority,type}, activeTab`

**Pick request:**
```json
{}   // No body — mandate ID is in URL
```
**Pick response (success):** Redirect to workspace with `flash.success`
**Pick response (error):**
```json
{ "errors": { "capacity": "You already have 2 active roles." } }
```

**Workspace props:** `mandate, claim{assigned_at, days_since_assignment, timer_a_deadline}, candidates[], daysSinceAssignment`

---

### Candidates
| Method | Route | Name | Response |
|--------|-------|------|---------|
| GET | `/recruiter/candidates` | `recruiter.candidates.index` | Inertia: Recruiter/Candidates/Index |
| GET | `/recruiter/candidates/{candidate}` | `recruiter.candidates.show` | Inertia: Recruiter/Candidates/Show |
| POST | `/recruiter/candidates` | `recruiter.candidates.store` | Redirect + flash |
| PUT | `/recruiter/candidates/{candidate}` | `recruiter.candidates.update` | Redirect + flash |
| POST | `/recruiter/candidates/{candidate}/upload-cv` | `recruiter.candidates.upload-cv` | Redirect + flash |

**Store request:**
```json
{
  "first_name": "string|required",
  "last_name": "string|required",
  "email": "email|nullable",
  "phone": "string|nullable",
  "linkedin_url": "url|nullable",
  "current_role": "string|nullable",
  "current_company": "string|nullable",
  "mandate_id": "uuid|nullable",
  "cv": "file|mimes:pdf,doc,docx|max:10240|nullable"
}
```

**Upload CV request:** `multipart/form-data`
```
cv: File (pdf/doc/docx, max 10MB)
mandate_id: uuid (optional — triggers AI scoring against this mandate)
```

---

### CDD Submissions
| Method | Route | Name | Response |
|--------|-------|------|---------|
| POST | `/recruiter/submissions` | `recruiter.submissions.store` | Redirect + flash |
| PUT | `/recruiter/submissions/{submission}` | `recruiter.submissions.update` | Redirect + flash |

**Store request:**
```json
{
  "mandate_id": "uuid|required",
  "candidate_id": "uuid|required",
  "recruiter_note": "string|nullable|max:1000"
}
```

**Validation rules (server-side):**
- Recruiter must have approved claim for this mandate
- Submission count < 3 for this mandate/recruiter
- Candidate belongs to this recruiter

---

### Kanban
| Method | Route | Name | Response |
|--------|-------|------|---------|
| GET | `/recruiter/kanban/{mandate}` | `recruiter.kanban.show` | Inertia: Recruiter/Kanban/Show |
| POST | `/recruiter/kanban/move` | `recruiter.kanban.move` | [JSON] `{success: bool, new_stage: string}` |

**Move request:**
```json
{
  "submission_id": "uuid|required",
  "new_stage": "sourced|screened|interview|offered|hired|rejected|on_hold"
}
```

**Kanban props:** `mandate, claim, submissions{grouped by client_status}, stages[]`

---

### Earnings
| Method | Route | Name | Response |
|--------|-------|------|---------|
| GET | `/recruiter/earnings` | `recruiter.earnings.index` | Inertia: Recruiter/Earnings/Index |
| POST | `/recruiter/earnings/payout-request` | `recruiter.earnings.payout-request` | Redirect + flash |

**Earnings props:**
```json
{
  "summary": { "ytd_earnings": 0, "pending_rewards": 0, "placements_ytd": 0, "avg_reward": 0 },
  "monthly": [{ "month": "2026-01", "earnings": 0, "placements": 0 }],
  "placements": { "paginated list of Placement records" },
  "pending": [{ "mandate": {}, "candidate": {}, "expected_reward": 0 }],
  "bankAccount": { "bank_name": "", "account_number": "" }
}
```

**Payout request:**
```json
{
  "bank_name": "string|required",
  "account_number": "string|required",
  "account_holder": "string|required",
  "swift_code": "string|nullable"
}
```

---

### AI Endpoints [JSON]
| Method | Route | Name | Response |
|--------|-------|------|---------|
| POST | `/recruiter/ai/generate-brief/{submission}` | `recruiter.ai.brief` | `{brief: string}` |
| POST | `/recruiter/ai/draft-outreach/{candidate}` | `recruiter.ai.outreach` | `{subject: string, body: string}` |
| POST | `/recruiter/ai/interview-questions/{submission}` | `recruiter.ai.questions` | `{questions: [{type, question}]}` |
| POST | `/recruiter/ai/run-matching/{mandate}` | `recruiter.ai.matching` | `{results: [{id, score}]}` |

**Draft outreach request:**
```json
{ "mandate_id": "uuid|required" }
```

---

### Notifications [JSON]
| Method | Route | Name | Response |
|--------|-------|------|---------|
| GET | `/recruiter/notifications` | `recruiter.notifications.index` | Inertia page |
| POST | `/recruiter/notifications/{notification}/read` | `recruiter.notifications.read` | `{success: true}` |
| POST | `/recruiter/notifications/read-all` | `recruiter.notifications.read-all` | `{success: true}` |

---

## Admin Routes

All require `auth` + `role:admin|super_admin`.

### Dashboard
| Method | Route | Name | Response |
|--------|-------|------|---------|
| GET | `/admin/dashboard` | `admin.dashboard` | Inertia: Admin/Dashboard |

---

### Claims
| Method | Route | Name | Request | Response |
|--------|-------|------|---------|---------|
| GET | `/admin/claims` | `admin.claims.index` | — | Inertia: Admin/Claims/Index |
| POST | `/admin/claims/{claim}/approve` | `admin.claims.approve` | `{note?: string}` | Redirect |
| POST | `/admin/claims/{claim}/reject` | `admin.claims.reject` | `{note: string|required}` | Redirect |

---

### CDD Review
| Method | Route | Name | Request | Response |
|--------|-------|------|---------|---------|
| GET | `/admin/submissions` | `admin.submissions.index` | — | Inertia: Admin/Submissions/Index |
| POST | `/admin/submissions/{submission}/approve` | `admin.submissions.approve` | `{note?: string}` | Redirect |
| POST | `/admin/submissions/{submission}/reject` | `admin.submissions.reject` | `{note: string|required}` | Redirect |

---

### Mandates
| Method | Route | Name | Request | Response |
|--------|-------|------|---------|---------|
| GET | `/admin/mandates` | `admin.mandates.index` | — | Inertia |
| GET | `/admin/mandates/create` | `admin.mandates.create` | — | Inertia: Admin/Mandates/Form |
| POST | `/admin/mandates` | `admin.mandates.store` | Mandate fields | Redirect |
| GET | `/admin/mandates/{mandate}` | `admin.mandates.show` | — | Inertia |
| GET | `/admin/mandates/{mandate}/edit` | `admin.mandates.edit` | — | Inertia |
| PUT | `/admin/mandates/{mandate}` | `admin.mandates.update` | Mandate fields | Redirect |
| DELETE | `/admin/mandates/{mandate}` | `admin.mandates.destroy` | — | Redirect |
| POST | `/admin/mandates/{mandate}/publish` | `admin.mandates.publish` | — | Redirect |
| POST | `/admin/mandates/{mandate}/pause` | `admin.mandates.pause` | — | Redirect |
| POST | `/admin/mandates/{mandate}/close` | `admin.mandates.close` | — | Redirect |
| POST | `/admin/mandates/{mandate}/reassign` | `admin.mandates.reassign` | `{recruiter_id: uuid}` | Redirect |

**Mandate store/update request:**
```json
{
  "client_id": "uuid|required",
  "compensation_type_id": "uuid|nullable",
  "title": "string|required|max:200",
  "description": "string|nullable",
  "location": "string|nullable",
  "seniority": "c_suite|vp_director|manager|ic",
  "industry": "string|nullable",
  "contract_type": "full_time|contract|part_time",
  "openings_count": "integer|min:1",
  "salary_min": "numeric|nullable",
  "salary_max": "numeric|nullable",
  "salary_currency": "string|default:SGD",
  "reward_min": "numeric|nullable",
  "reward_max": "numeric|nullable",
  "reward_pct": "numeric|nullable",
  "must_haves": "array",
  "nice_to_haves": "array",
  "green_flags": "array",
  "red_flags": "array",
  "screening_questions": "array",
  "is_exclusive": "boolean",
  "is_featured": "boolean",
  "is_fast_track": "boolean",
  "is_remote": "boolean",
  "timer_a_days": "integer|min:1|max:30",
  "timer_b_active": "boolean",
  "timer_b_days": "integer|min:1|max:30",
  "timer_c_active": "boolean",
  "timer_c_sla_days": "integer|min:1|max:30"
}
```

---

### Recruiters
| Method | Route | Name | Request | Response |
|--------|-------|------|---------|---------|
| GET | `/admin/recruiters` | `admin.recruiters.index` | — | Inertia |
| GET | `/admin/recruiters/{recruiter}` | `admin.recruiters.show` | — | Inertia |
| POST | `/admin/recruiters/{recruiter}/approve` | `admin.recruiters.approve` | — | Redirect |
| POST | `/admin/recruiters/{recruiter}/suspend` | `admin.recruiters.suspend` | `{reason: string}` | Redirect |
| POST | `/admin/recruiters/{recruiter}/set-tier` | `admin.recruiters.set-tier` | `{tier: junior\|senior\|elite}` | Redirect |
| POST | `/admin/recruiters/{recruiter}/set-trust` | `admin.recruiters.set-trust` | `{trust_level: standard\|trusted}` | Redirect |
| POST | `/admin/recruiters/{recruiter}/set-group` | `admin.recruiters.set-group` | `{recruiter_group, recruiter_group_secondary}` | Redirect |

---

### Clients
| Method | Route | Name | Request | Response |
|--------|-------|------|---------|---------|
| GET | `/admin/clients` | `admin.clients.index` | — | Inertia |
| POST | `/admin/clients` | `admin.clients.store` | Client fields | Redirect |
| GET | `/admin/clients/{client}` | `admin.clients.show` | — | Inertia |
| PUT | `/admin/clients/{client}` | `admin.clients.update` | Client fields | Redirect |
| DELETE | `/admin/clients/{client}` | `admin.clients.destroy` | — | Redirect |
| POST | `/admin/clients/{client}/send-gsheet` | `admin.clients.send-gsheet` | — | Redirect |

**Client store/update request:**
```json
{
  "company_name": "string|required|max:200",
  "industry": "string|nullable",
  "contact_name": "string|required",
  "contact_email": "email|required",
  "contact_title": "string|nullable",
  "accent_color": "string|regex:/^#[0-9A-Fa-f]{6}$/|nullable"
}
```

---

### Settings
| Method | Route | Name | Request | Response |
|--------|-------|------|---------|---------|
| GET | `/admin/compensation-types` | `admin.compensation-types.index` | — | Inertia |
| POST | `/admin/compensation-types` | `admin.compensation-types.store` | CompType fields | Redirect |
| PUT | `/admin/compensation-types/{type}` | `admin.compensation-types.update` | CompType fields | Redirect |
| DELETE | `/admin/compensation-types/{type}` | `admin.compensation-types.destroy` | — | Redirect |
| GET | `/admin/exception-rules` | `admin.exception-rules.index` | — | Inertia |
| POST | `/admin/exception-rules` | `admin.exception-rules.store` | Rule fields | Redirect |
| POST | `/admin/exception-rules/{rule}/toggle` | `admin.exception-rules.toggle` | — | Redirect |
| DELETE | `/admin/exception-rules/{rule}` | `admin.exception-rules.destroy` | — | Redirect |
| GET | `/admin/timer-config` | `admin.timer-config.index` | — | Inertia |
| PUT | `/admin/timer-config` | `admin.timer-config.update` | Timer fields | Redirect |
| GET | `/admin/report-templates` | `admin.report-templates.index` | — | Inertia |
| POST | `/admin/report-templates` | `admin.report-templates.store` | Template fields | Redirect |
| PUT | `/admin/report-templates/{template}` | `admin.report-templates.update` | Template fields | Redirect |
| DELETE | `/admin/report-templates/{template}` | `admin.report-templates.destroy` | — | Redirect |
| POST | `/admin/report-templates/{template}/send` | `admin.report-templates.send` | `{client_id, mandate_id?, custom_message?}` | Redirect |
| POST | `/admin/report-templates/{template}/preview` | `admin.report-templates.preview` | `{variables: {}}` | [JSON] `{subject, body}` |

---

### Admin slots (manual)
| Method | Route | Name | Request | Response |
|--------|-------|------|---------|---------|
| POST | `/admin/claims/{claim}/free-slot` | `admin.claims.free-slot` | — | Redirect |

---

## Client Routes (tokenized — no auth)

| Method | Route | Name | Auth | Response |
|--------|-------|------|------|---------|
| GET | `/feedback/{token}` | `feedback.show` | none | Inertia: Client/Feedback |
| POST | `/feedback/{token}` | `feedback.update` | none | Redirect to confirmation |

**Feedback update request:**
```json
{
  "status": "shortlisted|interview|offer_made|hired|rejected|on_hold|required",
  "rejection_reason": "string|nullable|max:500",
  "interview_date": "date|nullable",
  "interview_format": "in_person|video|panel|nullable",
  "interview_notes": "string|nullable"
}
```

**Token expired response:** 404 with `This link has expired or has already been used.`

---

## Client Portal Routes (auth — deferred)

| Method | Route | Name | Response |
|--------|-------|------|---------|
| GET | `/client/portal` | `client.portal.index` | Inertia: Client/Portal/Index |
| GET | `/client/submissions` | `client.submissions.index` | Inertia |
| GET | `/client/compare` | `client.compare` | Inertia |
| GET | `/client/messages` | `client.messages` | Inertia |
| POST | `/client/messages` | `client.messages.send` | Redirect |
| GET | `/client/notifications` | `client.notifications` | Inertia |
| POST | `/client/notifications/read-all` | `client.notifications.read-all` | [JSON] |

---

## Validation Rules Reference

### Common
```php
'uuid'      → 'required|uuid|exists:{table},id'
'email'     → 'required|email|max:255'
'url'       → 'nullable|url|max:255'
'rich_text' → 'nullable|string'      // TipTap outputs HTML
'array'     → 'nullable|array'
'enum'      → 'required|in:val1,val2,val3'
'money'     → 'nullable|numeric|min:0|max:9999999'
'pct'       → 'nullable|numeric|min:0|max:1'
'file_cv'   → 'nullable|file|mimes:pdf,doc,docx|max:10240'
'file_pdf'  → 'nullable|file|mimes:pdf|max:5120'
'hex_color' → 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/'
```

---

## Flash Message Keys

```php
session('success') → green flash banner
session('error')   → red flash banner
session('warning') → amber flash banner
session('info')    → blue flash banner
```

Read in `FlashMessages.jsx` via `usePage().props.flash`.

---

## Shared Props (always available via HandleInertiaRequests)

```json
{
  "auth": {
    "user": { "id", "name", "email", "role" },
    "recruiter": { "id", "display_name", "tier", "trust_level", "recruiter_group", "active_mandates_count", "profile_complete" }
  },
  "flash": { "success": null, "error": null, "warning": null, "info": null },
  "unread_notifications": 0
}
```
