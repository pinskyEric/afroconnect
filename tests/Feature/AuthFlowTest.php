<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_onboarding_account_with_phone_identity(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'identity' => '+256700123456',
            'password' => 'Secure-Valid-123!',
            'password_confirmation' => 'Secure-Valid-123!',
            'terms_accepted' => true,
        ])->assertCreated()->assertJsonPath('data.user.status', 'onboarding');
        $this->assertDatabaseHas('users', ['id' => $response->json('data.user.id'), 'phone' => '+256700123456', 'birth_date' => null]);
    }

    public function test_onboarding_rejects_underage_birth_date_then_completes_adult_profile(): void
    {
        $user = User::factory()->create(['status' => 'onboarding', 'birth_date' => null]);
        $payload = ['birth_date' => now()->subYears(17)->toDateString(), 'name' => 'Fictional Tester', 'username' => 'fictional_tester', 'country' => 'Uganda', 'languages' => ['English'], 'interests' => ['Music']];
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/me/onboarding/complete', $payload)->assertUnprocessable()->assertJsonValidationErrors('birth_date');
        $payload['birth_date'] = '1899-12-31';
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/me/onboarding/complete', $payload)->assertUnprocessable()->assertJsonValidationErrors('birth_date');
        $payload['birth_date'] = now()->addYear()->toDateString();
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/me/onboarding/complete', $payload)->assertUnprocessable()->assertJsonValidationErrors('birth_date');
        $payload['birth_date'] = '1997-04-12';
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/me/onboarding/complete', $payload)->assertOk()->assertJsonPath('data.age', now()->year - 1997 - (now()->format('md') < '0412' ? 1 : 0));
        $this->assertSame('active', $user->fresh()->status);
        $this->assertSame('1997-04-12', $user->fresh()->birth_date->toDateString());
    }

    public function test_stateful_frontend_login_does_not_return_a_persistent_bearer_token(): void
    {
        $user = User::factory()->create(['email' => 'spa-member@example.test', 'password' => 'Secure-Valid-123!']);
        $response = $this->withHeader('Origin', 'http://localhost:3000')
            ->postJson('/api/v1/auth/login', ['identity' => $user->email, 'password' => 'Secure-Valid-123!'])
            ->assertOk()
            ->assertJsonPath('data.user.status', 'active')
            ->assertJsonMissingPath('data.token');

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertNotEmpty($response->headers->getCookies());
    }

    public function test_login_and_logout_revoke_current_token(): void
    {
        $user = User::factory()->create(['email' => 'member@example.test', 'password' => 'Secure-Valid-123!']);
        $response = $this->postJson('/api/v1/auth/login', ['identity' => $user->email, 'password' => 'Secure-Valid-123!'])->assertOk();
        $token = $response->json('data.token');
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();
        $this->withToken('invalid-token')->getJson('/api/v1/me')->assertUnauthorized();
    }
}
