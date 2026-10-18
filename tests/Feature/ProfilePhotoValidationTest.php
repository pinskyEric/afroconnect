<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfilePhotoValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_image_upload_is_rejected_before_storage(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/me/profile/photo', ['photo' => UploadedFile::fake()->create('not-an-image.png', 12, 'text/plain')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('photo');

        $this->assertNull($user->fresh()->photo_key);
    }

    public function test_valid_photo_is_reencoded_as_webp_and_returns_a_temporary_url(): void
    {
        Storage::fake('s3');
        $expiresAt = null;
        Storage::disk('s3')->buildTemporaryUrlsUsing(function ($path, $expiration) use (&$expiresAt) {
            $expiresAt = $expiration;

            return 'https://photos.example.test/'.$path;
        });
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/me/profile/photo', ['photo' => UploadedFile::fake()->image('portrait.png', 320, 320)])
            ->assertCreated()
            ->assertJsonPath('data.photo_url', fn ($url) => str_starts_with($url, 'https://photos.example.test/'));

        $key = $user->fresh()->photo_key;
        $this->assertNotNull($key);
        $this->assertStringEndsWith('.webp', $key);
        $this->assertTrue(Storage::disk('s3')->exists($key));
        $this->assertSame('private', Storage::disk('s3')->getVisibility($key));
        $this->assertSame(IMAGETYPE_WEBP, getimagesizefromstring(Storage::disk('s3')->get($key))[2]);
        $this->assertNotNull($expiresAt);
        $this->assertEqualsWithDelta(now()->addMinutes(10)->timestamp, $expiresAt->getTimestamp(), 2);
    }
}
