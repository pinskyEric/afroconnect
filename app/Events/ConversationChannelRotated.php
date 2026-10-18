<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ConversationChannelRotated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $conversationId, public int $generation, public array $participantIds) {}

    public function broadcastOn(): array
    {
        $activeIds = DB::table('users')
            ->whereIn('id', $this->participantIds)
            ->where('status', 'active')
            ->pluck('id');

        return $activeIds->map(fn ($id) => new PrivateChannel('users.'.$id))->all();
    }

    public function broadcastAs(): string
    {
        return 'conversation.channel_rotated';
    }

    public function broadcastWith(): array
    {
        return ['conversation_id' => $this->conversationId, 'channel_generation' => $this->generation];
    }

    public function broadcastWhen(): bool
    {
        return $this->broadcastOn() !== [];
    }
}
