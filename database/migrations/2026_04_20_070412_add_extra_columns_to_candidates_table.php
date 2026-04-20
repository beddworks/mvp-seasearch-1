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
        Schema::table('candidates', function (Blueprint $table) {
            $table->decimal('current_salary', 15, 2)->nullable()->after('years_experience');
            $table->decimal('expected_salary', 15, 2)->nullable()->after('current_salary');
            $table->string('salary_currency', 3)->default('SGD')->after('expected_salary');
            $table->string('nationality')->nullable()->after('salary_currency');
            $table->text('recruiter_notes')->nullable()->after('notes');

            // Fix CV column names to match controller convention
            $table->string('cv_file_path')->nullable()->after('recruiter_notes');
            $table->string('cv_file_name')->nullable()->after('cv_file_path');
            $table->boolean('cv_parsed')->default(false)->after('cv_file_name');
        });
    }

    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn([
                'current_salary', 'expected_salary', 'salary_currency',
                'nationality', 'recruiter_notes',
                'cv_file_path', 'cv_file_name', 'cv_parsed',
            ]);
        });
    }
};
