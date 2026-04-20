<?php

namespace App\Jobs;

use App\Models\Candidate;
use App\Services\ClaudeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser as PdfParser;

class ParseCvJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries   = 3;
    public $timeout = 120;

    public function __construct(
        public Candidate $candidate,
        public ?string   $mandateId = null
    ) {}

    public function handle(ClaudeService $claude): void
    {
        // Get CV path from wherever it's stored
        $cvPath = $this->candidate->cv_file_path ?? $this->candidate->cv_url;
        if (!$cvPath) {
            Log::warning("ParseCvJob: No CV found for candidate {$this->candidate->id}");
            return;
        }

        // Extract text from PDF/DOC
        $cvText = $this->extractText($cvPath);
        if (!$cvText) {
            Log::warning("ParseCvJob: Could not extract text from CV for candidate {$this->candidate->id}");
            return;
        }

        // Parse with Claude
        $parsed = $claude->parseCV($cvText);
        if (empty($parsed)) {
            return;
        }

        // Update candidate with parsed data
        $update = [
            'parsed_profile' => $parsed,
            'cv_parsed_at'   => now(),
            'cv_parsed'      => true,
            'skills'         => $parsed['skills'] ?? [],
            'notes'          => isset($parsed['achievements'])
                ? implode("\n", $parsed['achievements'])
                : null,
        ];

        // Backfill profile fields if not already set
        if (empty($this->candidate->current_role) && !empty($parsed['current_role'])) {
            $update['current_role'] = $parsed['current_role'];
        }
        if (empty($this->candidate->current_company) && !empty($parsed['current_company'])) {
            $update['current_company'] = $parsed['current_company'];
        }
        if (empty($this->candidate->years_experience) && isset($parsed['years_experience'])) {
            $update['years_experience'] = $parsed['years_experience'];
        }
        if (empty($this->candidate->email) && !empty($parsed['email'])) {
            $update['email'] = $parsed['email'];
        }
        if (empty($this->candidate->phone) && !empty($parsed['phone'])) {
            $update['phone'] = $parsed['phone'];
        }
        if (empty($this->candidate->linkedin_url) && !empty($parsed['linkedin'])) {
            $update['linkedin_url'] = $parsed['linkedin'];
        }

        $this->candidate->update($update);
    }

    private function extractText(string $path): ?string
    {
        // If it's an S3 path, download to temp
        $disk = config('filesystems.default', 's3');
        $tempPath = null;

        try {
            $contents = Storage::disk($disk)->get($path);
            $tempPath = tempnam(sys_get_temp_dir(), 'cv_') . '.' . pathinfo($path, PATHINFO_EXTENSION);
            file_put_contents($tempPath, $contents);

            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

            if ($ext === 'pdf') {
                // Try pdftotext first (system tool)
                if (function_exists('shell_exec')) {
                    $text = shell_exec("pdftotext " . escapeshellarg($tempPath) . " -");
                    if ($text && strlen(trim($text)) > 50) {
                        return trim($text);
                    }
                }

                // Fallback: smalot/pdf-parser if installed
                if (class_exists(PdfParser::class)) {
                    $parser = new PdfParser();
                    $pdf    = $parser->parseFile($tempPath);
                    return $pdf->getText();
                }
            }

            // For DOC/DOCX, return raw contents as last resort
            // (Claude can handle partial text)
            return $contents;
        } catch (\Throwable $e) {
            Log::error("ParseCvJob extractText error: " . $e->getMessage());
            return null;
        } finally {
            if ($tempPath && file_exists($tempPath)) {
                unlink($tempPath);
            }
        }
    }
}
