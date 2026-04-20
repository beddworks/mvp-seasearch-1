<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cdd_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mandate_id');
            $table->foreign('mandate_id')->references('id')->on('mandates')->onDelete('cascade');
            $table->uuid('recruiter_id');
            $table->foreign('recruiter_id')->references('id')->on('recruiters')->onDelete('cascade');
            $table->uuid('candidate_id');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');

            // Submission
            $table->timestamp('submitted_at')->useCurrent();
            $table->text('recruiter_note')->nullable();
            $table->integer('submission_number')->nullable(); // 1, 2, or 3

            // AI scoring
            $table->integer('ai_score')->nullable(); // 0–100
            $table->json('score_breakdown')->nullable();
            $table->text('ai_summary')->nullable();
            $table->json('green_flags')->nullable();
            $table->json('red_flags')->nullable();

            // Admin review gate
            $table->string('admin_review_status')->default('pending'); // pending|approved|rejected|bypassed
            $table->uuid('admin_reviewed_by')->nullable();
            $table->foreign('admin_reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamp('admin_reviewed_at')->nullable();
            $table->text('admin_note')->nullable();
            $table->integer('admin_rejection_count')->default(0); // max 2
            $table->boolean('exception_bypass')->default(false);

            // Client feedback
            $table->string('client_status')->default('pending');
            // pending|shortlisted|interview|offer_made|hired|rejected|on_hold
            $table->timestamp('client_status_updated_at')->nullable();
            $table->text('client_rejection_reason')->nullable();

            // Interview tracking
            $table->timestamp('interview_date')->nullable();
            $table->string('interview_format')->nullable();
            $table->text('interview_notes')->nullable();
            $table->text('interview_feedback')->nullable();
            $table->unsignedTinyInteger('interview_feedback_stars')->nullable();
            $table->string('interview_verdict')->nullable();
            // strong_yes|yes|uncertain|no

            // Client tokenized link
            $table->string('token')->unique()->nullable();
            $table->timestamp('token_created_at')->nullable();
            $table->timestamp('token_used_at')->nullable();
            $table->string('token_action')->nullable();

            // GSheet
            $table->integer('gsheet_row_index')->nullable();

            // Penalty
            $table->decimal('penalty_applied', 5, 4)->default(0);
            $table->integer('days_late')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cdd_submissions');
    }
};
