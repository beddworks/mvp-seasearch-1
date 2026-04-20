# 01 — Tech Stack & Environment
> SeaSearch Production Documentation · v1.0

---

## Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend framework | Laravel | 11.x |
| Frontend framework | React | 18.x |
| Frontend bridge | Inertia.js | 1.x |
| Styling | Custom CSS (app.css) + Tailwind (minimal) | — |
| Database | MySQL | 15+ |
| Auth | Laravel Breeze + Spatie Permission | — |
| File storage | Supabase Storage (S3-compatible) | — |
| AI | Claude API (Anthropic) — claude-sonnet-4-6 | — |
| Email | Resend or SendGrid via Laravel Mail | — |
| Payments | Stripe Connect | — |
| Queue | Laravel Queues (Redis or DB driver) | — |
| Scheduler | Laravel Scheduler (cron) | — |
| Hosting | Vercel (frontend static) or Laravel Forge/Vapor | — |

---

## Laravel Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/                    # SSO, login, register
│   │   ├── Admin/                   # AdminController, RecruiterMgmtController...
│   │   ├── Recruiter/               # MandateController, CandidateController...
│   │   ├── Client/                  # ClientPortalController, FeedbackController
│   │   └── Webhook/                 # StripeWebhookController, GSheetWebhookController
│   ├── Middleware/
│   │   ├── EnsureRole.php           # role-gate middleware (admin/recruiter/client)
│   │   └── EnsureProfileComplete.php
│   └── Requests/                    # Form request validation classes
├── Models/
│   ├── User.php
│   ├── Recruiter.php
│   ├── Client.php
│   ├── Mandate.php
│   ├── MandateClaim.php
│   ├── Candidate.php
│   ├── CddSubmission.php
│   ├── Placement.php
│   ├── CompensationType.php
│   ├── TimerConfig.php
│   └── Notification.php
├── Services/
│   ├── ClaudeService.php            # All Claude API calls
│   ├── GoogleSheetsService.php      # GSheet read/write
│   ├── TimerService.php             # Timer evaluation logic
│   ├── CommissionService.php        # Formula evaluation
│   ├── NotificationService.php      # Email + in-app dispatch
│   └── TokenService.php             # Tokenized link generation/validation
├── Jobs/
│   ├── ParseCvJob.php               # Async Claude CV parsing
│   ├── SyncGSheetJob.php            # Async GSheet update
│   ├── SendClientEmailJob.php       # Email dispatch
│   └── TimerCheckJob.php            # Called by scheduler
└── Console/
    └── Commands/
        └── DailyDigestCommand.php   # 9am admin digest

resources/
├── js/
│   ├── app.jsx                      # Inertia bootstrap
│   ├── Pages/
│   │   ├── Auth/                    # Login, Register, SSO callback
│   │   ├── Admin/                   # All admin pages
│   │   ├── Recruiter/               # Dashboard, Jobs, Candidates, Kanban...
│   │   └── Client/                  # Client portal pages
│   ├── Components/
│   │   ├── ui/                      # Badge, Button, Card, Avatar, Input...
│   │   ├── layout/                  # RecruiterLayout, AdminLayout, ClientLayout
│   │   └── shared/                  # FlashMessages, ConfirmModal, RichTextEditor
│   └── lib/
│       └── utils.js                 # initials(), fmt(), fmtK(), cn()
└── css/
    └── app.css                      # ALL styles — design tokens, components

routes/
├── web.php                          # All Inertia routes
└── api.php                          # Webhook routes only
```

---

## Inertia.js Conventions

### Page components
Every page is a React component in `resources/js/Pages/`. Named by route:
```
GET /admin/mandates → Pages/Admin/Mandates/Index.jsx
GET /admin/mandates/{id} → Pages/Admin/Mandates/Show.jsx
GET /recruiter/dashboard → Pages/Recruiter/Dashboard.jsx
```

### Props pattern
All data comes from the controller via Inertia `render()`:
```php
// Controller
return Inertia::render('Recruiter/Dashboard', [
    'recruiter'    => RecruiterResource::make($recruiter),
    'activeMandates' => MandateResource::collection($mandates),
    'earnings'     => $earningsData,
]);
```

```jsx
// Page component
export default function Dashboard({ recruiter, activeMandates, earnings }) {
  return <RecruiterLayout recruiter={recruiter}>
    {/* ... */}
  </RecruiterLayout>
}
```

### Forms — always useForm
```jsx
import { useForm } from '@inertiajs/react'

const { data, setData, post, processing, errors } = useForm({
  candidate_name: '',
  cv_file: null,
})

function handleSubmit(e) {
  e.preventDefault()
  post(route('recruiter.candidates.store'))
}
```

### Flash messages
```php
// Controller
return redirect()->route('recruiter.dashboard')
  ->with('success', 'Candidate submitted successfully.')
```
```jsx
// FlashMessages component reads usePage().props.flash automatically
```

---

## Laravel Conventions

### Route naming
```
admin.mandates.index
admin.mandates.show
admin.mandates.claims.approve
recruiter.dashboard
recruiter.mandates.index
recruiter.mandates.pick
recruiter.candidates.store
client.submissions.index
client.submissions.update-status
```

### Model naming
- Singular: `Mandate`, `MandateClaim`, `CddSubmission`
- Pivot tables: `mandate_recruiter` (if needed)
- All use UUID primary keys (`HasUuids` trait)

### Service layer
Business logic lives in `app/Services/` — controllers are thin:
```php
// Controller (thin)
public function approve(MandateClaim $claim)
{
    $this->claimService->approve($claim, auth()->user());
    return redirect()->back()->with('success', 'Claim approved.');
}

// Service (fat — business logic here)
public function approve(MandateClaim $claim, User $admin): void
{
    $claim->update(['status' => 'approved', 'approved_at' => now()]);
    $this->timerService->startTimers($claim->mandate, $claim->recruiter);
    $this->notificationService->claimApproved($claim);
}
```

### Queue usage
Heavy operations always go to the queue:
```php
ParseCvJob::dispatch($candidate, $cvPath)->onQueue('ai');
SyncGSheetJob::dispatch($submission)->onQueue('sheets');
SendClientEmailJob::dispatch($submission)->onQueue('email');
```

### Scheduler (Kernel)
```php
// app/Console/Kernel.php
$schedule->command('seasearch:daily-digest')->dailyAt('09:00');
$schedule->job(new TimerCheckJob())->hourly();
```

---

## Environment Variables

```env
# App
APP_NAME=SeaSearch
APP_URL=https://seasearch.asia

# Database
DB_CONNECTION=pgsql
DB_HOST=...
DB_DATABASE=seasearch

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS=...   # Service account JSON path
GOOGLE_SHEETS_SCOPE=https://www.googleapis.com/auth/spreadsheets

# Stripe
STRIPE_KEY=pk_...
STRIPE_SECRET=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mail
MAIL_MAILER=resend
RESEND_KEY=re_...
MAIL_FROM_ADDRESS=hello@seasearch.asia
MAIL_FROM_NAME=SeaSearch

# Google OAuth (SSO)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=${APP_URL}/auth/google/callback

# Supabase Storage (S3-compatible)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=seasearch-files
AWS_ENDPOINT=https://{project}.supabase.co/storage/v1/s3
```

---

## Dependencies (composer.json)

```json
{
  "require": {
    "laravel/framework": "^11.0",
    "inertiajs/inertia-laravel": "^1.0",
    "spatie/laravel-permission": "^6.0",
    "laravel/socialite": "^5.0",
    "google/apiclient": "^2.0",
    "stripe/stripe-php": "^13.0",
    "league/flysystem-aws-s3-v3": "^3.0"
  }
}
```

## Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.0",
    "@inertiajs/react": "^1.0",
    "@tiptap/react": "^2.0",
    "@tiptap/starter-kit": "^2.0",
    "@dnd-kit/core": "^6.0",
    "@dnd-kit/sortable": "^7.0"
  },
  "devDependencies": {
    "vite": "^5.0",
    "@vitejs/plugin-react": "^4.0",
    "tailwindcss": "^3.0"
  }
}
```

---

## Roles & Permissions (Spatie)

```
Roles:
  super_admin     → full access
  admin           → Sea Search internal team
  recruiter       → vetted headhunter
  client          → hiring manager (company side)

Permissions (examples):
  mandates.create
  mandates.publish
  claims.approve
  claims.reject
  cdd.approve
  cdd.reject
  exception_rules.manage
  compensation_types.manage
  timers.configure
  clients.manage
  recruiters.manage
  analytics.view
```

Middleware usage:
```php
Route::middleware(['auth', 'role:admin'])->group(function () {
    // Admin routes
});

Route::middleware(['auth', 'role:recruiter'])->group(function () {
    // Recruiter routes
});
```
