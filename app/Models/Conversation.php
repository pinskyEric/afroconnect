<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function participants()
    {
        return $this->belongsToMany(User::class, 'conversation_participants')->withPivot(['unread_count', 'last_read_at'])->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
