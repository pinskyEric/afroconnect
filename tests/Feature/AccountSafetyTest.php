<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_export_contains_private_data_only_for_authenticated_owner(): void
    {
        $owner = User::factory()->create(['birth_date' => '1995-02-03']);
        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/me/export')
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename="africonnect-account-export.json"')
            ->assertJsonPath('data.account.email', $owner->email)
            ->assertJsonPath('data.account.birth_date', '1995-02-03')
            ->assertJsonPath('data.messages', []);
    }

    public function test_account_deletion_anonymizes_and_soft_deletes_account_and_removes_social_data(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $owner->createToken('local-test');
        DB::table('favorites')->insert(['user_id' => $owner->id, 'favorite_id' => $other->id, 'created_at' => now(), 'updated_at' => now()]);
        $reportId = (string) Str::uuid();
        DB::table('reports')->insert(['id' => $reportId, 'reporter_id' => $other->id, 'user_id' => $owner->id, 'category' => 'Spam', 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
        $conversationId = (string) Str::uuid();
        DB::table('conversations')->insert(['id' => $conversationId, 'created_at' => now(), 'updated_at' => now()]);
        foreach ([$owner, $other] as $participant) {
            DB::table('conversation_participants')->insert(['conversation_id' => $conversationId, 'user_id' => $participant->id, 'created_at' => now(), 'updated_at' => now()]);
        }

        $this->actingAs($owner, 'sanctum')->deleteJson('/api/v1/me/account', [
            'password' => 'Local-Only-Fictional-123!',
            'confirmation' => 'DELETE',
        ])->assertNoContent();

        $this->assertSoftDeleted('users', ['id' => $owner->id]);
        $this->assertDatabaseHas('users', ['id' => $owner->id, 'status' => 'deleted', 'birth_date' => null, 'email' => 'deleted+'.str_replace('-', '', $owner->id).'@deleted.invalid']);
        $this->assertDatabaseMissing('favorites', ['user_id' => $owner->id]);
        $this->assertDatabaseMissing('conversations', ['id' => $conversationId]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('reports', ['id' => $reportId, 'user_id' => $owner->id]);
        $this->assertNull(User::find($owner->id));
    }

    public function test_account_deletion_requires_password_and_explicit_confirmation(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner, 'sanctum')->deleteJson('/api/v1/me/account', [
            'password' => 'wrong-password',
            'confirmation' => 'DELETE',
        ])->assertUnprocessable();
        $this->assertDatabaseHas('users', ['id' => $owner->id, 'status' => 'active']);
    }

    public function test_suspended_account_receives_appeal_only_login_access(): void
    {
        $user = User::factory()->create(['status' => 'suspended']);
        $login = $this->postJson('/api/v1/auth/login', [
            'identity' => $user->email,
            'password' => 'Local-Only-Fictional-123!',
        ])->assertOk()->assertJsonPath('data.user.status', 'suspended');
        $token = $login->json('data.token');

        $this->withToken($token)->postJson('/api/v1/me/appeals', [
            'reason' => 'I believe this fictional moderation action was a mistake and request a human review.',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');
        $this->withToken($token)->getJson('/api/v1/me/appeals')->assertOk()->assertJsonPath('data.total', 1);
        $this->withToken($token)->getJson('/api/v1/profiles')->assertForbidden();
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $user->id, 'abilities' => '["appeals:read","appeals:create"]']);
    }

    public function test_admin_can_reinstate_appeal_with_an_audit_record(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['status' => 'banned']);
        $appealId = (string) Str::uuid();
        DB::table('appeals')->insert([
            'id' => $appealId,
            'user_id' => $user->id,
            'reason' => 'I request a fresh review of this action with additional context.',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/appeals/'.$appealId.'/decision', [
            'decision' => 'reinstated',
            'notes' => 'Reviewed the fictional case and restored access.',
        ])->assertNoContent();

        $this->assertSame('active', $user->fresh()->status);
        $this->assertDatabaseHas('appeals', ['id' => $appealId, 'status' => 'reinstated', 'reviewer_id' => $admin->id]);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'appeal.decision', 'target_id' => $appealId]);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'appeal.reinstated', 'target_id' => $user->id]);
    }
}
