<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_limited_after_eight_attempts_per_minute(): void
    {
        for ($attempt = 0; $attempt < 8; $attempt++) {
            $this->postJson('/api/v1/auth/login', [
                'identity' => 'fictional@example.test',
                'password' => 'incorrect-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/v1/auth/login', [
            'identity' => 'fictional@example.test',
            'password' => 'incorrect-password',
        ])->assertTooManyRequests();
    }

    public function test_registration_is_limited_after_five_attempts_per_minute(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/register', [])->assertUnprocessable();
        }

        $this->postJson('/api/v1/auth/register', [])->assertTooManyRequests();
    }

    public function test_report_submission_is_limited_to_five_attempts_per_hour(): void
    {
        $reporter = User::factory()->create();
        $target = User::factory()->create();
        $payload = ['user_id' => $target->id, 'category' => 'Spam'];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->actingAs($reporter, 'sanctum')->postJson('/api/v1/reports', $payload)->assertCreated();
        }

        $this->actingAs($reporter, 'sanctum')->postJson('/api/v1/reports', $payload)->assertTooManyRequests();
    }
}
