<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mandates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('client_id');
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->uuid('posted_by_user_id')->nullable();
            $table->foreign('posted_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->uuid('compensation_type_id')->nullable();
            $table->foreign('compensation_type_id')->references('id')->on('compensation_types')->onDelete('set null');

            // Role details
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('seniority')->nullable(); // c_suite|vp_director|manager|ic
            $table->string('industry')->nullable();
            $table->string('contract_type')->default('full_time'); // full_time|contract|part_time
            $table->integer('openings_count')->default(1);
            $table->boolean('is_remote')->default(false);

            // Compensation / reward
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->string('salary_currency')->default('SGD');
            $table->decimal('reward_min', 12, 2)->nullable();
            $table->decimal('reward_max', 12, 2)->nullable();
            $table->decimal('reward_pct', 5, 4)->nullable();

            // Screening
            $table->json('must_haves')->nullable();
            $table->json('nice_to_haves')->nullable();
            $table->json('green_flags')->nullable();
            $table->json('red_flags')->nullable();
            $table->json('screening_questions')->nullable();
            $table->json('ideal_candidates')->nullable();
            $table->json('ideal_source_companies')->nullable();

            // Status & visibility
            $table->string('status')->default('draft'); // draft|active|paused|closed|filled|dropped
            $table->boolean('is_exclusive')->default(false);
            $table->uuid('exclusive_recruiter_id')->nullable();
            $table->foreign('exclusive_recruiter_id')->references('id')->on('recruiters')->onDelete('set null');
            $table->timestamp('exclusive_expires_at')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_fast_track')->default(false);

            // Timer configuration (per-mandate overrides)
            $table->integer('timer_a_days')->default(3);
            $table->boolean('timer_b_active')->default(false);
            $table->integer('timer_b_days')->default(5);
            $table->decimal('timer_b_penalty_d6', 5, 4)->default(0.10);
            $table->decimal('timer_b_penalty_d7', 5, 4)->default(0.20);
            $table->decimal('timer_b_penalty_d8plus', 5, 4)->default(0.30);
            $table->boolean('timer_c_active')->default(false);
            $table->integer('timer_c_sla_days')->default(5);

            // GSheet tab reference
            $table->string('gsheet_tab_name')->nullable();

            // Metadata
            $table->timestamp('published_at')->nullable();
            $table->timestamp('original_post_date')->nullable();
            $table->integer('assignment_count')->default(0); // max 3

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mandates');
    }
};
