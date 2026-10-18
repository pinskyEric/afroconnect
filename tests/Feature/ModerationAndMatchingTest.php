<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ModerationAndMatchingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_report_is_persisted_and_invalid_category_rejected(): void
    {
        $reporter = User::factory()->create();
        $target = User::factory()->create();
        $this->actingAs($reporter, 'sanctum')->postJson('/api/v1/reports', ['user_id' => $target->id, 'category' => 'Spam', 'details' => 'Fictional test report'])->assertCreated();
        $this->assertDatabaseHas('reports', ['reporter_id' => $reporter->id, 'user_id' => $target->id, 'status' => 'pending']);
        $this->actingAs($reporter, 'sanctum')->postJson('/api/v1/reports', ['user_id' => $target->id, 'category' => 'not-a-category'])->assertUnprocessable();
    }

    public function test_two_participants_must_accept_a_match_before_a_call(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
        DB::table('matches')->insert(['id' => $id, 'user_one_id' => $a->id, 'user_two_id' => $b->id, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($a, 'sanctum')->postJson("/api/v1/matches/{$id}/accept")->assertOk()->assertJsonPath('data.status', 'pending');
        $this->actingAs($a, 'sanctum')->postJson('/api/v1/calls', ['match_id' => $id])->assertForbidden();
        $this->actingAs($b, 'sanctum')->postJson("/api/v1/matches/{$id}/accept")->assertOk()->assertJsonPath('data.status', 'accepted');
    }

    public function test_admin_status_action_is_audited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create();
        $this->actingAs($admin, 'sanctum')->patchJson('/api/v1/admin/users/'.$member->id.'/status', ['status' => 'suspended', 'reason' => 'Test moderation'])->assertNoContent();
        $this->assertDatabaseHas('users', ['id' => $member->id, 'status' => 'suspended']);
        $this->assertDatabaseHas('admin_audit_logs', ['admin_id' => $admin->id, 'action' => 'user.status', 'target_id' => $member->id]);
    }

    public function test_blocked_match_cannot_be_accepted(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
        DB::table('matches')->insert(['id' => $id, 'user_one_id' => $a->id, 'user_two_id' => $b->id, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('blocks')->insert(['blocker_id' => $a->id, 'blocked_id' => $b->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($a, 'sanctum')->postJson("/api/v1/matches/{$id}/accept")->assertForbidden();
    }
}
