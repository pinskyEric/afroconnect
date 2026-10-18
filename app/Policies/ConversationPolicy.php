<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;
use App\Services\BlockGuard;
use Illuminate\Support\Facades\DB;

class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        if (! $conversation->participants()->where('users.id', $user->id)->exists()) {
            return false;
        }
        $otherIds = DB::table('conversation_participants')->where('conversation_id', $conversation->id)->where('user_id', '<>', $user->id)->pluck('user_id');
        foreach ($otherIds as $otherId) {
            if (BlockGuard::blockedEither($user->id, $otherId)) {
                return false;
            }
        }

        return true;
    }

    public function send(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation) && $user->status === 'active';
    }
}
