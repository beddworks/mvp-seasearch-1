<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminDailyDigestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $admin,
        public array $digest
    ) {}

    public function envelope(): Envelope
    {
        $total = array_sum($this->digest);
        return new Envelope(
            subject: "SeaSearch Daily Digest — {$total} item(s) need attention · " . now()->format('d M'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.daily-digest',
            with: [
                'admin'     => $this->admin,
                'digest'    => $this->digest,
                'dashUrl'   => route('admin.dashboard'),
                'claimsUrl' => route('admin.claims.index'),
                'cddsUrl'   => route('admin.submissions.index'),
                'date'      => now()->format('l, d F Y'),
            ],
        );
    }
}
