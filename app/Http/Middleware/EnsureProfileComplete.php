<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->role === 'recruiter') {
            $profileComplete     = $user->recruiter?->profile_complete;
            $skippedThisSession  = session('profile_skip');
            $onProfileRoute      = $request->routeIs('profile.*');

            if (!$profileComplete && !$skippedThisSession && !$onProfileRoute) {
                return redirect()->route('profile.complete');
            }
        }

        return $next($request);
    }
}
