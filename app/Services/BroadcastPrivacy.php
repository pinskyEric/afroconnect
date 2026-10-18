<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

final class BroadcastPrivacy
{
    public static function conversationGeneration(string $conversationId): ?int
    {
        $generation = DB::table('conversations')->where('id', $conversationId)->value('channel_generation');

        return $generation === null ? null : (int) $generation;
    }

    public static function conversationAllowed(string $conversationId, ?int $expectedGeneration = null): bool
    {
        $generation = self::conversationGeneration($conversationId);
        if ($generation === null || ($expectedGeneration !== null && $generation !== $expectedGeneration)) {
            return false;
        }

        $participants = DB::table('conversation_participants as cp')
            ->join('users', 'users.id', '=', 'cp.user_id')
            ->where('cp.conversation_id', $conversationId)
            ->get(['users.id', 'users.status']);

        if ($participants->count() < 2 || $participants->contains(fn ($participant) => $participant->status !== 'active')) {
            return false;
        }

        foreach ($participants as $participant) {
            foreach ($participants as $other) {
                if ((string) $participant->id !== (string) $other->id
                    && BlockGuard::blockedEither((string) $participant->id, (string) $other->id)) {
                    return false;
                }
            }
        }

        return true;
    }

    public static function matchAllowed(string $firstUserId, string $secondUserId): bool
    {
        $statuses = DB::table('users')
            ->whereIn('id', [$firstUserId, $secondUserId])
            ->pluck('status');

        return $statuses->count() === 2
            && $statuses->every(fn ($status) => $status === 'active')
            && ! BlockGuard::blockedEither($firstUserId, $secondUserId);
    }

    public static function notificationAllowed(string $userId): bool
    {
        $user = DB::table('users')->where('id', $userId)->where('status', 'active')->exists();
        if (! $user) {
            return false;
        }

        $preferences = json_decode(DB::table('user_preferences')->where('user_id', $userId)->value('preferences') ?: '{}', true);

        return ($preferences['notifications'] ?? true) !== false;
    }

    public static function callAllowed(string $callId): bool
    {
        $call = DB::table('call_sessions')->where('id', $callId)->first();
        if (! $call || ! in_array($call->status, ['ringing', 'active'], true)) {
            return false;
        }

        $match = DB::table('matches')->where('id', $call->match_id)->first();
        if (! $match || $match->status !== 'accepted') {
            return false;
        }

        $statuses = DB::table('users')
            ->whereIn('id', [$match->user_one_id, $match->user_two_id])
            ->pluck('status');

        return $statuses->count() === 2
            && $statuses->every(fn ($status) => $status === 'active')
            && ! BlockGuard::blockedEither($match->user_one_id, $match->user_two_id);
    }
}
