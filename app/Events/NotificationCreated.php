<?php

namespace App\Events;

use App\Services\BroadcastPrivacy;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable,InteractsWithSockets,SerializesModels;

    public function __construct(public string $userId, public array $notification) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('users.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastWith(): array
    {
        return ['notification' => $this->notification];
    }

    public function broadcastWhen(): bool
    {
        return BroadcastPrivacy::notificationAllowed($this->userId);
    }
}
