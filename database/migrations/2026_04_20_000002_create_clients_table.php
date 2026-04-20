<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique()->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');

            $table->string('company_name');
            $table->string('industry')->nullable();
            $table->text('logo_url')->nullable();
            $table->string('accent_color')->default('#0B4F8A');
            $table->string('website')->nullable();

            // Primary contact
            $table->string('contact_name')->nullable();
            $table->string('contact_email');
            $table->string('contact_title')->nullable();

            // GSheet
            $table->text('gsheet_url')->nullable();
            $table->string('gsheet_id')->nullable();

            $table->string('status')->default('active'); // active|inactive

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
