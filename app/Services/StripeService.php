<?php

namespace App\Services;

use App\Models\Recruiter;

class StripeService
{
    /**
     * Create a Stripe Connect transfer to the recruiter's bank account.
     * Full Stripe Connect implementation deferred to Stage 2.
     */
    public function createTransfer(float $amount, array $bankDetails, Recruiter $recruiter): string
    {
        // TODO: implement Stripe Connect transfer
        // $transfer = \Stripe\Transfer::create([
        //     'amount'      => (int) ($amount * 100),
        //     'currency'    => strtolower($bankDetails['currency'] ?? 'sgd'),
        //     'destination' => $recruiter->stripe_account_id,
        //     'metadata'    => ['recruiter_id' => $recruiter->id],
        // ]);
        // return $transfer->id;

        // Stub — return a fake transfer ID for now
        return 'tr_stub_' . uniqid();
    }
}
