<?php

namespace App\Services;

use App\Events\NotificationCreated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class NotificationWriter
{
    public static function create(string $userId, string $kind, string $title, ?string $description = null, array $data = []): void
    {
        $id = (string) Str::uuid();
        $record = ['id' => $id, 'user_id' => $userId, 'kind' => $kind, 'title' => $title, 'description' => $description, 'data' => json_encode($data), 'created_at' => now(), 'updated_at' => now()];
        DB::table('notifications')->insert($record);

        $preferences = json_decode(DB::table('user_preferences')->where('user_id', $userId)->value('preferences') ?: '{}', true);
        if (($preferences['notifications'] ?? true) === false) {
            return;
        }

        DB::afterCommit(fn () => event(new NotificationCreated($userId, ['id' => $id, 'kind' => $kind, 'title' => $title, 'description' => $description, 'data' => $data, 'read' => false, 'created_at' => now()->toISOString()])));
    }
}
