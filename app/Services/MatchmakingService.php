<?php

namespace App\Services;

use App\Events\MatchStatusChanged;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

final class MatchmakingService
{
    private const ZSET = 'africonnect:matchmaking:queue';

    public function enqueue(User $user): array
    {
        return Cache::lock('matchmaking:user:'.$user->id, 10)->block(3, function () use ($user) {
            $existingId = Cache::get('match_queue:user:'.$user->id);
            $existing = $existingId ? Cache::get('match_queue:'.$existingId) : null;
            if ($existing) {
                $match = $this->tryPair($existingId);

                return ['queue_id' => $existingId, 'status' => $match ? 'matched' : 'searching', 'match' => $match];
            }
            $id = (string) Str::uuid();
            $entry = ['id' => $id, 'user_id' => $user->id, 'created_at' => now()->timestamp];
            Cache::put('match_queue:'.$id, $entry, now()->addMinutes(3));
            Cache::put('match_queue:user:'.$user->id, $id, now()->addMinutes(3));
            Redis::zadd(self::ZSET, now()->timestamp, $id);
            $matched = $this->tryPair($id);

            return ['queue_id' => $id, 'status' => $matched ? 'matched' : 'searching', 'match' => $matched];
        });
    }

    public function status(User $user, string $id): array
    {
        $result = Cache::get('match_result:queue:'.$id);
        if ($result) {
            abort_unless(($result['user_id'] ?? null) === $user->id, 404);

            return ['queue_id' => $id, 'status' => 'matched', 'match' => $result['match']];
        }

        $entry = Cache::get('match_queue:'.$id);
        if (! $entry) {
            return ['queue_id' => $id, 'status' => 'expired', 'match' => null];
        }
        abort_unless(($entry['user_id'] ?? null) === $user->id, 404);

        return ['queue_id' => $id, 'status' => 'searching', 'match' => null];
    }

    public function cancel(User $user, string $id): void
    {
        $entry = Cache::get('match_queue:'.$id);
        abort_unless(($entry['user_id'] ?? null) === $user->id, 404);
        Redis::zrem(self::ZSET, $id);
        Cache::forget('match_queue:'.$id);
        Cache::forget('match_queue:user:'.$user->id);
    }

    public function cancelForUser(string $userId): void
    {
        $entryId = Cache::get('match_queue:user:'.$userId);
        if (! $entryId) {
            return;
        }

        Cache::forget('match_queue:'.$entryId);
        Cache::forget('match_queue:user:'.$userId);
        try {
            Redis::zrem(self::ZSET, $entryId);
        } catch (\Throwable) {
            // The database deletion remains authoritative; an expired queue entry is pruned later.
        }
    }

    public function prune(): void
    {
        foreach (Redis::zrange(self::ZSET, 0, -1) as $id) {
            if (! Cache::get('match_queue:'.$id)) {
                Redis::zrem(self::ZSET, $id);
            }
        }
    }

    public function tryPair(string $entryId): ?array
    {
        return Cache::lock('matchmaking:pair-lock', 10)->block(3, function () use ($entryId) {
            $current = Cache::get('match_queue:'.$entryId);
            if (! $current) {
                return null;
            }
            $me = User::where('id', $current['user_id'])->where('status', 'active')->first();
            if (! $me) {
                return null;
            }
            $pref = DB::table('match_preferences')->where('user_id', $me->id)->first();
            foreach (Redis::zrange(self::ZSET, 0, 99) as $candidateId) {
                if ($candidateId === $entryId) {
                    continue;
                }$entry = Cache::get('match_queue:'.$candidateId);
                if (! $entry) {
                    Redis::zrem(self::ZSET, $candidateId);

                    continue;
                }
                $other = User::where('id', $entry['user_id'])->where('status', 'active')->first();
                if (! $other || $other->id === $me->id || BlockGuard::blockedEither($me->id, $other->id)) {
                    continue;
                }
                $otherPref = DB::table('match_preferences')->where('user_id', $other->id)->first();
                if (! $this->compatible($me, $pref, $other, $otherPref)) {
                    continue;
                }
                $id = (string) Str::uuid();
                DB::transaction(function () use ($id, $me, $other) {
                    DB::table('matches')->insert(['id' => $id, 'user_one_id' => $me->id, 'user_two_id' => $other->id, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
                });
                DB::afterCommit(fn () => event(new MatchStatusChanged($id, $me->id, $other->id, 'pending')));
                Redis::zrem(self::ZSET, $entryId, $candidateId);
                Cache::forget('match_queue:'.$entryId);
                Cache::forget('match_queue:'.$candidateId);
                Cache::forget('match_queue:user:'.$me->id);
                Cache::forget('match_queue:user:'.$other->id);
                Cache::put('match_result:queue:'.$entryId, ['user_id' => $me->id, 'match' => ['id' => $id, 'status' => 'pending', 'user' => $other->publicProfile()]], now()->addMinutes(3));
                Cache::put('match_result:queue:'.$candidateId, ['user_id' => $other->id, 'match' => ['id' => $id, 'status' => 'pending', 'user' => $me->publicProfile()]], now()->addMinutes(3));
                NotificationWriter::create($me->id, 'match', 'A new match', 'A new connection is ready.', ['match_id' => $id]);
                NotificationWriter::create($other->id, 'match', 'A new match', 'A new connection is ready.', ['match_id' => $id]);

                return ['id' => $id, 'status' => 'pending', 'user' => $other->publicProfile()];
            }

            return null;
        });
    }

    private function compatible(User $a, ?object $pa, User $b, ?object $pb): bool
    {
        foreach ([[$pa, $b], [$pb, $a]] as [$p,$target]) {
            if (! $p) {
                continue;
            }$countries = json_decode($p->countries ?? '[]', true) ?: [];
            $languages = json_decode($p->languages ?? '[]', true) ?: [];
            $interests = json_decode($p->interests ?? '[]', true) ?: [];
            if ($countries && ! in_array($target->country, $countries, true)) {
                return false;
            }if ($languages && ! array_intersect($languages, $target->languages ?? [])) {
                return false;
            }if ($interests && ! array_intersect($interests, $target->interests ?? [])) {
                return false;
            }
        }

        return true;
    }
}
