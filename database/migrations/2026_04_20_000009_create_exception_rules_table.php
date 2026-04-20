<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exception_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('rule_type'); // recruiter_trust|role_type|both
            $table->string('trust_level')->nullable(); // 'trusted'
            $table->string('role_type')->nullable();   // 'fast_track'
            $table->uuid('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('exception_rule_audit', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('rule_id')->nullable();
            $table->foreign('rule_id')->references('id')->on('exception_rules')->onDelete('cascade');
            $table->uuid('changed_by')->nullable();
            $table->foreign('changed_by')->references('id')->on('users')->onDelete('set null');
            $table->string('action'); // created|updated|deleted|toggled
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->timestamp('changed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exception_rule_audit');
        Schema::dropIfExists('exception_rules');
    }
};
