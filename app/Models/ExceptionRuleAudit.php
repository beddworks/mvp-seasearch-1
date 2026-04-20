<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExceptionRuleAudit extends Model
{
    use HasUuids;

    protected $table = 'exception_rule_audit';

    protected $fillable = [
        'rule_id',
        'changed_by',
        'action',
        'old_value',
        'new_value',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
    ];

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ExceptionRule::class, 'rule_id');
    }

    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
