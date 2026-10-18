<?php

namespace App\Events;

use App\Services\BroadcastPrivacy;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class MatchStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $matchId, public string $userOneId, public string $userTwoId, public string $status) {}

    public function broadcastOn(): array
    {
        return DB::table('users')
            ->whereIn('id', [$this->userOneId, $this->userTwoId])
            ->where('status', 'active')
            ->pluck('id')
            ->map(fn ($id) => new PrivateChannel('users.'.$id))
            ->all();
    }

    public function broadcastAs(): string
    {
        return 'match.status';
    }

    public function broadcastWith(): array
    {
        return ['match_id' => $this->matchId, 'status' => $this->status];
    }

    public function broadcastWhen(): bool
    {
        return BroadcastPrivacy::matchAllowed($this->userOneId, $this->userTwoId);
    }
}
