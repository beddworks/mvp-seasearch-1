<?php

namespace App\Services;

use App\Models\Client;
use App\Models\CddSubmission;
use App\Models\GsheetSyncLog;
use App\Models\Mandate;
use Exception;
use Google\Client as GoogleClient;
use Google\Service\Sheets;
use Google\Service\Sheets\BatchUpdateSpreadsheetRequest;
use Google\Service\Sheets\CellData;
use Google\Service\Sheets\CellFormat;
use Google\Service\Sheets\Color;
use Google\Service\Sheets\ExtendedValue;
use Google\Service\Sheets\GridProperties;
use Google\Service\Sheets\Request as GoogleRequest;
use Google\Service\Sheets\RowData;
use Google\Service\Sheets\Sheet;
use Google\Service\Sheets\SheetProperties;
use Google\Service\Sheets\Spreadsheet;
use Google\Service\Sheets\SpreadsheetProperties;
use Google\Service\Sheets\UpdateCellsRequest;
use Google\Service\Sheets\ValueRange;

class GoogleSheetsService
{
    private ?Sheets $sheets = null;

    private function getClient(): Sheets
    {
        if ($this->sheets) {
            return $this->sheets;
        }

        $credentialsPath = config('services.google_sheets.credentials_path');

        if (!$credentialsPath || !file_exists($credentialsPath)) {
            throw new Exception('Google Sheets credentials not configured. Set GOOGLE_SHEETS_CREDENTIALS in .env.');
        }

        $client = new GoogleClient();
        $client->setAuthConfig($credentialsPath);
        $client->addScope(Sheets::SPREADSHEETS);

        $this->sheets = new Sheets($client);
        return $this->sheets;
    }

    /**
     * Create a new master spreadsheet for a client.
     * Returns [ 'spreadsheet_id' => ..., 'url' => ... ]
     */
    public function createClientSheet(Client $client): array
    {
        $sheets = $this->getClient();

        $spreadsheet = new Spreadsheet([
            'properties' => new SpreadsheetProperties([
                'title' => "Sea Search — {$client->company_name}",
            ]),
        ]);

        $result = $sheets->spreadsheets->create($spreadsheet, ['fields' => 'spreadsheetId']);

        $spreadsheetId = $result->getSpreadsheetId();
        $url = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}";

        $this->log($client->id, null, null, 'create_sheet', $spreadsheetId, null, null, true);

        return [
            'spreadsheet_id' => $spreadsheetId,
            'url'            => $url,
        ];
    }

    /**
     * Add a new tab (sheet) inside the client's spreadsheet for a mandate.
     * Returns the tab name created.
     */
    public function createMandateTab(Client $client, Mandate $mandate): string
    {
        $sheets    = $this->getClient();
        $sheetId   = $client->gsheet_id;
        $tabName   = $this->sanitizeTabName($mandate->title);

        $requests = [
            new GoogleRequest([
                'addSheet' => [
                    'properties' => new SheetProperties([
                        'title'        => $tabName,
                        'gridProperties' => new GridProperties([
                            'rowCount'    => 1000,
                            'columnCount' => 15,
                        ]),
                    ]),
                ],
            ]),
        ];

        $batchRequest = new BatchUpdateSpreadsheetRequest([
            'requests' => $requests,
        ]);

        $sheets->spreadsheets->batchUpdate($sheetId, $batchRequest);

        // Write header row
        $headers = [
            ['Candidate', 'Title', 'Company', 'AI Score', 'Submitted', 'Status',
             'Recruiter', 'Interview Date', 'Format', 'Notes', 'Rejection Reason',
             'Updated At', 'Submission #', 'Token Link'],
        ];

        $body = new ValueRange(['values' => $headers]);
        $sheets->spreadsheets_values->update(
            $sheetId,
            "{$tabName}!A1",
            $body,
            ['valueInputOption' => 'RAW']
        );

        $this->log($client->id, $mandate->id, null, 'create_tab', $sheetId, $tabName, null, true);

        return $tabName;
    }

    /**
     * Append a new CDD row to the mandate's tab.
     * Returns the row index (1-based, after header).
     */
    public function addCddRow(CddSubmission $submission): int
    {
        $submission->loadMissing(['candidate', 'recruiter.user', 'mandate.client']);

        $mandate   = $submission->mandate;
        $client    = $mandate->client;
        $candidate = $submission->candidate;
        $recruiter = $submission->recruiter;
        $tabName   = $mandate->gsheet_tab_name ?? $this->sanitizeTabName($mandate->title);
        $sheetId   = $client->gsheet_id;

        $tokenUrl = route('feedback.show', $submission->token);

        $row = [[
            "{$candidate->first_name} {$candidate->last_name}",
            $candidate->current_role  ?? '',
            $candidate->current_company ?? '',
            $submission->ai_score     ?? '',
            $submission->submitted_at?->toDateString() ?? '',
            $submission->client_status ?? 'pending',
            $recruiter->user->name    ?? '',
            $submission->interview_date?->toDateString() ?? '',
            $submission->interview_format ?? '',
            $submission->interview_notes ?? '',
            $submission->client_rejection_reason ?? '',
            now()->toDateTimeString(),
            $submission->submission_number,
            $tokenUrl,
        ]];

        $body = new ValueRange(['values' => $row]);

        $appendResult = $this->getClient()->spreadsheets_values->append(
            $sheetId,
            "{$tabName}!A1",
            $body,
            [
                'valueInputOption'  => 'RAW',
                'insertDataOption'  => 'INSERT_ROWS',
            ]
        );

        // Determine row index from the updated range (e.g., "Sheet1!A5:N5" → row 5)
        $updatedRange = $appendResult->getUpdates()->getUpdatedRange();
        $rowIndex = $this->parseRowFromRange($updatedRange);

        $this->log($client->id, $mandate->id, $submission->id, 'add_row', $sheetId, $tabName, $rowIndex, true);

        return $rowIndex;
    }

    /**
     * Update the status cell in an existing row.
     */
    public function updateStatusCell(CddSubmission $submission): void
    {
        $submission->loadMissing(['mandate.client']);

        $mandate  = $submission->mandate;
        $client   = $mandate->client;
        $tabName  = $mandate->gsheet_tab_name ?? $this->sanitizeTabName($mandate->title);
        $sheetId  = $client->gsheet_id;
        $rowIndex = $submission->gsheet_row_index;

        if (!$rowIndex) {
            // Row not tracked — do a full add instead
            $this->addCddRow($submission);
            return;
        }

        // Column F (index 6) = status, Column H (8) = interview date, Column L (12) = updated at
        $values = [
            [$submission->client_status ?? 'pending'],
        ];

        $body = new ValueRange(['values' => $values]);

        $this->getClient()->spreadsheets_values->update(
            $sheetId,
            "{$tabName}!F{$rowIndex}",
            $body,
            ['valueInputOption' => 'RAW']
        );

        // Also update interview_date and updated_at
        $metaValues = [[
            $submission->interview_date?->toDateString() ?? '',
            $submission->interview_format ?? '',
            $submission->interview_notes ?? '',
            $submission->client_rejection_reason ?? '',
            now()->toDateTimeString(),
        ]];

        $metaBody = new ValueRange(['values' => $metaValues]);
        $this->getClient()->spreadsheets_values->update(
            $sheetId,
            "{$tabName}!H{$rowIndex}",
            $metaBody,
            ['valueInputOption' => 'RAW']
        );

        $this->log($client->id, $mandate->id, $submission->id, 'update_status', $sheetId, $tabName, $rowIndex, true);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private function sanitizeTabName(string $title): string
    {
        // Google Sheets tab names: max 100 chars, no special chars
        $name = preg_replace('/[\\\\\/\?\*\[\]\:]/', '', $title);
        return mb_substr($name, 0, 50);
    }

    private function parseRowFromRange(string $range): int
    {
        // e.g. "Sheet1!A5:N5" → 5
        preg_match('/(\d+):/', $range, $m);
        return isset($m[1]) ? (int) $m[1] : 2;
    }

    private function log(
        ?string $clientId,
        ?string $mandateId,
        ?string $submissionId,
        string $action,
        ?string $gsheetId,
        ?string $tabName,
        ?int $rowIndex,
        bool $success,
        ?string $error = null
    ): void {
        GsheetSyncLog::create([
            'client_id'          => $clientId,
            'mandate_id'         => $mandateId,
            'cdd_submission_id'  => $submissionId,
            'action'             => $action,
            'gsheet_id'          => $gsheetId,
            'tab_name'           => $tabName,
            'row_index'          => $rowIndex,
            'success'            => $success,
            'error_message'      => $error,
            'synced_at'          => now(),
        ]);
    }
}
