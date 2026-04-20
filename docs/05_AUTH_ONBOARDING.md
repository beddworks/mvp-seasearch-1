# 05 — Auth & Onboarding
> SeaSearch PRD · v2.0 · Laravel 13 + Inertia + React

---

## Auth Flow Overview

```
Visitor hits /login
    ↓
Clicks "Sign in with Google"
    ↓
Google OAuth callback → user created/fetched
    ↓
Role assigned (recruiter by default)
    ↓
Profile completion page (SKIPPABLE)
    ↓
Redirect to role dashboard
```

Non-SSO (email/password) is supported for admin accounts only.
Recruiters always use Google SSO.
Clients have no self-login yet — admin manages client records via CRUD.

---

## 1. Google SSO (Socialite)

### Config
```php
// config/services.php
'google' => [
    'client_id'     => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect'      => env('GOOGLE_REDIRECT_URI'),
],
```

### Routes
```php
// routes/web.php
Route::get('/auth/google',          [GoogleSsoController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleSsoController::class, 'callback'])->name('auth.google.callback');
```

### Controller
```php
// app/Http/Controllers/Auth/GoogleSsoController.php
class GoogleSsoController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Google login failed. Please try again.');
        }

        // Find or create user
        $user = User::firstOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name'              => $googleUser->getName(),
                'email'             => $googleUser->getEmail(),
                'google_id'         => $googleUser->getId(),
                'avatar_url'        => $googleUser->getAvatar(),
                'role'              => 'recruiter',   // default role for SSO
                'status'            => 'active',      // auto-approved
                'email_verified_at' => now(),
            ]
        );

        // If user exists but logged in via email before — link google_id
        if (!$user->google_id) {
            $user->update(['google_id' => $googleUser->getId(), 'avatar_url' => $googleUser->getAvatar()]);
        }

        // Create recruiter profile if not exists
        if ($user->role === 'recruiter' && !$user->recruiter) {
            Recruiter::create([
                'user_id'             => $user->id,
                'tier'                => 'junior',
                'trust_level'         => 'standard',
                'active_mandates_count' => 0,
                'profile_complete'    => false,
            ]);
        }

        Auth::login($user, remember: true);

        // Redirect based on role
        return $this->redirectAfterLogin($user);
    }

    private function redirectAfterLogin(User $user): RedirectResponse
    {
        return match ($user->role) {
            'super_admin', 'admin' => redirect()->route('admin.dashboard'),
            'recruiter'            => $user->recruiter?->profile_complete
                                       ? redirect()->route('recruiter.dashboard')
                                       : redirect()->route('profile.complete'),
            'client'               => redirect()->route('client.portal.index'),
            default                => redirect()->route('login'),
        };
    }
}
```

---

## 2. Email/Password Login (Admin Only)

```php
// app/Http/Controllers/Auth/LoginController.php
class LoginController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            return back()->withErrors(['email' => 'These credentials do not match our records.']);
        }

        $request->session()->regenerate();

        $user = Auth::user();

        // Only admin can use email/password
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            Auth::logout();
            return back()->withErrors(['email' => 'Please use Google Sign-In to access your account.']);
        }

        return redirect()->route('admin.dashboard');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }
}
```

### Login Page (React)
```jsx
// Pages/Auth/Login.jsx
import { useForm } from '@inertiajs/react'

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '', password: '', remember: false,
    })

    return (
        <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--mist)', border: '1px solid var(--wire)', borderRadius: 'var(--r)', padding: 32, width: 380 }}>
                {/* Logo */}
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                    Sea<span style={{ color: 'var(--sea2)' }}>Search</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink4)', marginBottom: 24 }}>Executive recruitment platform</p>

                {/* Google SSO — primary */}
                <a href={route('auth.google')} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '10px 0', borderRadius: 'var(--rsm)',
                    border: '1px solid var(--wire)', background: '#fff',
                    fontSize: 13, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none',
                    marginBottom: 20, cursor: 'pointer',
                }}>
                    <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="" />
                    Continue with Google
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--wire)' }} />
                    <span style={{ fontSize: 11, color: 'var(--ink4)' }}>Admin email login</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--wire)' }} />
                </div>

                {/* Email/password — admin only */}
                <form onSubmit={e => { e.preventDefault(); post(route('login')) }}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={data.email}
                            onChange={e => setData('email', e.target.value)} />
                        {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={data.password}
                            onChange={e => setData('password', e.target.value)} />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} disabled={processing}>
                        {processing ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    )
}
```

---

## 3. Profile Completion (Recruiter — Skippable)

Shown once after first SSO login. Recruiter can skip and complete later.

### Route
```php
Route::middleware('auth')->group(function () {
    Route::get('/profile/complete', [ProfileController::class, 'show'])->name('profile.complete');
    Route::post('/profile/complete', [ProfileController::class, 'store'])->name('profile.complete.store');
    Route::post('/profile/skip', [ProfileController::class, 'skip'])->name('profile.skip');
});
```

### Controller
```php
// app/Http/Controllers/Auth/ProfileController.php
class ProfileController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/ProfileComplete', [
            'recruiter'         => auth()->user()->recruiter,
            'compensationTypes' => CompensationType::where('is_active', true)->get(['id','name','formula_type']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'display_name'         => 'nullable|string|max:100',
            'phone'                => 'nullable|string|max:30',
            'linkedin_url'         => 'nullable|url|max:255',
            'years_experience'     => 'nullable|integer|min:0|max:50',
            'current_firm'         => 'nullable|string|max:100',
            'bio'                  => 'nullable|string|max:1000',
            'ea_license_number'    => 'nullable|string|max:50',
            'ea_certificate'       => 'nullable|file|mimes:pdf|max:5120',
            'industries'           => 'nullable|array',
            'geographies'          => 'nullable|array',
            'specialty'            => 'nullable|string|max:200',
            'recruiter_group'      => 'nullable|string|max:50',
        ]);

        $recruiter = auth()->user()->recruiter;

        // Handle EA certificate upload
        if ($request->hasFile('ea_certificate')) {
            $path = $request->file('ea_certificate')->store("ea-certs/{$recruiter->id}", 's3');
            $validated['ea_certificate_url'] = $path;
        }

        $recruiter->update([
            ...$validated,
            'profile_complete' => true,
        ]);

        return redirect()->route('recruiter.dashboard')
            ->with('success', 'Profile saved! Welcome to SeaSearch.');
    }

    public function skip(): RedirectResponse
    {
        // Mark profile as "seen" so we don't redirect again this session
        session(['profile_skip' => true]);
        return redirect()->route('recruiter.dashboard');
    }
}
```

### Profile Completion Page (React)
```jsx
// Pages/Auth/ProfileComplete.jsx
import { useForm } from '@inertiajs/react'
import { router } from '@inertiajs/react'

export default function ProfileComplete({ recruiter, compensationTypes }) {
    const { data, setData, post, processing, errors } = useForm({
        display_name: recruiter.display_name || '',
        phone: '', linkedin_url: '', years_experience: '',
        current_firm: '', bio: '', ea_license_number: '',
        ea_certificate: null, industries: [], geographies: [], specialty: '',
    })

    const INDUSTRIES = ['Technology','Finance & Banking','Healthcare','FMCG','Consulting','Real Estate','Supply Chain','Legal']
    const GEOS = ['Singapore','Malaysia','Indonesia','Thailand','Philippines','Regional SEA']

    return (
        <div style={{ minHeight: '100vh', background: 'var(--mist2)', display: 'flex', flexDirection: 'column' }}>
            {/* Topbar */}
            <div style={{ height: 'var(--topbar)', background: 'var(--ink)', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    Sea<span style={{ color: 'var(--sea3)' }}>Search</span>
                </span>
            </div>

            <div style={{ maxWidth: 640, margin: '32px auto', width: '100%', padding: '0 20px' }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
                        Complete your profile
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--ink4)', marginTop: 4 }}>
                        Help clients and admin know who you are. You can skip this and complete later.
                    </p>
                </div>

                <form onSubmit={e => { e.preventDefault(); post(route('profile.complete.store')) }}
                    encType="multipart/form-data">
                    <div className="dcard" style={{ marginBottom: 16 }}>
                        <div className="dcard-head"><span className="dcard-title">Basic info</span></div>
                        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Display name</label>
                                <input className="form-input" value={data.display_name}
                                    onChange={e => setData('display_name', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={data.phone}
                                    onChange={e => setData('phone', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">LinkedIn URL</label>
                                <input className="form-input" type="url" value={data.linkedin_url}
                                    onChange={e => setData('linkedin_url', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Years of experience</label>
                                <input className="form-input" type="number" value={data.years_experience}
                                    onChange={e => setData('years_experience', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current firm</label>
                                <input className="form-input" value={data.current_firm}
                                    onChange={e => setData('current_firm', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Bio <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(shown to clients)</span></label>
                                <textarea className="form-input" rows={3} value={data.bio}
                                    onChange={e => setData('bio', e.target.value)}
                                    style={{ resize: 'vertical' }} />
                            </div>
                        </div>
                    </div>

                    <div className="dcard" style={{ marginBottom: 16 }}>
                        <div className="dcard-head"><span className="dcard-title">EA License (Singapore)</span></div>
                        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">EA License number</label>
                                <input className="form-input" value={data.ea_license_number}
                                    onChange={e => setData('ea_license_number', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">EA Certificate (PDF)</label>
                                <input type="file" accept=".pdf"
                                    onChange={e => setData('ea_certificate', e.target.files[0])}
                                    style={{ fontSize: 12, color: 'var(--ink4)' }} />
                            </div>
                        </div>
                    </div>

                    <div className="dcard" style={{ marginBottom: 24 }}>
                        <div className="dcard-head"><span className="dcard-title">Specialty & focus</span></div>
                        <div style={{ padding: '14px 16px' }}>
                            <div className="form-group">
                                <label className="form-label">Primary specialty</label>
                                <input className="form-input" placeholder="e.g. CHRO / HR leadership in banking"
                                    value={data.specialty}
                                    onChange={e => setData('specialty', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Industries</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    {INDUSTRIES.map(ind => (
                                        <button key={ind} type="button"
                                            className={data.industries.includes(ind) ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                                            onClick={() => setData('industries',
                                                data.industries.includes(ind)
                                                    ? data.industries.filter(i => i !== ind)
                                                    : [...data.industries, ind]
                                            )}>
                                            {ind}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Geographic focus</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    {GEOS.map(geo => (
                                        <button key={geo} type="button"
                                            className={data.geographies.includes(geo) ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                                            onClick={() => setData('geographies',
                                                data.geographies.includes(geo)
                                                    ? data.geographies.filter(g => g !== geo)
                                                    : [...data.geographies, geo]
                                            )}>
                                            {geo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn btn-primary" disabled={processing}>
                            {processing ? 'Saving…' : 'Save profile'}
                        </button>
                        <button type="button" className="btn btn-ghost"
                            onClick={() => router.post(route('profile.skip'))}>
                            Skip for now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
```

---

## 4. Models — Relationships & Scopes

### User.php
```php
// app/Models/User.php
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    protected $fillable = ['name','email','password','google_id','avatar_url','role','status','email_verified_at'];
    protected $hidden   = ['password','remember_token'];
    protected $casts    = ['email_verified_at' => 'datetime', 'password' => 'hashed'];

    // Relationships
    public function recruiter(): HasOne
    {
        return $this->hasOne(Recruiter::class);
    }

    public function clientProfile(): HasOne
    {
        return $this->hasOne(Client::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    // Scopes
    public function scopeAdmins(Builder $query): Builder
    {
        return $query->whereIn('role', ['admin','super_admin']);
    }

    public function scopeRecruiters(Builder $query): Builder
    {
        return $query->where('role', 'recruiter');
    }

    // Helpers
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin','super_admin']);
    }

    public function isRecruiter(): bool
    {
        return $this->role === 'recruiter';
    }
}
```

### Recruiter.php
```php
// app/Models/Recruiter.php
class Recruiter extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id','display_name','phone','linkedin_url','bio','avatar_url',
        'years_experience','current_firm','ea_license_number','ea_certificate_url',
        'profile_complete','recruiter_group','recruiter_group_secondary',
        'tier','trust_level','industries','seniority_focus','geographies',
        'specialty','total_placements','total_earnings','active_mandates_count',
    ];

    protected $casts = [
        'industries'      => 'array',
        'seniority_focus' => 'array',
        'geographies'     => 'array',
        'profile_complete'=> 'boolean',
        'total_earnings'  => 'decimal:2',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(MandateClaim::class);
    }

    public function activeClaims(): HasMany
    {
        return $this->hasMany(MandateClaim::class)->where('status','approved');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(CddSubmission::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
    }

    // Scopes
    public function scopeTrusted(Builder $query): Builder
    {
        return $query->where('trust_level','trusted');
    }

    public function scopeWithCapacity(Builder $query): Builder
    {
        return $query->where('active_mandates_count','<', 2);
    }

    public function scopeByGroup(Builder $query, string $group): Builder
    {
        return $query->where('recruiter_group', $group);
    }

    // Helpers
    public function hasCapacity(): bool
    {
        return $this->active_mandates_count < 2;
    }

    public function isTrusted(): bool
    {
        return $this->trust_level === 'trusted';
    }

    public function displayName(): string
    {
        return $this->display_name ?? $this->user->name;
    }
}
```

### Mandate.php
```php
// app/Models/Mandate.php
class Mandate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'client_id','posted_by_user_id','compensation_type_id',
        'title','description','location','seniority','industry','contract_type',
        'openings_count','is_remote','salary_min','salary_max','salary_currency',
        'reward_min','reward_max','reward_pct',
        'must_haves','nice_to_haves','green_flags','red_flags',
        'screening_questions','ideal_candidates','ideal_source_companies',
        'status','is_exclusive','exclusive_recruiter_id','exclusive_expires_at',
        'is_featured','is_fast_track','timer_a_days','timer_b_active','timer_b_days',
        'timer_b_penalty_d6','timer_b_penalty_d7','timer_b_penalty_d8plus',
        'timer_c_active','timer_c_sla_days','gsheet_tab_name',
        'published_at','original_post_date','assignment_count',
    ];

    protected $casts = [
        'must_haves'           => 'array',
        'nice_to_haves'        => 'array',
        'green_flags'          => 'array',
        'red_flags'            => 'array',
        'screening_questions'  => 'array',
        'ideal_candidates'     => 'array',
        'ideal_source_companies'=> 'array',
        'is_exclusive'         => 'boolean',
        'is_featured'          => 'boolean',
        'is_fast_track'        => 'boolean',
        'timer_b_active'       => 'boolean',
        'timer_c_active'       => 'boolean',
        'is_remote'            => 'boolean',
        'published_at'         => 'datetime',
        'original_post_date'   => 'datetime',
        'exclusive_expires_at' => 'datetime',
    ];

    // Relationships
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function postedBy(): BelongsTo { return $this->belongsTo(User::class,'posted_by_user_id'); }
    public function compensationType(): BelongsTo { return $this->belongsTo(CompensationType::class); }
    public function claims(): HasMany { return $this->hasMany(MandateClaim::class); }
    public function submissions(): HasMany { return $this->hasMany(CddSubmission::class); }

    public function activeClaim(): HasOne
    {
        return $this->hasOne(MandateClaim::class)->where('status','approved')->latest();
    }

    public function assignedRecruiter(): ?Recruiter
    {
        return $this->activeClaim?->recruiter;
    }

    // Scopes
    public function scopeActive(Builder $query): Builder { return $query->where('status','active'); }
    public function scopePublished(Builder $query): Builder { return $query->whereNotNull('published_at'); }
    public function scopeFeatured(Builder $query): Builder { return $query->where('is_featured',true); }
    public function scopeExclusive(Builder $query): Builder { return $query->where('is_exclusive',true); }
    public function scopeForRecruiter(Builder $query, Recruiter $recruiter): Builder
    {
        return $query->whereHas('claims', fn($q) =>
            $q->where('recruiter_id',$recruiter->id)->where('status','approved')
        );
    }
    public function scopeUnclaimed(Builder $query): Builder
    {
        return $query->whereDoesntHave('claims', fn($q) =>
            $q->whereIn('status',['pending','approved'])
        );
    }

    // Helpers
    public function isDropped(): bool { return $this->status === 'dropped'; }
    public function isFilled(): bool  { return $this->status === 'filled'; }
    public function canBeReassigned(): bool { return $this->assignment_count < 3; }
    public function globalAgeDays(): int
    {
        return $this->original_post_date
            ? (int) $this->original_post_date->diffInDays(now())
            : 0;
    }
}
```

### MandateClaim.php
```php
// app/Models/MandateClaim.php
class MandateClaim extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'mandate_id','recruiter_id','status','reviewed_by',
        'admin_note','reviewed_at','rejection_count','is_retry','assigned_at',
    ];
    protected $casts = ['reviewed_at'=>'datetime','assigned_at'=>'datetime','is_retry'=>'boolean'];

    public function mandate(): BelongsTo { return $this->belongsTo(Mandate::class); }
    public function recruiter(): BelongsTo { return $this->belongsTo(Recruiter::class); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class,'reviewed_by'); }

    // Timer helpers — computed, never stored
    public function daysSinceAssignment(): int
    {
        return $this->assigned_at ? (int) $this->assigned_at->diffInDays(now()) : 0;
    }

    public function timerADeadlineAt(): ?Carbon
    {
        return $this->assigned_at?->addDays($this->mandate->timer_a_days);
    }

    public function timerAOverdue(): bool
    {
        return $this->assigned_at && now()->gt($this->timerADeadlineAt());
    }

    public function timerBDeadlineAt(): ?Carbon
    {
        return $this->assigned_at?->addDays($this->mandate->timer_b_days);
    }
}
```

### CddSubmission.php
```php
// app/Models/CddSubmission.php
class CddSubmission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'mandate_id','recruiter_id','candidate_id','submitted_at','recruiter_note',
        'submission_number','ai_score','score_breakdown','ai_summary','green_flags','red_flags',
        'admin_review_status','admin_reviewed_by','admin_reviewed_at','admin_note',
        'admin_rejection_count','exception_bypass','client_status','client_status_updated_at',
        'client_rejection_reason','interview_date','interview_format','interview_notes',
        'interview_feedback','interview_feedback_stars','interview_verdict',
        'token','token_created_at','token_used_at','token_action','gsheet_row_index',
        'penalty_applied','days_late',
    ];

    protected $casts = [
        'submitted_at'            => 'datetime',
        'admin_reviewed_at'       => 'datetime',
        'client_status_updated_at'=> 'datetime',
        'interview_date'          => 'datetime',
        'token_created_at'        => 'datetime',
        'token_used_at'           => 'datetime',
        'score_breakdown'         => 'array',
        'green_flags'             => 'array',
        'red_flags'               => 'array',
        'exception_bypass'        => 'boolean',
    ];

    public function mandate(): BelongsTo   { return $this->belongsTo(Mandate::class); }
    public function recruiter(): BelongsTo { return $this->belongsTo(Recruiter::class); }
    public function candidate(): BelongsTo { return $this->belongsTo(Candidate::class); }
    public function reviewer(): BelongsTo  { return $this->belongsTo(User::class,'admin_reviewed_by'); }
    public function placement(): HasOne    { return $this->hasOne(Placement::class); }

    public function scopePendingAdminReview(Builder $query): Builder
    {
        return $query->where('admin_review_status','pending');
    }

    public function scopeApprovedByAdmin(Builder $query): Builder
    {
        return $query->whereIn('admin_review_status',['approved','bypassed']);
    }

    public function isSlotBurned(): bool
    {
        return $this->admin_review_status === 'rejected' && $this->admin_rejection_count >= 2;
    }

    public function tokenValid(): bool
    {
        return $this->token && !$this->token_used_at;
    }
}
```

---

## 5. Middleware Stack

### EnsureRole.php
```php
// app/Http/Middleware/EnsureRole.php
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, $roles)) {
            if ($request->expectsJson()) abort(403);
            return redirect()->route('login')->with('error', 'Unauthorized access.');
        }
        return $next($request);
    }
}
```

Register in `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role'    => \App\Http\Middleware\EnsureRole::class,
        'profile' => \App\Http\Middleware\EnsureProfileComplete::class,
    ]);
})
```

### EnsureProfileComplete.php
```php
// app/Http/Middleware/EnsureProfileComplete.php
class EnsureProfileComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user?->role === 'recruiter') {
            $profileComplete  = $user->recruiter?->profile_complete;
            $skippedThisSession = session('profile_skip');
            $onProfileRoute   = $request->routeIs('profile.*');

            if (!$profileComplete && !$skippedThisSession && !$onProfileRoute) {
                return redirect()->route('profile.complete');
            }
        }
        return $next($request);
    }
}
```

---

## 6. Migration Order (FK-safe)

```
2024_01_01_000001_create_users_table.php
2024_01_01_000002_create_compensation_types_table.php
2024_01_01_000003_create_clients_table.php
2024_01_01_000004_create_recruiters_table.php
2024_01_01_000005_create_mandates_table.php
2024_01_01_000006_create_mandate_claims_table.php
2024_01_01_000007_create_candidates_table.php
2024_01_01_000008_create_cdd_submissions_table.php
2024_01_01_000009_create_placements_table.php
2024_01_01_000010_create_exception_rules_table.php
2024_01_01_000011_create_exception_rule_audit_table.php
2024_01_01_000012_create_notifications_table.php
2024_01_01_000013_create_gsheet_sync_log_table.php
2024_01_01_000014_create_report_templates_table.php
```

---

## 7. DatabaseSeeder

```php
// database/seeders/DatabaseSeeder.php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Super admin
        $admin = User::create([
            'name'              => 'Sea Search Admin',
            'email'             => 'admin@seasearch.asia',
            'password'          => Hash::make('change-me-immediately'),
            'role'              => 'super_admin',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        // Default compensation types
        CompensationType::insert([
            ['id' => Str::uuid(),'name'=>'Percentage of Salary','formula_type'=>'percentage',
             'formula_fields'=>'{"reward_pct":0.15,"platform_fee_pct":0.20}',
             'trigger_condition'=>'on_hire','platform_fee_pct'=>0.20,'sort_order'=>1,
             'created_at'=>now(),'updated_at'=>now()],
            ['id' => Str::uuid(),'name'=>'Hourly Rate','formula_type'=>'hourly',
             'formula_fields'=>'{"hourly_rate":0,"hours_billed":0,"platform_fee_pct":0.20}',
             'trigger_condition'=>'on_invoice','platform_fee_pct'=>0.20,'sort_order'=>2,
             'created_at'=>now(),'updated_at'=>now()],
            ['id' => Str::uuid(),'name'=>'Fixed Fee','formula_type'=>'fixed',
             'formula_fields'=>'{"fixed_amount":0,"platform_fee_pct":0.20}',
             'trigger_condition'=>'on_hire','platform_fee_pct'=>0.20,'sort_order'=>3,
             'created_at'=>now(),'updated_at'=>now()],
            ['id' => Str::uuid(),'name'=>'Per Project','formula_type'=>'milestone',
             'formula_fields'=>'{"milestones":[],"platform_fee_pct":0.20}',
             'trigger_condition'=>'on_milestone','platform_fee_pct'=>0.20,'sort_order'=>4,
             'created_at'=>now(),'updated_at'=>now()],
        ]);

        // Default exception rule
        ExceptionRule::create([
            'name'        => 'Trusted recruiter bypass',
            'description' => 'Recruiters with trust_level=trusted skip admin CDD review',
            'is_active'   => false,  // OFF by default — admin enables when ready
            'rule_type'   => 'recruiter_trust',
            'trust_level' => 'trusted',
            'created_by'  => $admin->id,
        ]);
    }
}
```
