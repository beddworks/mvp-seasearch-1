<?php

use App\Jobs\TimerCheckJob;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies so redirect()->route() generates correct https:// URLs
        // when running behind nginx / a reverse proxy in production.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role'    => \App\Http\Middleware\EnsureRole::class,
            'profile' => \App\Http\Middleware\EnsureProfileComplete::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->job(new TimerCheckJob())->hourly()->withoutOverlapping();
        $schedule->command('seasearch:daily-digest')->dailyAt('09:00')->withoutOverlapping();
    })->create();
