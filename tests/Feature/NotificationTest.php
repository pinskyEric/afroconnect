<?php

namespace Tests\Feature;

use App\Events\NotificationCreated;
use App\Events\NotificationRead;
use App\Models\User;
use App\Services\NotificationWriter;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_event_contract_uses_private_recipient_channel_and_respects_preferences(): void
    {
        $user = User::factory()->create();
        $payload = ['id' => (string) Str::uuid(), 'kind' => 'message', 'title' => 'New message', 'read' => false];
        $event = new NotificationCreated($user->id, $payload);

        $this->assertInstanceOf(ShouldBroadcast::class, $event);
        $this->assertSame('notification.created', $event->broadcastAs());
        $this->assertSame('private-users.'.$user->id, $event->broadcastOn()[0]->name);
        $this->assertSame(['notification' => $payload], $event->broadcastWith());
        $this->assertTrue($event->broadcastWhen());

        DB::table('user_preferences')->insert([
            'user_id' => $user->id,
            'preferences' => json_encode(['notifications' => false]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->assertFalse($event->broadcastWhen());

        $user->update(['status' => 'suspended']);
        DB::table('user_preferences')->updateOrInsert(
            ['user_id' => $user->id],
            ['preferences' => json_encode(['notifications' => true]), 'created_at' => now(), 'updated_at' => now()]
        );
        $this->assertFalse($event->broadcastWhen());
    }

    public function test_notification_writer_persists_and_dispatches_realtime_event_when_enabled(): void
    {
        Event::fake([NotificationCreated::class]);
        $user = User::factory()->create();

        NotificationWriter::create($user->id, 'request', 'A new friend request', 'Someone would like to connect.', ['request_id' => (string) Str::uuid()]);

        $this->assertDatabaseHas('notifications', ['user_id' => $user->id, 'kind' => 'request', 'title' => 'A new friend request']);
        Event::assertDispatched(NotificationCreated::class, fn (NotificationCreated $event) => $event->userId === $user->id && $event->notification['kind'] === 'request');
    }

    public function test_disabling_notifications_keeps_inbox_record_but_suppresses_realtime_event(): void
    {
        Event::fake([NotificationCreated::class]);
        $user = User::factory()->create();
        DB::table('user_preferences')->insert([
            'user_id' => $user->id,
            'preferences' => json_encode(['notifications' => false]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        NotificationWriter::create($user->id, 'notice', 'Test notice');

        $this->assertDatabaseHas('notifications', ['user_id' => $user->id, 'title' => 'Test notice']);
        Event::assertNotDispatched(NotificationCreated::class);
    }

    public function test_marking_notifications_read_broadcasts_read_updates_to_the_owner_only(): void
    {
        Event::fake([NotificationRead::class]);
        $owner = User::factory()->create();
        $notificationId = (string) Str::uuid();
        DB::table('notifications')->insert([
            'id' => $notificationId,
            'user_id' => $owner->id,
            'kind' => 'request',
            'title' => 'Friend request',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($owner, 'sanctum')->postJson('/api/v1/notifications/'.$notificationId.'/read')->assertNoContent();
        Event::assertDispatched(NotificationRead::class, fn (NotificationRead $event) => $event->userId === $owner->id && $event->notificationId === $notificationId);

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $owner->id,
            'kind' => 'message',
            'title' => 'New message',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->actingAs($owner, 'sanctum')->postJson('/api/v1/notifications/read-all')->assertNoContent();
        Event::assertDispatched(NotificationRead::class, fn (NotificationRead $event) => $event->userId === $owner->id && $event->notificationId === null);
    }

    public function test_user_can_mark_their_notifications_read_but_not_another_users(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $id = (string) Str::uuid();
        DB::table('notifications')->insert(['id' => $id, 'user_id' => $owner->id, 'kind' => 'announcement', 'title' => 'Fictional notice', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($other, 'sanctum')->postJson("/api/v1/notifications/{$id}/read")->assertNotFound();
        $this->actingAs($owner, 'sanctum')->postJson("/api/v1/notifications/{$id}/read")->assertNoContent();
        $this->assertDatabaseMissing('notifications', ['id' => $id, 'read_at' => null]);
    }
}
