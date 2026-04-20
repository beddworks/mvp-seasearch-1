<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'company_name', 'industry', 'logo_url', 'accent_color',
        'website', 'contact_name', 'contact_email', 'contact_title',
        'gsheet_url', 'gsheet_id', 'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mandates()
    {
        return $this->hasMany(Mandate::class);
    }

    public function placements()
    {
        return $this->hasMany(Placement::class);
    }
}
