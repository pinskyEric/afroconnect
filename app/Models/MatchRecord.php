<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MatchRecord extends Model
{
    use HasUuids;

    protected $table = 'matches';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['user_one_accepted_at' => 'datetime', 'user_two_accepted_at' => 'datetime', 'accepted_at' => 'datetime'];
    }

    public function userOne()
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo()
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function calls()
    {
        return $this->hasMany(CallSession::class, 'match_id');
    }
}
