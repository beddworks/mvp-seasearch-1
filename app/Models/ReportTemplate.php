<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name', 'type', 'subject', 'body', 'variables', 'created_by', 'is_active',
    ];

    protected $casts = [
        'variables'  => 'array',
        'is_active'  => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
