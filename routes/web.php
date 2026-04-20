<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\CddApprovalController;
use App\Http\Controllers\Admin\ClaimApprovalController;
use App\Http\Controllers\Admin\ClientManagementController;
use App\Http\Controllers\Admin\CompensationTypeController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ExceptionRuleController;
use App\Http\Controllers\Admin\MandateManagementController;
use App\Http\Controllers\Admin\RecruiterManagementController;
use App\Http\Controllers\Admin\ReportTemplateController;
use App\Http\Controllers\Admin\TimerConfigController;
use App\Http\Controllers\Auth\GoogleSsoController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Client\SubmissionFeedbackController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Root ────────────────────────────────────────────────────
Route::get('/', fn () => redirect()->route('login'));

// ─── Auth ────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login',  [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    Route::get('/auth/google',          [GoogleSsoController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleSsoController::class, 'callback'])->name('auth.google.callback');
});

Route::post('/logout', [LoginController::class, 'destroy'])->name('logout')->middleware('auth');

// ─── Profile Completion ──────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/profile/complete',  [ProfileController::class, 'show'])->name('profile.complete');
    Route::post('/profile/complete', [ProfileController::class, 'store'])->name('profile.complete.store');
    Route::post('/profile/skip',     [ProfileController::class, 'skip'])->name('profile.skip');
});

// ─── Recruiter ───────────────────────────────────────────────
Route::middleware(['auth', 'role:recruiter', 'profile'])
    ->prefix('recruiter')
    ->name('recruiter.')
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Recruiter\DashboardController::class, 'index'])->name('dashboard');

        // Mandates (job board)
        Route::get('/mandates', [\App\Http\Controllers\Recruiter\MandateController::class, 'index'])->name('mandates.index');
        Route::get('/mandates/{mandate}', [\App\Http\Controllers\Recruiter\MandateController::class, 'show'])->name('mandates.show');
        Route::post('/mandates/{mandate}/pick', [\App\Http\Controllers\Recruiter\MandateController::class, 'pick'])->name('mandates.pick');
        Route::get('/mandates/{mandate}/workspace', [\App\Http\Controllers\Recruiter\MandateController::class, 'workspace'])->name('mandates.workspace');

        // Candidates
        Route::get('/candidates', [\App\Http\Controllers\Recruiter\CandidateController::class, 'index'])->name('candidates.index');
        Route::get('/candidates/{candidate}', [\App\Http\Controllers\Recruiter\CandidateController::class, 'show'])->name('candidates.show');
        Route::post('/candidates', [\App\Http\Controllers\Recruiter\CandidateController::class, 'store'])->name('candidates.store');
        Route::put('/candidates/{candidate}', [\App\Http\Controllers\Recruiter\CandidateController::class, 'update'])->name('candidates.update');
        Route::post('/candidates/{candidate}/upload-cv', [\App\Http\Controllers\Recruiter\CandidateController::class, 'uploadCv'])->name('candidates.upload-cv');

        // CDD Submissions
        Route::post('/submissions', [\App\Http\Controllers\Recruiter\CddSubmissionController::class, 'store'])->name('submissions.store');
        Route::put('/submissions/{submission}', [\App\Http\Controllers\Recruiter\CddSubmissionController::class, 'update'])->name('submissions.update');

        // Earnings
        Route::get('/earnings', [\App\Http\Controllers\Recruiter\EarningsController::class, 'index'])->name('earnings.index');

        // Notifications
        Route::get('/notifications', [\App\Http\Controllers\Recruiter\NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/{id}/read', [\App\Http\Controllers\Recruiter\NotificationController::class, 'read'])->name('notifications.read');
        Route::post('/notifications/read-all', [\App\Http\Controllers\Recruiter\NotificationController::class, 'readAll'])->name('notifications.read-all');

        // AI endpoints
        Route::post('/ai/generate-brief/{submission}',      [\App\Http\Controllers\Recruiter\AiController::class, 'generateBrief'])->name('ai.brief');
        Route::post('/ai/draft-outreach/{candidate}',       [\App\Http\Controllers\Recruiter\AiController::class, 'draftOutreach'])->name('ai.outreach');
        Route::post('/ai/interview-questions/{submission}', [\App\Http\Controllers\Recruiter\AiController::class, 'interviewQuestions'])->name('ai.questions');
        Route::post('/ai/run-matching/{mandate}',           [\App\Http\Controllers\Recruiter\AiController::class, 'runMatching'])->name('ai.matching');

        // Kanban
        Route::get('/kanban/{mandate}',                [\App\Http\Controllers\Recruiter\KanbanController::class, 'show'])->name('kanban.show');
        Route::post('/kanban/move',                    [\App\Http\Controllers\Recruiter\KanbanController::class, 'move'])->name('kanban.move');
        Route::post('/kanban/schedule-interview',      [\App\Http\Controllers\Recruiter\KanbanController::class, 'scheduleInterview'])->name('kanban.schedule-interview');
        Route::post('/kanban/save-client-feedback',    [\App\Http\Controllers\Recruiter\KanbanController::class, 'saveClientFeedback'])->name('kanban.save-client-feedback');
        Route::post('/kanban/submit-to-client',        [\App\Http\Controllers\Recruiter\KanbanController::class, 'submitToClient'])->name('kanban.submit-to-client');
        Route::post('/kanban/reject',                  [\App\Http\Controllers\Recruiter\KanbanController::class, 'reject'])->name('kanban.reject');
        Route::post('/kanban/add-candidate',           [\App\Http\Controllers\Recruiter\KanbanController::class, 'addCandidate'])->name('kanban.add-candidate');
    });

// ─── Admin ───────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin,super_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Mandate management
        Route::get('/mandates',                  [MandateManagementController::class, 'index'])->name('mandates.index');
        Route::post('/mandates',                 [MandateManagementController::class, 'store'])->name('mandates.store');
        Route::get('/mandates/{mandate}',        [MandateManagementController::class, 'show'])->name('mandates.show');
        Route::put('/mandates/{mandate}',        [MandateManagementController::class, 'update'])->name('mandates.update');
        Route::post('/mandates/{mandate}/publish',  [MandateManagementController::class, 'publish'])->name('mandates.publish');
        Route::post('/mandates/{mandate}/pause',    [MandateManagementController::class, 'pause'])->name('mandates.pause');
        Route::post('/mandates/{mandate}/close',    [MandateManagementController::class, 'close'])->name('mandates.close');
        Route::post('/mandates/{mandate}/reassign', [MandateManagementController::class, 'reassign'])->name('mandates.reassign');

        // Claim approvals
        Route::get('/claims',                    [ClaimApprovalController::class, 'index'])->name('claims.index');
        Route::post('/claims/{claim}/approve',   [ClaimApprovalController::class, 'approve'])->name('claims.approve');
        Route::post('/claims/{claim}/reject',    [ClaimApprovalController::class, 'reject'])->name('claims.reject');

        // CDD approvals
        Route::get('/submissions',                      [CddApprovalController::class, 'index'])->name('submissions.index');
        Route::post('/submissions/{submission}/approve', [CddApprovalController::class, 'approve'])->name('submissions.approve');
        Route::post('/submissions/{submission}/reject',  [CddApprovalController::class, 'reject'])->name('submissions.reject');

        // Client management
        Route::get('/clients',              [ClientManagementController::class, 'index'])->name('clients.index');
        Route::post('/clients',             [ClientManagementController::class, 'store'])->name('clients.store');
        Route::get('/clients/{client}',     [ClientManagementController::class, 'show'])->name('clients.show');
        Route::put('/clients/{client}',     [ClientManagementController::class, 'update'])->name('clients.update');
        Route::delete('/clients/{client}',  [ClientManagementController::class, 'destroy'])->name('clients.destroy');
        Route::post('/clients/{client}/send-gsheet', [ClientManagementController::class, 'sendGsheet'])->name('clients.send-gsheet');

        // Recruiter management
        Route::get('/recruiters',                       [RecruiterManagementController::class, 'index'])->name('recruiters.index');
        Route::get('/recruiters/{recruiter}',           [RecruiterManagementController::class, 'show'])->name('recruiters.show');
        Route::post('/recruiters/{recruiter}/approve',  [RecruiterManagementController::class, 'approve'])->name('recruiters.approve');
        Route::post('/recruiters/{recruiter}/suspend',  [RecruiterManagementController::class, 'suspend'])->name('recruiters.suspend');
        Route::post('/recruiters/{recruiter}/set-tier', [RecruiterManagementController::class, 'setTier'])->name('recruiters.set-tier');
        Route::post('/recruiters/{recruiter}/set-trust',[RecruiterManagementController::class, 'setTrust'])->name('recruiters.set-trust');
        Route::post('/recruiters/{recruiter}/set-group',[RecruiterManagementController::class, 'setGroup'])->name('recruiters.set-group');

        // Settings
        Route::get('/settings/compensation-types',                [CompensationTypeController::class, 'index'])->name('compensation-types.index');
        Route::post('/settings/compensation-types',               [CompensationTypeController::class, 'store'])->name('compensation-types.store');
        Route::put('/settings/compensation-types/{compensationType}', [CompensationTypeController::class, 'update'])->name('compensation-types.update');
        Route::delete('/settings/compensation-types/{compensationType}', [CompensationTypeController::class, 'destroy'])->name('compensation-types.destroy');

        Route::get('/settings/exception-rules',                   [ExceptionRuleController::class, 'index'])->name('exception-rules.index');
        Route::post('/settings/exception-rules',                  [ExceptionRuleController::class, 'store'])->name('exception-rules.store');
        Route::post('/settings/exception-rules/{rule}/toggle',    [ExceptionRuleController::class, 'toggle'])->name('exception-rules.toggle');
        Route::delete('/settings/exception-rules/{rule}',         [ExceptionRuleController::class, 'destroy'])->name('exception-rules.destroy');

        Route::get('/settings/timer-config',             [TimerConfigController::class, 'index'])->name('timer-config.index');
        Route::put('/settings/timer-config/{mandate}',   [TimerConfigController::class, 'update'])->name('timer-config.update');

        // Report templates
        Route::get('/report-templates',                   [ReportTemplateController::class, 'index'])->name('report-templates.index');
        Route::post('/report-templates',                  [ReportTemplateController::class, 'store'])->name('report-templates.store');
        Route::put('/report-templates/{reportTemplate}',  [ReportTemplateController::class, 'update'])->name('report-templates.update');
        Route::delete('/report-templates/{reportTemplate}',[ReportTemplateController::class, 'destroy'])->name('report-templates.destroy');
        Route::post('/report-templates/{reportTemplate}/preview', [ReportTemplateController::class, 'preview'])->name('report-templates.preview');
        Route::post('/report-templates/{reportTemplate}/send',    [ReportTemplateController::class, 'send'])->name('report-templates.send');

        // Analytics
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    });

// ─── Tokenized Client Feedback (public — no auth) ────────────
Route::get('/feedback/confirmed', fn () => Inertia::render('Client/Feedback/Confirmed'))->name('feedback.confirmed');
Route::get('/feedback/{token}',   [SubmissionFeedbackController::class, 'show'])->name('feedback.show');
Route::post('/feedback/{token}',  [SubmissionFeedbackController::class, 'update'])->name('feedback.update');
