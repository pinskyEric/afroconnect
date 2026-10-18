<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

final class AccountDeletionService
{
    public function delete(User $user): void
    {
        $photoKey = $user->photo_key;
        $userId = (string) $user->id;

        app(MatchmakingService::class)->cancelForUser($userId);

        DB::transaction(function () use ($user, $userId, $photoKey): void {
            $conversationIds = DB::table('conversation_participants')
                ->where('user_id', $userId)
                ->pluck('conversation_id');

            // Conversation content is removed for both participants as a shared record.
            if ($conversationIds->isNotEmpty()) {
                DB::table('conversations')->whereIn('id', $conversationIds)->delete();
            }

            DB::table('friend_requests')->where('sender_id', $userId)->orWhere('recipient_id', $userId)->delete();
            DB::table('friendships')->where('user_id', $userId)->orWhere('friend_id', $userId)->delete();
            DB::table('favorites')->where('user_id', $userId)->orWhere('favorite_id', $userId)->delete();
            DB::table('blocks')->where('blocker_id', $userId)->orWhere('blocked_id', $userId)->delete();
            DB::table('notifications')->where('user_id', $userId)->delete();
            DB::table('match_preferences')->where('user_id', $userId)->delete();
            DB::table('matches')->where('user_one_id', $userId)->orWhere('user_two_id', $userId)->delete();
            DB::table('user_preferences')->where('user_id', $userId)->delete();
            DB::table('personal_access_tokens')->where('tokenable_type', $user->getMorphClass())->where('tokenable_id', $userId)->delete();

            // Keep a non-login tombstone while safety reports, decisions, or audit rows reference this UUID.
            $user->forceFill([
                'name' => 'Deleted member',
                'username' => 'deleted_'.str_replace('-', '', $userId),
                'email' => 'deleted+'.str_replace('-', '', $userId).'@deleted.invalid',
                'phone' => null,
                'email_verified_at' => null,
                'password' => Hash::make(Str::random(64)),
                'birth_date' => null,
                'country' => null,
                'languages' => [],
                'interests' => [],
                'bio' => null,
                'photo_key' => null,
                'online' => false,
                'role' => 'user',
                'status' => 'deleted',
                'last_seen_at' => null,
                'remember_token' => null,
            ])->save();
            $user->delete();

            DB::afterCommit(function () use ($photoKey): void {
                if (! $photoKey) {
                    return;
                }

                try {
                    Storage::disk('s3')->delete($photoKey);
                } catch (Throwable $exception) {
                    Log::warning('Profile photo cleanup failed after account deletion.', [
                        'exception' => $exception::class,
                    ]);
                }
            });
        });
    }
}
