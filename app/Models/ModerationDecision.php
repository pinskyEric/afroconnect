<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModerationDecision extends Model
{
    protected $guarded = [];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }
}
