<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SocialFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_friend_request_lifecycle_creates_bidirectional_friendship(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $request = $this->actingAs($sender, 'sanctum')->postJson('/api/v1/friend-requests', ['user_id' => $recipient->id])->assertCreated();
        $id = $request->json('data.id');
        $this->actingAs($recipient, 'sanctum')->postJson("/api/v1/friend-requests/{$id}/accept")->assertNoContent();
        $this->assertDatabaseHas('friendships', ['user_id' => $sender->id, 'friend_id' => $recipient->id]);
        $this->assertDatabaseHas('friendships', ['user_id' => $recipient->id, 'friend_id' => $sender->id]);
        $this->assertDatabaseHas('notifications', ['user_id' => $sender->id, 'kind' => 'accepted']);
    }

    public function test_non_recipient_cannot_accept_request(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $outsider = User::factory()->create();
        $request = $this->actingAs($sender, 'sanctum')->postJson('/api/v1/friend-requests', ['user_id' => $recipient->id])->assertCreated();
        $this->actingAs($outsider, 'sanctum')->postJson('/api/v1/friend-requests/'.$request->json('data.id').'/accept')->assertForbidden();
    }

    public function test_message_history_requires_membership_and_tracks_unread(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $outsider = User::factory()->create();
        $conversation = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
        DB::table('conversations')->insert(['id' => $conversation, 'created_at' => now(), 'updated_at' => now()]);
        foreach ([$a, $b] as $user) {
            DB::table('conversation_participants')->insert(['conversation_id' => $conversation, 'user_id' => $user->id, 'created_at' => now(), 'updated_at' => now()]);
        }
        $sent = $this->actingAs($a, 'sanctum')->postJson("/api/v1/conversations/{$conversation}/messages", ['text' => 'Hello there', 'client_message_id' => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'])->assertCreated();
        $messageId = $sent->json('data.id');
        $this->actingAs($a, 'sanctum')->postJson("/api/v1/conversations/{$conversation}/messages", ['text' => 'Hello there', 'client_message_id' => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'])->assertOk();
        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseHas('conversation_participants', ['conversation_id' => $conversation, 'user_id' => $b->id, 'unread_count' => 1]);
        $this->actingAs($b, 'sanctum')->postJson("/api/v1/conversations/{$conversation}/read", ['through_message_id' => $messageId])->assertNoContent();
        $this->assertDatabaseHas('messages', ['id' => $messageId]);
        $this->assertDatabaseHas('conversation_participants', ['conversation_id' => $conversation, 'user_id' => $b->id, 'unread_count' => 0]);
        $this->actingAs($outsider, 'sanctum')->getJson("/api/v1/conversations/{$conversation}/messages")->assertNotFound();
    }
}
