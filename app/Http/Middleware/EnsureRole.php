<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        \Log::info('EnsureRole check', [
            'user'       => $user?->id,
            'user_role'  => $user?->role,
            'required'   => $roles,
            'session_id' => session()->getId(),
            'authed'     => (bool) $user,
        ]);

        if (!$user || !in_array($user->role, $roles)) {
            if ($request->expectsJson()) {
                abort(403, 'Unauthorized.');
            }
            return redirect()->route('login')->with('error', 'Unauthorized access.');
        }

        return $next($request);
    }
}
