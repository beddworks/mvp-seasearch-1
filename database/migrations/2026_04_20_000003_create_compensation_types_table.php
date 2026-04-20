<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compensation_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->string('formula_type'); // percentage|hourly|fixed|milestone
            $table->json('formula_fields');
            $table->string('trigger_condition')->default('on_hire'); // on_hire|on_invoice|on_milestone
            $table->decimal('platform_fee_pct', 5, 4)->default(0.20);
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compensation_types');
    }
};
