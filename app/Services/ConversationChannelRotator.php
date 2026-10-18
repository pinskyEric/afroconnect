<?php

namespace App\Services;

use App\Events\ConversationChannelRotated;
use Illuminate\Support\Facades\DB;

final class ConversationChannelRotator
{
    public function rotateBetween(string $firstUserId, string $secondUserId): void
    {
        $conversationIds = DB::table('conversation_participants as first')
            ->join('conversation_participants as second', 'second.conversation_id', '=', 'first.conversation_id')
            ->where('first.user_id', $firstUserId)
            ->where('second.user_id', $secondUserId)
            ->select('first.conversation_id');

        $this->rotate($conversationIds);
    }

    public function rotateForUser(string $userId): void
    {
        $conversationIds = DB::table('conversation_participants')
            ->where('user_id', $userId)
            ->select('conversation_id');

        $this->rotate($conversationIds);
    }

    private function rotate($conversationIds): void
    {
        DB::table('conversations')->whereIn('id', $conversationIds)->increment('channel_generation');

        $rotated = DB::table('conversations')
            ->whereIn('id', $conversationIds)
            ->get(['id', 'channel_generation']);

        foreach ($rotated as $conversation) {
            $participantIds = DB::table('conversation_participants')
                ->where('conversation_id', $conversation->id)
                ->pluck('user_id')
                ->all();

            DB::afterCommit(fn () => event(new ConversationChannelRotated(
                (string) $conversation->id,
                (int) $conversation->channel_generation,
                $participantIds
            )));
        }
    }
}
