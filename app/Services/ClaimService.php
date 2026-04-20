<?php

namespace App\Services;

use App\Models\MandateClaim;
use App\Models\User;

class ClaimService
{
    public function approve(MandateClaim $claim, User $admin, ?string $note = null): void
    {
        $claim->update([
            'status'      => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'admin_note'  => $note,
            'assigned_at' => now(),
        ]);

        $claim->mandate->increment('assignment_count');
        $claim->recruiter->increment('active_mandates_count');
    }

    public function reject(MandateClaim $claim, User $admin, string $note): void
    {
        $claim->update([
            'status'           => 'rejected',
            'reviewed_by'      => $admin->id,
            'reviewed_at'      => now(),
            'admin_note'       => $note,
            'rejection_count'  => $claim->rejection_count + 1,
        ]);
    }
}
