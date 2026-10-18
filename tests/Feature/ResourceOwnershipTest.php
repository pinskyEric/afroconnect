<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ResourceOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_favorites_are_scoped_to_the_authenticated_owner(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $outsider = User::factory()->create();

        DB::table('favorites')->insert([
            'user_id' => $owner->id,
            'favorite_id' => $otherUser->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($outsider, 'sanctum')
            ->getJson('/api/v1/me/favorites')
            ->assertOk()
            ->assertJsonMissing(['id' => $otherUser->id]);

        $this->actingAs($outsider, 'sanctum')
            ->deleteJson('/api/v1/me/favorites/'.$otherUser->id)
            ->assertNoContent();

        $this->assertDatabaseHas('favorites', [
            'user_id' => $owner->id,
            'favorite_id' => $otherUser->id,
        ]);
    }

    public function test_block_list_and_unblock_action_are_scoped_to_the_block_owner(): void
    {
        $owner = User::factory()->create();
        $blockedUser = User::factory()->create();
        $outsider = User::factory()->create();

        DB::table('blocks')->insert([
            'blocker_id' => $owner->id,
            'blocked_id' => $blockedUser->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($outsider, 'sanctum')
            ->getJson('/api/v1/blocks')
            ->assertOk()
            ->assertJsonMissing(['blocked_id' => $blockedUser->id]);

        $this->actingAs($outsider, 'sanctum')
            ->deleteJson('/api/v1/blocks/'.$blockedUser->id)
            ->assertNoContent();

        $this->assertDatabaseHas('blocks', [
            'blocker_id' => $owner->id,
            'blocked_id' => $blockedUser->id,
        ]);
    }
}
