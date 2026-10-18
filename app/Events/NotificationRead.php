<?php

namespace App\Events;

use App\Services\BroadcastPrivacy;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $userId,
        public ?string $notificationId,
        public string $readAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('users.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return $this->notificationId ? 'notification.read' : 'notification.read_all';
    }

    public function broadcastWith(): array
    {
        return $this->notificationId
            ? ['id' => $this->notificationId, 'read_at' => $this->readAt]
            : ['all' => true, 'read_at' => $this->readAt];
    }

    public function broadcastWhen(): bool
    {
        return BroadcastPrivacy::notificationAllowed($this->userId);
    }
}
