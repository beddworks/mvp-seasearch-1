<?php

namespace App\Jobs;

use App\Models\CddSubmission;
use App\Services\GoogleSheetsService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncGSheetJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(
        public CddSubmission $submission,
        public string $action = 'add_row' // 'add_row' | 'update_status'
    ) {}

    public function handle(GoogleSheetsService $gsheets): void
    {
        $submission = $this->submission->fresh(['mandate.client']);

        if (!$submission) {
            Log::warning('SyncGSheetJob: submission not found', ['id' => $this->submission->id]);
            return;
        }

        $client = $submission->mandate?->client;

        // Skip if client has no GSheet configured
        if (!$client?->gsheet_id) {
            Log::info('SyncGSheetJob: client has no gsheet_id — skipping', [
                'submission_id' => $submission->id,
                'client_id'     => $client?->id,
            ]);
            return;
        }

        try {
            if ($this->action === 'add_row') {
                // Ensure mandate tab exists
                $mandate = $submission->mandate;
                if (!$mandate->gsheet_tab_name) {
                    $tabName = $gsheets->createMandateTab($client, $mandate);
                    $mandate->update(['gsheet_tab_name' => $tabName]);
                }

                $rowIndex = $gsheets->addCddRow($submission);
                $submission->update(['gsheet_row_index' => $rowIndex]);

            } elseif ($this->action === 'update_status') {
                $gsheets->updateStatusCell($submission);
            }

        } catch (Exception $e) {
            Log::error('SyncGSheetJob failed', [
                'submission_id' => $submission->id,
                'action'        => $this->action,
                'error'         => $e->getMessage(),
            ]);
            throw $e; // re-throw so the queue retries
        }
    }

    public function failed(Exception $e): void
    {
        Log::error('SyncGSheetJob exhausted retries', [
            'submission_id' => $this->submission->id,
            'action'        => $this->action,
            'error'         => $e->getMessage(),
        ]);
    }
}
