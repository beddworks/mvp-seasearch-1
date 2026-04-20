# 04 — Architecture & Routing
> SeaSearch Production Documentation · v1.0

---

## Laravel + Inertia + React Flow

```
Browser Request
      ↓
  Laravel Router (web.php)
      ↓
  Middleware Stack (auth, role, EnsureProfileComplete)
      ↓
  Controller (thin — validates, fetches, delegates to Service)
      ↓
  Service Layer (business logic)
      ↓
  Inertia::render('Page/Component', $props)
      ↓
  React Page Component (display only)
      ↓
  useForm / Inertia.visit for mutations
      ↓
  Back to Controller
```

---

## Route Structure (web.php)

```php
<?php
use App\Http\Controllers\Auth\{GoogleSsoController, LoginController, RegisterController};
use App\Http\Controllers\Admin\{
    DashboardController as AdminDashboardController,
    RecruiterManagementController,
    ClientManagementController,
    MandateManagementController,
    ClaimApprovalController,
    CddApprovalController,
    CompensationTypeController,
    ExceptionRuleController,
    TimerConfigController,
    AnalyticsController,
};
use App\Http\Controllers\Recruiter\{
    DashboardController as RecruiterDashboardController,
    MandateController,
    CandidateController,
    CddSubmissionController,
    KanbanController,
    EarningsController,
};
use App\Http\Controllers\Client\{
    PortalController,
    SubmissionFeedbackController,
};

// ─── AUTH ───────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'show'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
    Route::get('/auth/google', [GoogleSsoController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleSsoController::class, 'callback']);
});
Route::post('/logout', [LoginController::class, 'destroy'])->name('logout')->middleware('auth');

// ─── PROFILE COMPLETION ─────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/profile/complete', [RegisterController::class, 'profileForm'])->name('profile.complete');
    Route::post('/profile/complete', [RegisterController::class, 'profileStore'])->name('profile.complete.store');
});

// ─── RECRUITER ──────────────────────────────────────────
Route::middleware(['auth', 'role:recruiter'])->prefix('recruiter')->name('recruiter.')->group(function () {
    Route::get('/dashboard', [RecruiterDashboardController::class, 'index'])->name('dashboard');

    // Mandates (job board)
    Route::get('/mandates', [MandateController::class, 'index'])->name('mandates.index');
    Route::get('/mandates/{mandate}', [MandateController::class, 'show'])->name('mandates.show');
    Route::post('/mandates/{mandate}/pick', [MandateController::class, 'pick'])->name('mandates.pick');
    Route::get('/mandates/{mandate}/workspace', [MandateController::class, 'workspace'])->name('mandates.workspace');

    // Candidates
    Route::get('/candidates', [CandidateController::class, 'index'])->name('candidates.index');
    Route::get('/candidates/{candidate}', [CandidateController::class, 'show'])->name('candidates.show');
    Route::post('/candidates', [CandidateController::class, 'store'])->name('candidates.store');
    Route::put('/candidates/{candidate}', [CandidateController::class, 'update'])->name('candidates.update');
    Route::post('/candidates/{candidate}/upload-cv', [CandidateController::class, 'uploadCv'])->name('candidates.upload-cv');

    // CDD Submissions
    Route::post('/submissions', [CddSubmissionController::class, 'store'])->name('submissions.store');
    Route::put('/submissions/{submission}', [CddSubmissionController::class, 'update'])->name('submissions.update');

    // Kanban
    Route::get('/kanban/{mandate}', [KanbanController::class, 'show'])->name('kanban.show');
    Route::post('/kanban/move', [KanbanController::class, 'move'])->name('kanban.move');

    // Earnings
    Route::get('/earnings', [EarningsController::class, 'index'])->name('earnings.index');
    Route::post('/earnings/payout-request', [EarningsController::class, 'requestPayout'])->name('earnings.payout-request');

    // Notifications
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [App\Http\Controllers\NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [App\Http\Controllers\NotificationController::class, 'readAll'])->name('notifications.read-all');
});

// ─── ADMIN ──────────────────────────────────────────────
Route::middleware(['auth', 'role:admin|super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // Mandate management
    Route::resource('mandates', MandateManagementController::class);
    Route::post('/mandates/{mandate}/publish', [MandateManagementController::class, 'publish'])->name('mandates.publish');
    Route::post('/mandates/{mandate}/pause', [MandateManagementController::class, 'pause'])->name('mandates.pause');
    Route::post('/mandates/{mandate}/close', [MandateManagementController::class, 'close'])->name('mandates.close');

    // Claim approvals
    Route::get('/claims', [ClaimApprovalController::class, 'index'])->name('claims.index');
    Route::post('/claims/{claim}/approve', [ClaimApprovalController::class, 'approve'])->name('claims.approve');
    Route::post('/claims/{claim}/reject', [ClaimApprovalController::class, 'reject'])->name('claims.reject');

    // CDD approvals
    Route::get('/submissions', [CddApprovalController::class, 'index'])->name('submissions.index');
    Route::post('/submissions/{submission}/approve', [CddApprovalController::class, 'approve'])->name('submissions.approve');
    Route::post('/submissions/{submission}/reject', [CddApprovalController::class, 'reject'])->name('submissions.reject');

    // Client management
    Route::resource('clients', ClientManagementController::class);
    Route::post('/clients/{client}/send-gsheet', [ClientManagementController::class, 'sendGsheet'])->name('clients.send-gsheet');

    // Recruiter management
    Route::resource('recruiters', RecruiterManagementController::class);
    Route::post('/recruiters/{recruiter}/approve', [RecruiterManagementController::class, 'approve'])->name('recruiters.approve');
    Route::post('/recruiters/{recruiter}/suspend', [RecruiterManagementController::class, 'suspend'])->name('recruiters.suspend');
    Route::post('/recruiters/{recruiter}/set-tier', [RecruiterManagementController::class, 'setTier'])->name('recruiters.set-tier');
    Route::post('/recruiters/{recruiter}/set-trust', [RecruiterManagementController::class, 'setTrust'])->name('recruiters.set-trust');

    // Settings CRUD
    Route::resource('compensation-types', CompensationTypeController::class);
    Route::resource('exception-rules', ExceptionRuleController::class);
    Route::get('/timer-config', [TimerConfigController::class, 'index'])->name('timer-config.index');
    Route::put('/timer-config', [TimerConfigController::class, 'update'])->name('timer-config.update');

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
});

// ─── CLIENT ─────────────────────────────────────────────
Route::middleware(['auth', 'role:client'])->prefix('client')->name('client.')->group(function () {
    Route::get('/portal', [PortalController::class, 'index'])->name('portal.index');
    Route::get('/submissions', [PortalController::class, 'submissions'])->name('submissions.index');
    Route::get('/compare', [PortalController::class, 'compare'])->name('compare');
    Route::get('/messages', [PortalController::class, 'messages'])->name('messages');
    Route::get('/notifications', [PortalController::class, 'notifications'])->name('notifications');
    Route::post('/messages', [PortalController::class, 'sendMessage'])->name('messages.send');
    Route::post('/notifications/read-all', [PortalController::class, 'readAllNotifications'])->name('notifications.read-all');
});

// ─── TOKENIZED CLIENT FEEDBACK (no auth required) ───────
Route::get('/feedback/{token}', [SubmissionFeedbackController::class, 'show'])->name('feedback.show');
Route::post('/feedback/{token}', [SubmissionFeedbackController::class, 'update'])->name('feedback.update');

// ─── WEBHOOKS (api.php) ─────────────────────────────────
// Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle']);
```

---

## Middleware

### EnsureRole.php
```php
// Registered in bootstrap/app.php as 'role'
class EnsureRole {
    public function handle(Request $request, Closure $next, ...$roles): Response {
        if (!$request->user() || !in_array($request->user()->role, $roles)) {
            abort(403, 'Unauthorized');
        }
        return $next($request);
    }
}
```

### EnsureProfileComplete.php
Applied to recruiter routes except `/profile/complete`:
```php
class EnsureProfileComplete {
    public function handle(Request $request, Closure $next): Response {
        $recruiter = $request->user()?->recruiter;
        if ($recruiter && !$recruiter->profile_complete && !$request->is('profile/*')) {
            // Profile incomplete but skippable — just log, don't block
            // Block only if admin has set profile_required = true globally
        }
        return $next($request);
    }
}
```

---

## Controller Pattern (thin controller)

```php
// app/Http/Controllers/Admin/ClaimApprovalController.php
class ClaimApprovalController extends Controller
{
    public function __construct(
        private ClaimService $claimService
    ) {}

    public function index(): Response
    {
        $claims = MandateClaim::with(['mandate.client', 'recruiter.user'])
            ->where('status', 'pending')
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/Claims/Index', [
            'claims' => ClaimResource::collection($claims),
        ]);
    }

    public function approve(MandateClaim $claim, Request $request): RedirectResponse
    {
        $request->validate(['note' => 'nullable|string|max:500']);
        $this->claimService->approve($claim, auth()->user(), $request->note);
        return redirect()->back()->with('success', 'Claim approved. Day 0 has started.');
    }

    public function reject(MandateClaim $claim, Request $request): RedirectResponse
    {
        $request->validate(['note' => 'required|string|max:500']);
        $this->claimService->reject($claim, auth()->user(), $request->note);
        return redirect()->back()->with('success', 'Claim rejected. Recruiter notified.');
    }
}
```

---

## Inertia Shared Props

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user()?->only('id', 'name', 'email', 'role'),
            'recruiter' => $request->user()?->recruiter?->only(
                'id', 'display_name', 'tier', 'trust_level', 'recruiter_group',
                'active_mandates_count', 'profile_complete'
            ),
        ],
        'flash' => [
            'success' => $request->session()->get('success'),
            'error'   => $request->session()->get('error'),
        ],
        'unread_notifications' => $request->user()
            ? $request->user()->notifications()->where('is_read', false)->count()
            : 0,
    ];
}
```

---

## Page Structure Convention

```
Pages/
├── Auth/
│   ├── Login.jsx
│   ├── Register.jsx
│   └── ProfileComplete.jsx
├── Admin/
│   ├── Dashboard.jsx
│   ├── Claims/
│   │   └── Index.jsx
│   ├── Submissions/
│   │   └── Index.jsx
│   ├── Mandates/
│   │   ├── Index.jsx
│   │   ├── Show.jsx
│   │   └── Form.jsx          (create + edit)
│   ├── Clients/
│   │   ├── Index.jsx
│   │   └── Form.jsx
│   ├── Recruiters/
│   │   ├── Index.jsx
│   │   └── Show.jsx
│   └── Settings/
│       ├── CompensationTypes.jsx
│       ├── ExceptionRules.jsx
│       └── TimerConfig.jsx
├── Recruiter/
│   ├── Dashboard.jsx
│   ├── Mandates/
│   │   ├── Index.jsx         (job board)
│   │   └── Show.jsx          (role workspace)
│   ├── Candidates/
│   │   ├── Index.jsx
│   │   └── Show.jsx
│   ├── Kanban/
│   │   └── Show.jsx
│   └── Earnings/
│       └── Index.jsx
└── Client/
    └── Portal/
        └── Index.jsx         (SPA-like tabs: Dashboard, Submissions, Compare, Messages, Notifications)
```
