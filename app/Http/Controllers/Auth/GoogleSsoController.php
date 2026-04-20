<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Recruiter;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

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
                'role'              => 'recruiter',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Link google_id if user previously logged in via email
        if (!$user->google_id) {
            $user->update([
                'google_id'  => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
            ]);
        }

        // Auto-create recruiter profile on first SSO login
        if ($user->role === 'recruiter' && !$user->recruiter) {
            Recruiter::create([
                'user_id'               => $user->id,
                'tier'                  => 'junior',
                'trust_level'           => 'standard',
                'active_mandates_count' => 0,
                'profile_complete'      => false,
            ]);
        }

        Auth::login($user, remember: true);

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
