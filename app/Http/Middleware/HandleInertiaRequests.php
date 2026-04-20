<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user      = $request->user();
        $recruiter  = $user?->recruiter;

        return [
            ...parent::share($request),
            'auth' => [
                'user'      => $user ? [
                    'id'         => $user->id,
                    'name'       => $user->name,
                    'email'      => $user->email,
                    'role'       => $user->role,
                    'avatar_url' => $user->avatar_url,
                ] : null,
                'recruiter' => $recruiter ? [
                    'id'                    => $recruiter->id,
                    'tier'                  => $recruiter->tier,
                    'trust_level'           => $recruiter->trust_level,
                    'active_mandates_count' => $recruiter->active_mandates_count,
                    'display_name'          => $recruiter->display_name,
                    'profile_complete'      => $recruiter->profile_complete,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
            'unread_notifications' => $user
                ? \App\Models\AppNotification::where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->count()
                : 0,
        ];
    }
}
