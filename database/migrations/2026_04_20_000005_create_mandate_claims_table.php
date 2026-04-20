<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mandate_claims', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mandate_id');
            $table->foreign('mandate_id')->references('id')->on('mandates')->onDelete('cascade');
            $table->uuid('recruiter_id');
            $table->foreign('recruiter_id')->references('id')->on('recruiters')->onDelete('cascade');

            $table->string('status')->default('pending'); // pending|approved|rejected|withdrawn

            // Admin review
            $table->uuid('reviewed_by')->nullable();
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->text('admin_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            // Retry tracking
            $table->integer('rejection_count')->default(0);
            $table->boolean('is_retry')->default(false);

            // Day 0 — set when status → approved
            $table->timestamp('assigned_at')->nullable();

            $table->timestamps();

            $table->unique(['mandate_id', 'recruiter_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mandate_claims');
    }
};
