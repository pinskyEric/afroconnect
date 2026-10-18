<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SocialPrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_favorite_listing_hides_blocked_and_inactive_profiles(): void
    {
        $viewer = User::factory()->create();
        $blocked = User::factory()->create();
        $suspended = User::factory()->create(['status' => 'suspended']);
        $visible = User::factory()->create();

        foreach ([$blocked, $suspended, $visible] as $target) {
            DB::table('favorites')->insert([
                'user_id' => $viewer->id,
                'favorite_id' => $target->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        DB::table('blocks')->insert([
            'blocker_id' => $viewer->id,
            'blocked_id' => $blocked->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/v1/me/favorites')
            ->assertOk()
            ->assertJsonMissing(['id' => $blocked->id])
            ->assertJsonMissing(['id' => $suspended->id])
            ->assertJsonFragment(['id' => $visible->id]);
    }

    public function test_friend_listing_hides_inactive_profiles(): void
    {
        $viewer = User::factory()->create();
        $suspended = User::factory()->create(['status' => 'suspended']);
        $active = User::factory()->create();
        foreach ([$suspended, $active] as $friend) {
            DB::table('friendships')->insert([
                'user_id' => $viewer->id,
                'friend_id' => $friend->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/v1/friends')
            ->assertOk()
            ->assertJsonMissing(['id' => $suspended->id])
            ->assertJsonFragment(['id' => $active->id]);
    }

    public function test_user_cannot_favorite_self_or_an_inactive_profile(): void
    {
        $viewer = User::factory()->create();
        $suspended = User::factory()->create(['status' => 'suspended']);

        $this->actingAs($viewer, 'sanctum')
            ->putJson('/api/v1/me/favorites/'.$viewer->id)
            ->assertUnprocessable();
        $this->actingAs($viewer, 'sanctum')
            ->putJson('/api/v1/me/favorites/'.$suspended->id)
            ->assertNotFound();
    }
}
