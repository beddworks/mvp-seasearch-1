<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExceptionRule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name', 'description', 'is_active', 'rule_type', 'trust_level', 'role_type', 'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
