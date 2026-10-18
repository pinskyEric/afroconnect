<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_account_cannot_access_admin_report_queue(): void
    {
        $user = User::create(['name' => 'Fictional User', 'username' => 'fictional_user', 'email' => 'member@example.test', 'password' => 'Secure-Local-Test-123!', 'birth_date' => '1995-01-01', 'role' => 'user', 'status' => 'active']);
        $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/reports')->assertForbidden();
    }

    public function test_guest_cannot_access_admin_report_queue(): void
    {
        $this->getJson('/api/v1/admin/reports')->assertUnauthorized();
    }

    public function test_actioned_report_requires_explicit_account_status_and_revokes_sessions(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reporter = User::factory()->create();
        $target = User::factory()->create();
        $target->createToken('test-session');
        $conversationId = (string) Str::uuid();
        DB::table('conversations')->insert(['id' => $conversationId, 'created_at' => now(), 'updated_at' => now()]);
        foreach ([$target, $reporter] as $participant) {
            DB::table('conversation_participants')->insert([
                'conversation_id' => $conversationId,
                'user_id' => $participant->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $reportId = (string) Str::uuid();
        DB::table('reports')->insert(['id' => $reportId, 'reporter_id' => $reporter->id, 'user_id' => $target->id, 'category' => 'Harassment', 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/reports/'.$reportId.'/decision', [
            'decision' => 'actioned',
            'notes' => 'Fictional test moderation reason',
        ])->assertUnprocessable()->assertJsonValidationErrors('account_status');

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/reports/'.$reportId.'/decision', [
            'decision' => 'actioned',
            'account_status' => 'suspended',
            'notes' => 'Fictional test moderation reason',
        ])->assertNoContent();

        $this->assertSame('suspended', $target->fresh()->status);
        $this->assertSame(2, (int) DB::table('conversations')->where('id', $conversationId)->value('channel_generation'));
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.status', 'target_id' => $target->id]);
        $this->assertDatabaseHas('moderation_decisions', ['report_id' => $reportId, 'decision' => 'actioned']);
    }

    public function test_admin_decision_is_persisted_and_audited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reporter = User::factory()->create();
        $target = User::factory()->create();
        $reportId = (string) Str::uuid();
        DB::table('reports')->insert(['id' => $reportId, 'reporter_id' => $reporter->id, 'user_id' => $target->id, 'category' => 'Spam', 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/reports/'.$reportId.'/decision', ['decision' => 'dismissed', 'notes' => 'Reviewed fictional sample'])->assertNoContent();
        $this->assertDatabaseHas('reports', ['id' => $reportId, 'status' => 'resolved']);
        $this->assertDatabaseHas('moderation_decisions', ['report_id' => $reportId, 'moderator_id' => $admin->id, 'decision' => 'dismissed']);
        $this->assertDatabaseHas('admin_audit_logs', ['admin_id' => $admin->id, 'action' => 'report.decision', 'target_id' => $reportId]);
    }
}
