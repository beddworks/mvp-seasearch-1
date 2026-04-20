<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompensationType extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name', 'is_active', 'formula_type', 'formula_fields',
        'trigger_condition', 'platform_fee_pct', 'notes', 'sort_order',
    ];

    protected $casts = [
        'formula_fields' => 'array',
        'is_active'      => 'boolean',
        'platform_fee_pct' => 'float',
    ];

    public function mandates()
    {
        return $this->hasMany(Mandate::class);
    }
}
