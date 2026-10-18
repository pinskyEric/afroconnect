<?php

namespace Tests\Feature;

use App\Events\ConversationChannelRotated;
use App\Events\MessageSent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BroadcastChannelAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_conversation_channel_rotation_invalidates_old_subscriptions_after_block(): void
    {
        $member = User::factory()->create();
        $peer = User::factory()->create();
        $outsider = User::factory()->create();
        $conversationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

        DB::table('conversations')->insert(['id' => $conversationId, 'created_at' => now(), 'updated_at' => now()]);
        foreach ([$member, $peer] as $user) {
            DB::table('conversation_participants')->insert([
                'conversation_id' => $conversationId,
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $channels = Broadcast::connection()->getChannels();
        $authorizeConversation = $channels->get('conversations.{conversationId}.{generation}');
        $authorizeUser = $channels->get('users.{userId}');
        $staleEvent = new MessageSent($conversationId, ['text' => 'stale event'], 1);

        $this->assertIsCallable($authorizeConversation);
        $this->assertTrue($authorizeConversation($member, $conversationId, 1));
        $this->assertFalse($authorizeConversation($outsider, $conversationId, 1));
        $this->assertTrue($authorizeUser($member, $member->id));
        $this->assertFalse($authorizeUser($member, $peer->id));

        Event::fake([ConversationChannelRotated::class]);
        $this->actingAs($member, 'sanctum')->postJson('/api/v1/blocks', ['user_id' => $peer->id])->assertNoContent();
        Event::assertDispatched(ConversationChannelRotated::class, fn (ConversationChannelRotated $event) => $event->conversationId === $conversationId && $event->generation === 2);
        $this->assertSame(2, (int) DB::table('conversations')->where('id', $conversationId)->value('channel_generation'));
        $this->assertFalse($authorizeConversation($member, $conversationId, 1));
        $this->assertFalse($staleEvent->broadcastWhen());

        $this->actingAs($member, 'sanctum')->deleteJson('/api/v1/blocks/'.$peer->id)->assertNoContent();
        $this->actingAs($member, 'sanctum')->getJson('/api/v1/conversations')->assertOk()->assertJsonPath('data.0.channel_generation', 2);
        $this->assertTrue($authorizeConversation($member, $conversationId, 2));
        $this->assertFalse($staleEvent->broadcastWhen());
        $freshEvent = new MessageSent($conversationId, ['text' => 'fresh event'], 2);
        $this->assertTrue($freshEvent->broadcastWhen());
        $this->assertSame('private-conversations.'.$conversationId.'.2', $freshEvent->broadcastOn()[0]->name);

        $member->update(['status' => 'suspended']);
        $this->assertFalse($authorizeConversation($member->fresh(), $conversationId, 2));
    }
}
