<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\MatchmakingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class MatchmakingQueueTest extends TestCase
{
    use RefreshDatabase;

    private array $queue = [];

    private function fakeRedisQueue(): void
    {
        Redis::shouldReceive('zadd')->andReturnUsing(function ($key, $score, $member) {
            $this->queue[] = $member;

            return 1;
        });
        Redis::shouldReceive('zrange')->andReturnUsing(fn () => array_values($this->queue));
        Redis::shouldReceive('zrem')->andReturnUsing(function ($key, ...$members) {
            $this->queue = array_values(array_diff($this->queue, $members));

            return count($members);
        });
    }

    public function test_compatible_online_users_are_paired_and_queue_entries_removed(): void
    {
        $this->fakeRedisQueue();
        $one = User::factory()->create(['country' => 'Uganda', 'languages' => ['English'], 'interests' => ['Music']]);
        $two = User::factory()->create(['country' => 'Kenya', 'languages' => ['English'], 'interests' => ['Music']]);
        $service = app(MatchmakingService::class);
        $first = $service->enqueue($one);
        $this->assertSame('searching', $first['status']);
        $second = $service->enqueue($two);
        $this->assertSame('matched', $second['status']);
        $this->assertDatabaseHas('matches', ['id' => $second['match']['id'], 'status' => 'pending']);
        $this->assertSame('matched', $service->status($one, $first['queue_id'])['status']);
        $this->assertSame($two->id, $service->status($one, $first['queue_id'])['match']['user']['id']);
        $this->assertSame([], $this->queue);
    }

    public function test_blocked_users_are_not_paired(): void
    {
        $this->fakeRedisQueue();
        $one = User::factory()->create();
        $two = User::factory()->create();
        DB::table('blocks')->insert(['blocker_id' => $one->id, 'blocked_id' => $two->id, 'created_at' => now(), 'updated_at' => now()]);
        $service = app(MatchmakingService::class);
        $service->enqueue($one);
        $result = $service->enqueue($two);
        $this->assertSame('searching', $result['status']);
        $this->assertDatabaseCount('matches', 0);
    }
}
