# 13 — Feature: Commission, Earnings & Payouts
> SeaSearch PRD · v2.0  
> Compensation formula engine · Recruiter earnings · Stripe Connect payouts

---

## CompensationType Model

```php
// app/Models/CompensationType.php
class CompensationType extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name','is_active','formula_type','formula_fields',
        'trigger_condition','platform_fee_pct','notes','sort_order',
    ];
    protected $casts = [
        'formula_fields'  => 'array',
        'is_active'       => 'boolean',
        'platform_fee_pct'=> 'decimal:4',
    ];

    public function mandates(): HasMany
    {
        return $this->hasMany(Mandate::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function previewCalculation(float $baseSalary = 120000, float $hoursWorked = 40): float
    {
        $fields = $this->formula_fields;
        return match ($this->formula_type) {
            'percentage' => $baseSalary * ($fields['reward_pct'] ?? 0.15),
            'hourly'     => ($fields['hourly_rate'] ?? 0) * ($fields['hours_billed'] ?? $hoursWorked),
            'fixed'      => $fields['fixed_amount'] ?? 0,
            'milestone'  => collect($fields['milestones'] ?? [])->sum('amount'),
            default      => 0,
        };
    }
}
```

---

## CommissionService (Complete)

```php
// app/Services/CommissionService.php
class CommissionService
{
    public function __construct(
        private TimerService $timerService,
        private NotificationService $notif
    ) {}

    public function calculate(CddSubmission $submission): array
    {
        $mandate  = $submission->mandate->load('compensationType','client');
        $recruiter = $submission->recruiter;
        $compType  = $mandate->compensationType;

        if (!$compType) {
            throw new \RuntimeException("Mandate {$mandate->id} has no compensation type assigned.");
        }

        // 1. Gross reward from formula
        $grossReward = $this->evaluateFormula($compType, $mandate, $submission);

        // 2. Platform fee (per-client override possible)
        $platformFeePct = $compType->platform_fee_pct;  // default 20%
        $platformFee    = $grossReward * $platformFeePct;
        $netPayout      = $grossReward - $platformFee;

        // 3. Tier modifier
        $tierModifier = match ($recruiter->tier) {
            'senior' => 0.05,
            'elite'  => 0.10,
            default  => 0.00,
        };
        $netPayout = $netPayout * (1 + $tierModifier);

        // 4. Timer B penalty (only if Timer B is active on this mandate)
        $claim       = MandateClaim::where('mandate_id', $mandate->id)
                         ->where('recruiter_id', $recruiter->id)
                         ->where('status','approved')
                         ->first();
        $penaltyPct  = $claim ? $this->timerService->calculatePenalty($claim) : 0.0;
        $penaltyAmt  = $netPayout * $penaltyPct;
        $finalPayout = $netPayout - $penaltyAmt;

        // 5. Days late (for record)
        $daysLate = 0;
        if ($claim && $mandate->timer_b_active) {
            $deadline = $claim->timerBDeadlineAt();
            $daysLate = $deadline && now()->gt($deadline)
                ? (int) $deadline->diffInDays(now())
                : 0;
        }

        return [
            'gross_reward'   => round($grossReward, 2),
            'platform_fee'   => round($platformFee, 2),
            'net_payout'     => round($netPayout, 2),
            'penalty_pct'    => $penaltyPct,
            'penalty_amount' => round($penaltyAmt, 2),
            'final_payout'   => round($finalPayout, 2),
            'currency'       => $mandate->salary_currency ?? 'SGD',
            'days_late'      => $daysLate,
            'tier_modifier'  => $tierModifier,
        ];
    }

    private function evaluateFormula(CompensationType $type, Mandate $mandate, CddSubmission $submission): float
    {
        $fields = $type->formula_fields ?? [];
        return match ($type->formula_type) {
            'percentage' => ($mandate->salary_max ?? $mandate->reward_max ?? 0)
                            * ($fields['reward_pct'] ?? 0.15),
            'fixed'      => (float) ($fields['fixed_amount'] ?? 0),
            'hourly'     => ((float)($fields['hourly_rate'] ?? 0))
                            * ((float)($fields['hours_billed'] ?? 0)),
            'milestone'  => collect($fields['milestones'] ?? [])->sum('amount'),
            default      => 0.0,
        };
    }

    public function settle(CddSubmission $submission): Placement
    {
        $financials = $this->calculate($submission);
        $mandate    = $submission->mandate;
        $recruiter  = $submission->recruiter;

        return DB::transaction(function () use ($submission, $financials, $mandate, $recruiter) {
            // Create placement record
            $placement = Placement::create([
                'cdd_submission_id' => $submission->id,
                'mandate_id'        => $mandate->id,
                'recruiter_id'      => $recruiter->id,
                'client_id'         => $mandate->client_id,
                'gross_reward'      => $financials['gross_reward'],
                'platform_fee'      => $financials['platform_fee'],
                'net_payout'        => $financials['net_payout'],
                'penalty_amount'    => $financials['penalty_amount'],
                'final_payout'      => $financials['final_payout'],
                'currency'          => $financials['currency'],
                'payout_status'     => 'pending',
                'placed_at'         => now(),
            ]);

            // Update submission
            $submission->update([
                'penalty_applied' => $financials['penalty_pct'],
                'days_late'       => $financials['days_late'],
            ]);

            // Update mandate
            $mandate->update(['status' => 'filled']);

            // Update recruiter stats
            $recruiter->decrement('active_mandates_count');
            $recruiter->increment('total_placements');
            $recruiter->increment('total_earnings', $financials['final_payout']);

            // Notify
            $this->notif->placementConfirmed($placement);

            return $placement;
        });
    }
}
```

---

## EarningsController (Stage 6 — Complete)

```php
// app/Http/Controllers/Recruiter/EarningsController.php
class EarningsController extends Controller
{
    public function index(): Response
    {
        $recruiter = auth()->user()->recruiter;
        $now       = now();

        // Monthly earnings (last 12 months)
        $monthly = Placement::where('recruiter_id', $recruiter->id)
            ->selectRaw("DATE_TRUNC('month', placed_at) as month, SUM(final_payout) as earnings, COUNT(*) as placements")
            ->where('placed_at', '>=', $now->copy()->subMonths(12)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Pending rewards (candidates at offer/hired stage not yet settled)
        $pending = CddSubmission::where('recruiter_id', $recruiter->id)
            ->whereIn('client_status', ['offer_made','hired'])
            ->whereDoesntHave('placement')
            ->with(['mandate.client','candidate','mandate.compensationType'])
            ->get()
            ->map(function ($sub) {
                $estimate = 0;
                if ($sub->mandate->compensationType) {
                    try {
                        $estimate = app(CommissionService::class)->calculate($sub)['final_payout'];
                    } catch (\Exception) {}
                }
                return [...$sub->toArray(), 'estimated_payout' => $estimate];
            });

        return Inertia::render('Recruiter/Earnings/Index', [
            'summary' => [
                'ytd_earnings'    => Placement::where('recruiter_id',$recruiter->id)
                                        ->whereYear('placed_at',$now->year)->sum('final_payout'),
                'pending_rewards' => $pending->sum('estimated_payout'),
                'placements_ytd'  => Placement::where('recruiter_id',$recruiter->id)
                                        ->whereYear('placed_at',$now->year)->count(),
                'avg_reward'      => Placement::where('recruiter_id',$recruiter->id)
                                        ->whereYear('placed_at',$now->year)->avg('final_payout') ?? 0,
                'available_balance'=> Placement::where('recruiter_id',$recruiter->id)
                                        ->where('payout_status','pending')->sum('final_payout'),
            ],
            'monthly'     => $monthly,
            'placements'  => Placement::where('recruiter_id',$recruiter->id)
                                ->with(['mandate.client','cddSubmission.candidate'])
                                ->latest('placed_at')
                                ->paginate(15),
            'pending'     => $pending,
            'payoutHistory'=> Placement::where('recruiter_id',$recruiter->id)
                                ->whereIn('payout_status',['paid','processing','failed'])
                                ->latest('payout_date')
                                ->take(10)->get(),
        ]);
    }

    public function requestPayout(Request $request): RedirectResponse
    {
        $request->validate([
            'bank_name'      => 'required|string|max:100',
            'account_number' => 'required|string|max:50',
            'account_holder' => 'required|string|max:100',
            'swift_code'     => 'nullable|string|max:20',
        ]);

        $recruiter = auth()->user()->recruiter;

        $pendingPlacements = Placement::where('recruiter_id', $recruiter->id)
            ->where('payout_status', 'pending')
            ->get();

        if ($pendingPlacements->isEmpty()) {
            return redirect()->back()->with('error', 'No pending balance to payout.');
        }

        // Create Stripe transfer (via StripeService)
        try {
            app(StripeService::class)->createTransfer(
                $pendingPlacements->sum('final_payout'),
                $request->only('bank_name','account_number','account_holder','swift_code'),
                $recruiter
            );

            $pendingPlacements->each->update(['payout_status' => 'processing']);
            app(NotificationService::class)->payoutRequested($recruiter, $pendingPlacements->sum('final_payout'));

            return redirect()->back()->with('success', 'Payout request submitted. Processing in 2–3 business days.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Payout failed: ' . $e->getMessage());
        }
    }
}
```

---

## Placement Model

```php
// app/Models/Placement.php
class Placement extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'cdd_submission_id','mandate_id','recruiter_id','client_id',
        'gross_reward','platform_fee','net_payout','penalty_amount','final_payout',
        'currency','payout_status','payout_date','stripe_transfer_id','candidate_start_date','placed_at',
    ];

    protected $casts = [
        'gross_reward'  => 'decimal:2',
        'platform_fee'  => 'decimal:2',
        'net_payout'    => 'decimal:2',
        'penalty_amount'=> 'decimal:2',
        'final_payout'  => 'decimal:2',
        'placed_at'     => 'datetime',
        'payout_date'   => 'datetime',
        'candidate_start_date' => 'date',
    ];

    public function cddSubmission(): BelongsTo { return $this->belongsTo(CddSubmission::class); }
    public function mandate(): BelongsTo      { return $this->belongsTo(Mandate::class); }
    public function recruiter(): BelongsTo    { return $this->belongsTo(Recruiter::class); }
    public function client(): BelongsTo       { return $this->belongsTo(Client::class); }

    public function scopePending(Builder $q): Builder   { return $q->where('payout_status','pending'); }
    public function scopePaid(Builder $q): Builder      { return $q->where('payout_status','paid'); }
}
```

---

## Compensation Types Admin UI

```jsx
// Pages/Admin/Settings/CompensationTypes.jsx
export default function CompensationTypes({ types }) {
    const [editing, setEditing] = useState(null)
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', formula_type: 'percentage', formula_fields: {},
        trigger_condition: 'on_hire', platform_fee_pct: 0.20, notes: '',
    })

    const FORMULA_FIELD_DEFAULTS = {
        percentage: { reward_pct: 0.15, platform_fee_pct: 0.20 },
        hourly:     { hourly_rate: 0, hours_billed: 0, platform_fee_pct: 0.20 },
        fixed:      { fixed_amount: 0, platform_fee_pct: 0.20 },
        milestone:  { milestones: [], platform_fee_pct: 0.20 },
    }

    function handleFormulaTypeChange(type) {
        setData({ ...data, formula_type: type, formula_fields: FORMULA_FIELD_DEFAULTS[type] })
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (editing) {
            put(route('admin.compensation-types.update', editing), { onSuccess: () => { setEditing(null); reset() } })
        } else {
            post(route('admin.compensation-types.store'), { onSuccess: () => reset() })
        }
    }

    return (
        <AdminLayout>
            <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 600 }}>
                        Compensation Types
                    </h1>
                </div>

                {/* Types table */}
                <div className="table-wrap" style={{ marginBottom: 24 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th><th>Formula type</th><th>Platform fee</th>
                                <th>Trigger</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {types.map(type => (
                                <tr key={type.id}>
                                    <td style={{ fontWeight: 500 }}>{type.name}</td>
                                    <td><span className="cbadge cb-sea">{type.formula_type}</span></td>
                                    <td>{(type.platform_fee_pct * 100).toFixed(0)}%</td>
                                    <td><span className="cbadge cb-amb">{type.trigger_condition}</span></td>
                                    <td>
                                        <span className={`cbadge ${type.is_active ? 'cb-jade' : 'cb-rub'}`}>
                                            {type.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => {
                                            setEditing(type.id)
                                            setData({ ...type })
                                        }}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Create/Edit form */}
                <div className="dcard">
                    <div className="dcard-head">
                        <span className="dcard-title">{editing ? 'Edit type' : 'Add new type'}</span>
                        {editing && <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); reset() }}>Cancel</button>}
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Formula type</label>
                            <select className="form-input" value={data.formula_type}
                                onChange={e => handleFormulaTypeChange(e.target.value)}>
                                <option value="percentage">Percentage of salary</option>
                                <option value="hourly">Hourly rate</option>
                                <option value="fixed">Fixed fee</option>
                                <option value="milestone">Per milestone</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Platform fee %</label>
                            <input className="form-input" type="number" step="0.01" min="0" max="1"
                                value={data.platform_fee_pct}
                                onChange={e => setData('platform_fee_pct', parseFloat(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Trigger condition</label>
                            <select className="form-input" value={data.trigger_condition}
                                onChange={e => setData('trigger_condition', e.target.value)}>
                                <option value="on_hire">On hire</option>
                                <option value="on_invoice">On invoice</option>
                                <option value="on_milestone">On milestone</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Formula fields (JSON)</label>
                            <textarea className="form-input" rows={3}
                                value={JSON.stringify(data.formula_fields, null, 2)}
                                onChange={e => {
                                    try { setData('formula_fields', JSON.parse(e.target.value)) } catch {}
                                }} style={{ fontFamily: 'var(--mono)', fontSize: 12 }} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {editing ? 'Update type' : 'Create type'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    )
}
```
