<?php

namespace App\Events;

use App\Services\BroadcastPrivacy;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallSignal implements ShouldBroadcast
{
    use Dispatchable,InteractsWithSockets,SerializesModels;

    public function __construct(public string $callId, public string $senderId, public string $type, public array $payload) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('calls.'.$this->callId)];
    }

    public function broadcastAs(): string
    {
        return 'call.signal';
    }

    public function broadcastWith(): array
    {
        return ['sender_id' => $this->senderId, 'type' => $this->type, 'payload' => $this->payload];
    }

    public function broadcastWhen(): bool
    {
        return BroadcastPrivacy::callAllowed($this->callId);
    }
}
