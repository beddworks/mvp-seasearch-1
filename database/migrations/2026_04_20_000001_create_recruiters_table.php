<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Profile
            $table->string('display_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->text('bio')->nullable();
            $table->text('avatar_url')->nullable();
            $table->integer('years_experience')->nullable();
            $table->string('current_firm')->nullable();
            $table->string('ea_license_number')->nullable();
            $table->text('ea_certificate_url')->nullable();
            $table->boolean('profile_complete')->default(false);

            // Segmentation
            $table->string('recruiter_group')->nullable();
            $table->string('recruiter_group_secondary')->nullable();
            $table->string('tier')->default('junior');          // junior|senior|elite
            $table->string('trust_level')->default('standard'); // standard|trusted

            // Focus areas (stored as JSON arrays in MySQL)
            $table->json('industries')->nullable();
            $table->json('seniority_focus')->nullable();
            $table->json('geographies')->nullable();
            $table->string('specialty')->nullable();

            // Stats (denormalized)
            $table->integer('total_placements')->default(0);
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->integer('active_mandates_count')->default(0); // enforced ≤ 2 in app

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiters');
    }
};
