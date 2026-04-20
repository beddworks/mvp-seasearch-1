<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cdd_submissions', function (Blueprint $table) {
            $table->text('client_feedback')->nullable()->after('interview_verdict');
            $table->string('client_feedback_sentiment')->nullable()->after('client_feedback'); // positive|neutral|negative
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cdd_submissions', function (Blueprint $table) {
            $table->dropColumn(['client_feedback', 'client_feedback_sentiment']);
        });
    }
};
