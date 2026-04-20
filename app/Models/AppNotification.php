<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * SeaSearch platform notification (stored in our own `notifications` table).
 * Named AppNotification to avoid collision with Laravel's DatabaseNotification.
 */
class AppNotification extends Model
{
    use HasUuids;

    protected $table = 'notifications';
    public $updated_at = null; // notifications only have created_at

    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'action_url', 'is_read', 'read_at', 'metadata',
    ];

    protected $casts = [
        'is_read'    => 'boolean',
        'read_at'    => 'datetime',
        'created_at' => 'datetime',
        'metadata'   => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
