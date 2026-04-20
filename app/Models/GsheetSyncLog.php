<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GsheetSyncLog extends Model
{
    use HasUuids;

    protected $table = 'gsheet_sync_log';
    public $timestamps = false;

    protected $fillable = [
        'client_id', 'mandate_id', 'cdd_submission_id', 'action',
        'gsheet_id', 'tab_name', 'row_index', 'success', 'error_message', 'synced_at',
    ];

    protected $casts = [
        'success'   => 'boolean',
        'synced_at' => 'datetime',
    ];
}
