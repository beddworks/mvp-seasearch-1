<?php

namespace App\Services;

use App\Models\CddSubmission;
use Illuminate\Support\Str;

class TokenService
{
    /**
     * Generate a fresh UUID token and stamp token_created_at.
     */
    public function generate(CddSubmission $submission): string
    {
        $token = Str::uuid()->toString();

        $submission->update([
            'token'            => $token,
            'token_created_at' => now(),
            'token_used_at'    => null,
            'token_action'     => null,
        ]);

        return $token;
    }

    /**
     * Look up a submission by token.
     * Returns the submission or null if invalid / already used.
     */
    public function validate(string $token): ?CddSubmission
    {
        $submission = CddSubmission::where('token', $token)->first();

        if (!$submission) {
            return null;
        }

        if (!$submission->isTokenValid()) {
            return null; // already used
        }

        return $submission;
    }

    /**
     * Mark the token as used (one-time link consumed).
     */
    public function markUsed(CddSubmission $submission, ?string $action = null): void
    {
        $submission->update([
            'token_used_at' => now(),
            'token_action'  => $action,
        ]);
    }
}
