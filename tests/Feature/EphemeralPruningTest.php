<?php

namespace Tests\Feature;

use App\Jobs\PruneEphemeralState;
use App\Models\User;
use App\Services\MatchmakingService;
use App\Services\PresenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class EphemeralPruningTest extends TestCase
{
    use RefreshDatabase;

    public function test_expired_presence_is_marked_offline_in_the_database(): void
    {
        $user = User::factory()->create(['online' => true, 'last_seen_at' => now()->subMinutes(3)]);

        app(PresenceService::class)->prune();

        $this->assertFalse($user->fresh()->online);
    }

    public function test_pruner_ends_stale_ringing_and_overlong_active_calls_only(): void
    {
        $this->travelTo(now());
        $one = User::factory()->create();
        $two = User::factory()->create();
        $matchId = (string) Str::uuid();
        DB::table('matches')->insert([
            'id' => $matchId,
            'user_one_id' => $one->id,
            'user_two_id' => $two->id,
            'status' => 'accepted',
            'created_at' => now()->subHours(5),
            'updated_at' => now()->subHours(5),
        ]);

        $calls = [
            'stale-ringing' => ['status' => 'ringing', 'created_at' => now()->subMinutes(3), 'started_at' => null],
            'long-active' => ['status' => 'active', 'created_at' => now()->subHours(5), 'started_at' => now()->subHours(5)],
            'fresh-ringing' => ['status' => 'ringing', 'created_at' => now()->subSeconds(20), 'started_at' => null],
            'fresh-active' => ['status' => 'active', 'created_at' => now()->subHours(1), 'started_at' => now()->subHours(1)],
        ];

        foreach ($calls as $suffix => $call) {
            DB::table('call_sessions')->insert($call + [
                'id' => (string) Str::uuid(),
                'match_id' => $matchId,
                'created_by' => $one->id,
                'ended_at' => null,
                'updated_at' => now(),
            ]);
        }

        $pruner = new PruneEphemeralState;
        Redis::shouldReceive('zrange')->once()->andReturn([]);
        $pruner->handle(new PresenceService, new MatchmakingService);

        $this->assertSame(2, DB::table('call_sessions')->where('status', 'ended')->count());
        $this->assertSame(1, DB::table('call_sessions')->where('status', 'ringing')->count());
        $this->assertSame(1, DB::table('call_sessions')->where('status', 'active')->count());
    }
}
