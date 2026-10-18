<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Redis;

final class PresenceService
{
    private const KEY = 'africonnect:presence';

    public function heartbeat(User $user): void
    {
        if (! app()->environment('testing')) {
            $now = now()->timestamp;
            Redis::zadd(self::KEY, $now, $user->id);
            Redis::expire(self::KEY, 180);
        }
        $user->forceFill(['online' => true, 'last_seen_at' => now()])->save();
    }

    public function offline(User $user): void
    {
        if (! app()->environment('testing')) {
            Redis::zrem(self::KEY, $user->id);
        }
        $user->forceFill(['online' => false, 'last_seen_at' => now()])->save();
    }

    public function prune(): void
    {
        $expiredIds = [];

        if (! app()->environment('testing')) {
            $cutoff = now()->subSeconds(90)->timestamp;
            $expiredIds = Redis::zrangebyscore(self::KEY, '-inf', $cutoff);
            Redis::zremrangebyscore(self::KEY, '-inf', $cutoff);
        }

        $stale = User::query()
            ->where('online', true)
            ->where('last_seen_at', '<', now()->subSeconds(90))
            ->pluck('id');
        $ids = collect($expiredIds)->merge($stale)->unique()->values();

        if ($ids->isNotEmpty()) {
            User::whereIn('id', $ids)->update(['online' => false]);
        }
    }

    public function onlineIds(): array
    {
        if (app()->environment('testing')) {
            $this->prune();

            return User::where('online', true)->pluck('id')->all();
        }

        $this->prune();

        return Redis::zrangebyscore(self::KEY, now()->timestamp, '+inf');
    }
}
