<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Appeal extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'source_report_id', 'reason', 'status', 'decision_notes', 'reviewer_id', 'decided_at',
    ];

    protected function casts(): array
    {
        return ['decided_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
