<?php

use App\Services\BlockGuard;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;

Broadcast::channel('conversations.{conversationId}.{generation}', function ($user, $conversationId, $generation) {
    if ($user->status !== 'active') {
        return false;
    }

    $currentGeneration = DB::table('conversations')->where('id', $conversationId)->value('channel_generation');
    if ($currentGeneration === null || (int) $currentGeneration !== (int) $generation) {
        return false;
    }

    $participantIds = DB::table('conversation_participants')
        ->where('conversation_id', $conversationId)
        ->pluck('user_id');

    if (! $participantIds->contains($user->id)) {
        return false;
    }

    foreach ($participantIds->reject(fn ($id) => (string) $id === (string) $user->id) as $otherId) {
        if (BlockGuard::blockedEither($user->id, $otherId)) {
            return false;
        }
    }

    return true;
});
Broadcast::channel('calls.{callId}', function ($user, $callId) {
    $call = DB::table('call_sessions')->where('id', $callId)->whereIn('status', ['ringing', 'active'])->first();
    if (! $call) {
        return false;
    }$m = DB::table('matches')->where('id', $call->match_id)->first();

    return $m && in_array($user->id, [$m->user_one_id, $m->user_two_id], true) && ! BlockGuard::blockedEither($m->user_one_id, $m->user_two_id);
});
Broadcast::channel('users.{userId}', fn ($user, $userId) => $user->status === 'active' && (string) $user->id === (string) $userId);
