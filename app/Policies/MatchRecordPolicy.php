<?php

namespace App\Policies;

use App\Models\MatchRecord;
use App\Models\User;
use App\Services\BlockGuard;

class MatchRecordPolicy
{
    public function view(User $user, MatchRecord $match): bool
    {
        return $user->status === 'active'
            && in_array($user->id, [$match->user_one_id, $match->user_two_id], true)
            && ! BlockGuard::blockedEither($match->user_one_id, $match->user_two_id);
    }

    public function accept(User $user, MatchRecord $match): bool
    {
        return $this->view($user, $match) && $match->status === 'pending';
    }
}
