<?php

namespace App\Services;

use App\Models\ExceptionRule;
use App\Models\Mandate;
use App\Models\Recruiter;

class ExceptionService
{
    /**
     * Determine if a CDD submission should bypass admin review.
     * Returns true if the recruiter is "trusted" OR the mandate is fast-track
     * OR an active exception rule matches.
     */
    public function shouldBypass(Recruiter $recruiter, Mandate $mandate): bool
    {
        // Direct model-level bypass conditions
        if ($recruiter->trust_level === 'trusted') {
            return true;
        }

        if ($mandate->is_fast_track) {
            return true;
        }

        // Check active exception rules
        $rules = ExceptionRule::where('is_active', true)->get();

        foreach ($rules as $rule) {
            $match = match ($rule->rule_type) {
                'recruiter_trust' => $recruiter->trust_level === 'trusted',
                'role_type'       => $mandate->compensation_type_id === ($rule->value ?? null),
                'both'            => $recruiter->trust_level === 'trusted' && $mandate->is_fast_track,
                default           => false,
            };

            if ($match) {
                return true;
            }
        }

        return false;
    }
}
