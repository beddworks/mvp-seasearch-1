<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gsheet_sync_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('client_id')->nullable();
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('set null');
            $table->uuid('mandate_id')->nullable();
            $table->foreign('mandate_id')->references('id')->on('mandates')->onDelete('set null');
            $table->uuid('cdd_submission_id')->nullable();
            $table->foreign('cdd_submission_id')->references('id')->on('cdd_submissions')->onDelete('set null');
            $table->string('action'); // row_added|row_updated|tab_created
            $table->string('gsheet_id')->nullable();
            $table->string('tab_name')->nullable();
            $table->integer('row_index')->nullable();
            $table->boolean('success')->default(true);
            $table->text('error_message')->nullable();
            $table->timestamp('synced_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gsheet_sync_log');
    }
};
