<?php

namespace App\Events;

use App\Services\BroadcastPrivacy;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable,InteractsWithSockets,SerializesModels;

    public function __construct(public string $conversationId, public array $message, public int $channelGeneration) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversations.'.$this->conversationId.'.'.$this->channelGeneration)];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return ['message' => $this->message];
    }

    public function broadcastWhen(): bool
    {
        return BroadcastPrivacy::conversationAllowed($this->conversationId, $this->channelGeneration);
    }
}
