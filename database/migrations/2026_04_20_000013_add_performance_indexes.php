<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dedicated indexes migration — run last.
 * Covers: timer queries, frequently-filtered columns, FK indexes.
 */
return new class extends Migration
{
    public function up(): void
    {
        // users
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
        });

        // recruiters
        Schema::table('recruiters', function (Blueprint $table) {
            $table->index('trust_level');
            $table->index('tier');
            $table->index('recruiter_group');
        });

        // clients
        Schema::table('clients', function (Blueprint $table) {
            $table->index('company_name');
        });

        // mandates
        Schema::table('mandates', function (Blueprint $table) {
            $table->index('client_id');
            $table->index('status');
            $table->index('seniority');
            $table->index('industry');
            $table->index('is_exclusive');
            $table->index('original_post_date');
        });

        // mandate_claims
        Schema::table('mandate_claims', function (Blueprint $table) {
            $table->index('mandate_id');
            $table->index('recruiter_id');
            $table->index('status');
            $table->index('assigned_at'); // for timer A queries
        });

        // candidates
        Schema::table('candidates', function (Blueprint $table) {
            $table->index('recruiter_id');
        });

        // cdd_submissions
        Schema::table('cdd_submissions', function (Blueprint $table) {
            $table->index('mandate_id');
            $table->index('recruiter_id');
            $table->index('candidate_id');
            $table->index('admin_review_status');
            $table->index('client_status');
            $table->index('submitted_at'); // for timer B queries
        });

        // placements
        Schema::table('placements', function (Blueprint $table) {
            $table->index('recruiter_id');
            $table->index('client_id');
            $table->index('payout_status');
        });

        // notifications
        Schema::table('notifications', function (Blueprint $table) {
            $table->index('user_id');
            $table->index(['user_id', 'is_read']); // unread count query
        });
    }

    public function down(): void
    {
        // Indexes dropped automatically when tables are dropped in other migrations
    }
};
