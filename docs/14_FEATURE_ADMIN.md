# 14 — Feature: Admin Panel
> SeaSearch PRD · v2.0  
> Full admin CRUD, approvals, report templates, analytics, settings

---

## Admin Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/admin/dashboard` | Stats, pending queues, activity |
| Claims queue | `/admin/claims` | Approve / reject recruiter claims |
| CDD review queue | `/admin/submissions` | Approve / reject CDD submissions |
| Mandate management | `/admin/mandates` | Create, edit, publish, pause, close roles |
| Recruiter management | `/admin/recruiters` | View, approve, suspend, set tier/trust |
| Client management | `/admin/clients` | CRUD clients, GSheet setup |
| Compensation types | `/admin/settings/compensation-types` | CRUD formula engine |
| Exception rules | `/admin/settings/exception-rules` | CRUD bypass rules |
| Timer config | `/admin/settings/timer-config` | Global timer defaults |
| Report templates | `/admin/report-templates` | CRUD client communication templates |
| Analytics | `/admin/analytics` | Platform-wide performance |

---

## Report Templates (v2 Confirmed Feature)

Admin generates reports manually to send to clients when:
- A role goes unassigned for 72h
- A role is dropped (3 failed attempts)
- Admin wants to update client on any status

### Database Table
```sql
CREATE TABLE report_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,           -- e.g. "Role Update", "Unassigned Role", "Role Dropped"
    type        TEXT NOT NULL
                CHECK (type IN ('unclaimed_role','role_dropped','role_update','general')),
    subject     TEXT NOT NULL,           -- email subject (supports variables)
    body        TEXT NOT NULL,           -- email body (rich text, supports variables)
    variables   TEXT[] DEFAULT '{}',     -- list of available variables e.g. {role_title}, {client_name}
    is_active   BOOLEAN DEFAULT true,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now()
);

-- Seed default templates
INSERT INTO report_templates (id, name, type, subject, body, variables) VALUES
(gen_random_uuid(), 'Unassigned Role Notice', 'unclaimed_role',
 'Update on your role: {role_title}',
 'Dear {client_name},\n\nWe wanted to update you on the {role_title} mandate.\n\nWe are currently in the process of assigning the right recruiter to this role. We expect to confirm an assignment within the next 24–48 hours.\n\nWe appreciate your patience and will keep you informed.\n\nWarm regards,\nSea Search Team',
 array['{role_title}','{client_name}','{company_name}']),

(gen_random_uuid(), 'Role Dropped Notice', 'role_dropped',
 'Important update on {role_title}',
 'Dear {client_name},\n\nWe regret to inform you that after multiple assignment attempts, we were unable to progress the {role_title} mandate at {company_name} to submission stage.\n\nWe would like to discuss next steps and how we can best support your hiring needs. Please let us know a convenient time to connect.\n\nApologies for any inconvenience.\n\nWarm regards,\nSea Search Team',
 array['{role_title}','{client_name}','{company_name}','{assignment_count}']),

(gen_random_uuid(), 'General Role Update', 'role_update',
 'Update: {role_title} at {company_name}',
 'Dear {client_name},\n\nA quick update on the {role_title} mandate.\n\n{custom_message}\n\nPlease do not hesitate to reach out if you have any questions.\n\nWarm regards,\nSea Search Team',
 array['{role_title}','{client_name}','{company_name}','{custom_message}']);
```

### ReportTemplateController
```php
// app/Http/Controllers/Admin/ReportTemplateController.php
class ReportTemplateController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/ReportTemplates/Index', [
            'templates' => ReportTemplate::orderBy('type')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'    => 'required|string|max:100',
            'type'    => 'required|in:unclaimed_role,role_dropped,role_update,general',
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
        ]);

        ReportTemplate::create([...$request->validated(), 'created_by' => auth()->id()]);
        return redirect()->back()->with('success', 'Template created.');
    }

    public function update(ReportTemplate $template, Request $request): RedirectResponse
    {
        $request->validate([
            'name'    => 'required|string|max:100',
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
        ]);
        $template->update($request->validated());
        return redirect()->back()->with('success', 'Template updated.');
    }

    public function destroy(ReportTemplate $template): RedirectResponse
    {
        $template->delete();
        return redirect()->back()->with('success', 'Template deleted.');
    }

    // Preview with variables substituted
    public function preview(ReportTemplate $template, Request $request): JsonResponse
    {
        $vars = $request->input('variables', []);
        $subject = $this->substituteVars($template->subject, $vars);
        $body    = $this->substituteVars($template->body, $vars);
        return response()->json(['subject' => $subject, 'body' => $body]);
    }

    // Admin sends report to client (manual action)
    public function send(ReportTemplate $template, Request $request): RedirectResponse
    {
        $request->validate([
            'client_id'    => 'required|uuid|exists:clients,id',
            'mandate_id'   => 'nullable|uuid|exists:mandates,id',
            'custom_vars'  => 'nullable|array',
            'custom_message'=> 'nullable|string',
        ]);

        $client  = Client::findOrFail($request->client_id);
        $mandate = $request->mandate_id ? Mandate::find($request->mandate_id) : null;

        $vars = array_merge([
            '{client_name}'    => $client->contact_name,
            '{company_name}'   => $client->company_name,
            '{role_title}'     => $mandate?->title ?? '',
            '{assignment_count}'=> $mandate?->assignment_count ?? '',
            '{custom_message}' => $request->custom_message ?? '',
        ], $request->custom_vars ?? []);

        $subject = $this->substituteVars($template->subject, $vars);
        $body    = $this->substituteVars($template->body, $vars);

        // Send email
        Mail::to($client->contact_email)
            ->queue(new AdminClientReportMail($subject, $body, $client));

        return redirect()->back()->with('success', "Report sent to {$client->contact_name}.");
    }

    private function substituteVars(string $text, array $vars): string
    {
        return str_replace(array_keys($vars), array_values($vars), $text);
    }
}
```

---

## Admin Dashboard Controller

```php
// app/Http/Controllers/Admin/DashboardController.php
class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = now();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_recruiters'      => Recruiter::count(),
                'active_recruiters'     => User::recruiters()->where('status','active')->count(),
                'pending_claims'        => MandateClaim::where('status','pending')->count(),
                'pending_cdd_reviews'   => CddSubmission::pendingAdminReview()->count(),
                'active_mandates'       => Mandate::active()->count(),
                'unclaimed_24h'         => Mandate::active()->unclaimed()
                                            ->where('original_post_date','<=',$now->copy()->subHours(24))->count(),
                'all_at_capacity'       => Mandate::active()->unclaimed()
                                            ->whereDoesntHave('claims',fn($q)=>$q->whereIn('status',['pending','approved']))
                                            ->where(fn($q)=> $q->whereRaw('(SELECT COUNT(*) FROM recruiters WHERE active_mandates_count < 2) = 0'))
                                            ->count(),
                'placements_mtd'        => Placement::whereMonth('placed_at',$now->month)->count(),
                'revenue_mtd'           => Placement::whereMonth('placed_at',$now->month)->sum('platform_fee'),
                'placements_ytd'        => Placement::whereYear('placed_at',$now->year)->count(),
                'revenue_ytd'           => Placement::whereYear('placed_at',$now->year)->sum('platform_fee'),
            ],
            'pendingClaims'       => MandateClaim::with(['mandate.client','recruiter.user'])
                                        ->where('status','pending')->latest()->take(8)->get(),
            'pendingSubmissions'  => CddSubmission::with(['mandate.client','candidate','recruiter.user'])
                                        ->pendingAdminReview()->latest()->take(8)->get(),
            'unclaimedRoles'      => Mandate::active()->unclaimed()
                                        ->with('client')
                                        ->where('original_post_date','<=',$now->copy()->subHours(24))
                                        ->orderBy('original_post_date')
                                        ->take(5)->get(),
            'recentActivity'      => Notification::admins()
                                        ->latest()->take(20)->get(),
            'reportTemplates'     => ReportTemplate::where('is_active',true)->get(['id','name','type']),
        ]);
    }
}
```

---

## Recruiter Management

```php
// app/Http/Controllers/Admin/RecruiterManagementController.php
class RecruiterManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Recruiters/Index', [
            'recruiters' => Recruiter::with('user')
                ->withCount(['claims','submissions','placements'])
                ->latest()
                ->paginate(20),
            'stats' => [
                'total'   => Recruiter::count(),
                'active'  => User::recruiters()->where('status','active')->count(),
                'pending' => User::recruiters()->where('status','pending')->count(),
            ],
        ]);
    }

    public function show(Recruiter $recruiter): Response
    {
        return Inertia::render('Admin/Recruiters/Show', [
            'recruiter'    => $recruiter->load('user','activeClaims.mandate.client','placements'),
            'activeMandates'=> $recruiter->activeClaims()->with('mandate.client')->get(),
            'recentPlacements'=> $recruiter->placements()->with('mandate')->latest()->take(10)->get(),
            'tiers'        => ['junior','senior','elite'],
            'trustLevels'  => ['standard','trusted'],
            'groups'       => ['Dwikar','Emma','BTI','Jiebei'],
        ]);
    }

    public function approve(Recruiter $recruiter): RedirectResponse
    {
        $recruiter->user->update(['status' => 'active']);
        app(NotificationService::class)->recruiterApproved($recruiter);
        return redirect()->back()->with('success', 'Recruiter approved.');
    }

    public function suspend(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $recruiter->user->update(['status' => 'suspended']);
        app(NotificationService::class)->recruiterSuspended($recruiter, $request->reason);
        return redirect()->back()->with('success', 'Recruiter suspended.');
    }

    public function setTier(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate(['tier' => 'required|in:junior,senior,elite']);
        $recruiter->update(['tier' => $request->tier]);
        return redirect()->back()->with('success', "Tier updated to {$request->tier}.");
    }

    public function setTrust(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate(['trust_level' => 'required|in:standard,trusted']);
        $recruiter->update(['trust_level' => $request->trust_level]);
        return redirect()->back()->with('success', "Trust level updated to {$request->trust_level}.");
    }

    public function setGroup(Recruiter $recruiter, Request $request): RedirectResponse
    {
        $request->validate([
            'recruiter_group'           => 'nullable|string|max:50',
            'recruiter_group_secondary' => 'nullable|string|max:50',
        ]);
        $recruiter->update($request->only('recruiter_group','recruiter_group_secondary'));
        return redirect()->back()->with('success', 'Group updated.');
    }
}
```

---

## Client Management

```php
// app/Http/Controllers/Admin/ClientManagementController.php
class ClientManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Clients/Index', [
            'clients' => Client::withCount('mandates')
                ->withSum('mandates','reward_max')
                ->latest()->paginate(20),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'company_name'  => 'required|string|max:200',
            'industry'      => 'nullable|string|max:100',
            'contact_name'  => 'required|string|max:100',
            'contact_email' => 'required|email',
            'contact_title' => 'nullable|string|max:100',
            'accent_color'  => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $client = Client::create($request->validated());

        // Create GSheet for this client
        try {
            app(GoogleSheetsService::class)->createClientSheet($client);
        } catch (\Exception $e) {
            // Non-fatal — admin can retry
            logger()->warning("GSheet creation failed for client {$client->id}: {$e->getMessage()}");
        }

        return redirect()->route('admin.clients.show', $client)
            ->with('success', 'Client created. GSheet being set up.');
    }

    public function sendGsheet(Client $client): RedirectResponse
    {
        if (!$client->gsheet_url) {
            app(GoogleSheetsService::class)->createClientSheet($client);
        }

        // Email GSheet link to client contact
        Mail::to($client->contact_email)
            ->queue(new ClientGsheetLinkMail($client));

        return redirect()->back()->with('success', 'GSheet link sent to client.');
    }
}
```

---

## Mandate Management (Admin)

```php
// app/Http/Controllers/Admin/MandateManagementController.php
class MandateManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Mandates/Index', [
            'mandates'         => Mandate::with(['client','activeClaim.recruiter.user','compensationType'])
                                    ->latest()->paginate(20),
            'clients'          => Client::active()->get(['id','company_name']),
            'compensationTypes'=> CompensationType::where('is_active',true)->get(),
            'stats' => [
                'active'    => Mandate::where('status','active')->count(),
                'draft'     => Mandate::where('status','draft')->count(),
                'filled'    => Mandate::where('status','filled')->count(),
                'dropped'   => Mandate::where('status','dropped')->count(),
            ],
        ]);
    }

    public function store(StoreMandateRequest $request): RedirectResponse
    {
        $mandate = Mandate::create([
            ...$request->validated(),
            'posted_by_user_id'  => auth()->id(),
            'status'             => 'draft',
            'original_post_date' => now(),
        ]);

        return redirect()->route('admin.mandates.show', $mandate)
            ->with('success', 'Mandate created as draft. Publish when ready.');
    }

    public function publish(Mandate $mandate): RedirectResponse
    {
        $mandate->update(['status' => 'active', 'published_at' => now()]);

        // Create GSheet tab for this role
        SyncGSheetJob::dispatch($mandate, 'create_tab')->onQueue('sheets');

        return redirect()->back()->with('success', 'Mandate published — now visible on job board.');
    }

    public function pause(Mandate $mandate): RedirectResponse
    {
        $mandate->update(['status' => 'paused']);
        return redirect()->back()->with('success', 'Mandate paused.');
    }

    public function close(Mandate $mandate, Request $request): RedirectResponse
    {
        $mandate->update(['status' => 'closed']);
        // Free any active recruiter slots
        if ($claim = $mandate->activeClaim) {
            $claim->recruiter->decrement('active_mandates_count');
        }
        return redirect()->back()->with('success', 'Mandate closed.');
    }

    public function reassign(Mandate $mandate, Request $request): RedirectResponse
    {
        $request->validate(['recruiter_id' => 'required|uuid|exists:recruiters,id']);

        $recruiter = Recruiter::findOrFail($request->recruiter_id);

        if (!$recruiter->hasCapacity()) {
            return redirect()->back()->with('error', 'This recruiter is at full capacity.');
        }

        // Create pre-approved claim
        $claim = MandateClaim::create([
            'mandate_id'   => $mandate->id,
            'recruiter_id' => $recruiter->id,
            'status'       => 'approved',
            'admin_note'   => 'Manually assigned by admin.',
            'reviewed_by'  => auth()->id(),
            'reviewed_at'  => now(),
            'assigned_at'  => now(),
        ]);

        $mandate->increment('assignment_count');
        $recruiter->increment('active_mandates_count');

        app(TimerService::class)->startTimers($mandate, $claim);
        app(NotificationService::class)->claimApproved($claim);

        return redirect()->back()->with('success', 'Role manually assigned.');
    }
}
```

---

## Exception Rules CRUD

```php
// app/Http/Controllers/Admin/ExceptionRuleController.php
class ExceptionRuleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Settings/ExceptionRules', [
            'rules' => ExceptionRule::with('creator')->latest()->get(),
            'audit' => ExceptionRuleAudit::with('changer','rule')
                        ->latest()->take(20)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
            'rule_type'   => 'required|in:recruiter_trust,role_type,both',
            'trust_level' => 'required_if:rule_type,recruiter_trust,both|in:trusted',
            'role_type'   => 'required_if:rule_type,role_type,both|in:fast_track',
        ]);

        $rule = ExceptionRule::create([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        // Audit log
        ExceptionRuleAudit::create([
            'rule_id'    => $rule->id,
            'changed_by' => auth()->id(),
            'action'     => 'created',
            'new_value'  => $rule->toArray(),
        ]);

        return redirect()->back()->with('success', 'Exception rule created.');
    }

    public function toggle(ExceptionRule $rule): RedirectResponse
    {
        $old = $rule->toArray();
        $rule->update(['is_active' => !$rule->is_active]);

        ExceptionRuleAudit::create([
            'rule_id'    => $rule->id,
            'changed_by' => auth()->id(),
            'action'     => 'toggled',
            'old_value'  => $old,
            'new_value'  => $rule->fresh()->toArray(),
        ]);

        $status = $rule->is_active ? 'enabled' : 'disabled';
        return redirect()->back()->with('success', "Rule {$status}.");
    }

    public function destroy(ExceptionRule $rule): RedirectResponse
    {
        ExceptionRuleAudit::create([
            'rule_id'    => $rule->id,
            'changed_by' => auth()->id(),
            'action'     => 'deleted',
            'old_value'  => $rule->toArray(),
        ]);
        $rule->delete();
        return redirect()->back()->with('success', 'Rule deleted.');
    }
}
```

---

## Analytics Controller

```php
// app/Http/Controllers/Admin/AnalyticsController.php
class AnalyticsController extends Controller
{
    public function index(): Response
    {
        $now = now();

        // Monthly revenue (last 12 months)
        $monthlyRevenue = Placement::selectRaw("
                DATE_TRUNC('month', placed_at) as month,
                SUM(platform_fee) as revenue,
                SUM(final_payout) as recruiter_payouts,
                COUNT(*) as placements
            ")
            ->where('placed_at','>=', $now->copy()->subMonths(12)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Placement funnel
        $funnel = [
            'mandates_posted'    => Mandate::whereYear('created_at',$now->year)->count(),
            'mandates_picked'    => MandateClaim::whereYear('created_at',$now->year)->count(),
            'cdd_submitted'      => CddSubmission::whereYear('submitted_at',$now->year)->count(),
            'cdd_to_interview'   => CddSubmission::whereYear('submitted_at',$now->year)->where('client_status','interview')->count(),
            'offers_made'        => CddSubmission::whereYear('submitted_at',$now->year)->where('client_status','offer_made')->count(),
            'placements'         => Placement::whereYear('placed_at',$now->year)->count(),
        ];

        // Recruiter leaderboard
        $leaderboard = Recruiter::with('user')
            ->withCount(['placements as placements_ytd' => fn($q) =>
                $q->whereYear('placed_at',$now->year)
            ])
            ->withSum(['placements as earnings_ytd' => fn($q) =>
                $q->whereYear('placed_at',$now->year)
            ], 'final_payout')
            ->orderByDesc('placements_ytd')
            ->take(10)->get();

        return Inertia::render('Admin/Analytics', [
            'monthlyRevenue'   => $monthlyRevenue,
            'funnel'           => $funnel,
            'leaderboard'      => $leaderboard,
            'avgTimeToFill'    => $this->avgTimeToFill(),
            'clientSatisfaction'=> $this->clientSatisfaction(),
        ]);
    }

    private function avgTimeToFill(): float
    {
        return Placement::join('cdd_submissions','placements.cdd_submission_id','=','cdd_submissions.id')
            ->join('mandate_claims','cdd_submissions.mandate_id','=','mandate_claims.mandate_id')
            ->where('mandate_claims.status','approved')
            ->whereYear('placements.placed_at', now()->year)
            ->selectRaw("AVG(EXTRACT(EPOCH FROM (placements.placed_at - mandate_claims.assigned_at))/86400) as avg_days")
            ->value('avg_days') ?? 0;
    }

    private function clientSatisfaction(): array
    {
        return CddSubmission::whereNotNull('client_status')
            ->where('client_status','!=','pending')
            ->selectRaw("client_status, COUNT(*) as count")
            ->groupBy('client_status')
            ->pluck('count','client_status')
            ->toArray();
    }
}
```
