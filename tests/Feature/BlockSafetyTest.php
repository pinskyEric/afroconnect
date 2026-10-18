<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class BlockSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_blocked_profile_is_hidden_from_discovery_and_message_is_forbidden(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        DB::table('blocks')->insert(['blocker_id' => $a->id, 'blocked_id' => $b->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($a, 'sanctum')->getJson('/api/v1/profiles')->assertOk()->assertJsonMissing(['id' => $b->id]);
        DB::table('conversations')->insert(['id' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'created_at' => now(), 'updated_at' => now()]);
        foreach ([$a, $b] as $u) {
            DB::table('conversation_participants')->insert(['conversation_id' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'user_id' => $u->id, 'created_at' => now(), 'updated_at' => now()]);
        }$this->actingAs($a, 'sanctum')->postJson('/api/v1/conversations/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/messages', ['text' => 'Hello', 'client_message_id' => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'])->assertForbidden();
    }

    public function test_blocking_during_a_call_ends_the_call_and_invalidates_the_match(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $match = (string) Str::uuid();
        $call = (string) Str::uuid();
        DB::table('matches')->insert(['id' => $match, 'user_one_id' => $a->id, 'user_two_id' => $b->id, 'status' => 'accepted', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('call_sessions')->insert(['id' => $call, 'match_id' => $match, 'created_by' => $a->id, 'status' => 'active', 'started_at' => now(), 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs($a, 'sanctum')->postJson('/api/v1/blocks', ['user_id' => $b->id])->assertNoContent();

        $this->assertDatabaseHas('matches', ['id' => $match, 'status' => 'skipped']);
        $this->assertDatabaseHas('call_sessions', ['id' => $call, 'status' => 'ended']);
    }

    public function test_user_cannot_report_self(): void
    {
        $u = User::factory()->create();
        $this->actingAs($u, 'sanctum')->postJson('/api/v1/reports', ['user_id' => $u->id, 'category' => 'Spam'])->assertUnprocessable();
    }
}
