<?php

use App\Http\Controllers\Auth\GoogleSsoController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ProfileController;
use Illuminate\Support\Facades\Route;

// ─── Root ────────────────────────────────────────────────────
Route::get('/', fn () => redirect()->route('login'));

// ─── Auth ────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login',  [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    // Google SSO
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
    });

// ─── Admin ───────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin,super_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    });

