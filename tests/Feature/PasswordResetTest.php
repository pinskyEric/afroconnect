<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_token_changes_password_and_revokes_existing_api_tokens(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.test', 'password' => 'Initial-Valid-123!']);
        $user->createToken('pre-reset');
        $token = Password::createToken($user);
        $this->postJson('/api/v1/auth/password/reset', ['email' => $user->email, 'token' => $token, 'password' => 'Changed-Valid-456!', 'password_confirmation' => 'Changed-Valid-456!'])->assertNoContent();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->postJson('/api/v1/auth/login', ['identity' => $user->email, 'password' => 'Changed-Valid-456!'])->assertOk();
    }

    public function test_password_reset_request_returns_generic_response_for_unknown_identity(): void
    {
        $this->postJson('/api/v1/auth/password/forgot', ['identity' => 'missing@example.test'])->assertAccepted()->assertJson(['message' => 'If the account is eligible, reset instructions will be sent.']);
    }
}
