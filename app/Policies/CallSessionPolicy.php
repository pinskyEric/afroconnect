<?php

namespace App\Policies;

use App\Models\CallSession;
use App\Models\User;
use App\Services\BlockGuard;

class CallSessionPolicy
{
    public function participate(User $user, CallSession $call): bool
    {
        $match = $call->match;

        return $user->status === 'active' && $match
            && in_array($user->id, [$match->user_one_id, $match->user_two_id], true)
            && in_array($call->status, ['ringing', 'active'], true)
            && ! BlockGuard::blockedEither($match->user_one_id, $match->user_two_id);
    }
}
