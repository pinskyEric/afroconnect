<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable, SoftDeletes;

    protected $fillable = ['name', 'username', 'email', 'phone', 'password', 'birth_date', 'country', 'languages', 'interests', 'bio', 'photo_key', 'online', 'role', 'status', 'last_seen_at'];

    protected $hidden = ['password', 'remember_token', 'birth_date', 'email', 'phone'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'birth_date' => 'date', 'password' => 'hashed', 'languages' => 'array', 'interests' => 'array', 'online' => 'boolean', 'last_seen_at' => 'datetime'];
    }

    public function publicProfile(): array
    {
        return ['id' => (string) $this->id, 'name' => $this->name, 'username' => $this->username, 'age' => $this->birth_date?->age, 'country' => $this->country, 'languages' => $this->languages ?? [], 'interests' => $this->interests ?? [], 'bio' => $this->bio, 'photo' => $this->photo_key ? Storage::disk('s3')->temporaryUrl($this->photo_key, now()->addMinutes(10)) : null, 'online' => (bool) $this->online, 'friends' => (int) ($this->friends_count ?? $this->friends()->count())];
    }

    public function friends()
    {
        return $this->belongsToMany(self::class, 'friendships', 'user_id', 'friend_id')->withTimestamps();
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }
}
