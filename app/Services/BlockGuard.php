<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

final class BlockGuard
{
    public static function blockedEither(string $a, string $b): bool
    {
        return DB::table('blocks')->where(fn ($q) => $q->where('blocker_id', $a)->where('blocked_id', $b))->orWhere(fn ($q) => $q->where('blocker_id', $b)->where('blocked_id', $a))->exists();
    }

    public static function assertAllowed(string $a, string $b): void
    {
        abort_if($a === $b || self::blockedEither($a, $b), 403, 'This action is unavailable.');
    }
}
