<?php

namespace Tests\Feature;

use App\Events\CallSignal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CallAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_active_match_participants_can_fetch_call_ice_configuration(): void
    {
        [$caller, $peer, $outsider, $callId] = $this->createAcceptedMatchAndCall();

        $this->actingAs($caller, 'sanctum')->getJson("/api/v1/calls/{$callId}/ice-servers")->assertOk();
        $this->actingAs($outsider, 'sanctum')->getJson("/api/v1/calls/{$callId}/ice-servers")->assertForbidden();

        DB::table('blocks')->insert([
            'blocker_id' => $peer->id,
            'blocked_id' => $caller->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->actingAs($caller, 'sanctum')->getJson("/api/v1/calls/{$callId}/ice-servers")->assertForbidden();
    }

    public function test_queued_call_signal_is_suppressed_if_a_block_is_added(): void
    {
        [$caller, $peer, , $callId] = $this->createAcceptedMatchAndCall();
        $event = new CallSignal($callId, $caller->id, 'offer', ['type' => 'offer', 'sdp' => 'test']);

        $this->assertTrue($event->broadcastWhen());
        DB::table('blocks')->insert([
            'blocker_id' => $peer->id,
            'blocked_id' => $caller->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->assertFalse($event->broadcastWhen());
    }

    public function test_ended_call_cannot_be_used_for_signaling(): void
    {
        [$caller, , , $callId] = $this->createAcceptedMatchAndCall('ended');

        $this->actingAs($caller, 'sanctum')->postJson("/api/v1/calls/{$callId}/signals", [
            'type' => 'ice-candidate',
            'payload' => ['candidate' => 'candidate:1 1 UDP 1 192.0.2.1 10000 typ host'],
        ])->assertForbidden();
    }

    private function createAcceptedMatchAndCall(string $callStatus = 'active'): array
    {
        $caller = User::factory()->create();
        $peer = User::factory()->create();
        $outsider = User::factory()->create();
        $matchId = (string) Str::uuid();
        $callId = (string) Str::uuid();

        DB::table('matches')->insert([
            'id' => $matchId,
            'user_one_id' => $caller->id,
            'user_two_id' => $peer->id,
            'status' => 'accepted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('call_sessions')->insert([
            'id' => $callId,
            'match_id' => $matchId,
            'created_by' => $caller->id,
            'status' => $callStatus,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$caller, $peer, $outsider, $callId];
    }
}
