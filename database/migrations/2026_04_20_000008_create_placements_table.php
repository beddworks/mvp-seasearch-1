<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('placements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cdd_submission_id')->unique();
            $table->foreign('cdd_submission_id')->references('id')->on('cdd_submissions');
            $table->uuid('mandate_id');
            $table->foreign('mandate_id')->references('id')->on('mandates');
            $table->uuid('recruiter_id');
            $table->foreign('recruiter_id')->references('id')->on('recruiters');
            $table->uuid('client_id');
            $table->foreign('client_id')->references('id')->on('clients');

            // Financials
            $table->decimal('gross_reward', 12, 2);
            $table->decimal('platform_fee', 12, 2);
            $table->decimal('net_payout', 12, 2);
            $table->decimal('penalty_amount', 12, 2)->default(0);
            $table->decimal('final_payout', 12, 2);
            $table->string('currency')->default('SGD');

            // Payout status
            $table->string('payout_status')->default('pending');
            // pending|processing|paid|on_hold|failed
            $table->timestamp('payout_date')->nullable();
            $table->string('stripe_transfer_id')->nullable();

            $table->date('candidate_start_date')->nullable();
            $table->timestamp('placed_at')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('placements');
    }
};
