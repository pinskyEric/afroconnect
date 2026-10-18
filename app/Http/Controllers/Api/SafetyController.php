<?php

namespace App\Http\Controllers\Api;

use App\Events\MatchStatusChanged;
use App\Http\Controllers\Controller;
use App\Services\ConversationChannelRotator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SafetyController extends Controller
{
    public function blocks(Request $r)
    {
        return response()->json(['data' => DB::table('blocks')->where('blocker_id', $r->user()->id)->paginate(30)]);
    }

    public function block(Request $r)
    {
        $d = $r->validate(['user_id' => 'required|uuid|exists:users,id']);
        abort_if($d['user_id'] === $r->user()->id, 422);
        DB::transaction(function () use ($r, $d) {
            DB::table('blocks')->insertOrIgnore(['blocker_id' => $r->user()->id, 'blocked_id' => $d['user_id'], 'created_at' => now(), 'updated_at' => now()]);
            app(ConversationChannelRotator::class)->rotateBetween($r->user()->id, $d['user_id']);
            DB::table('friendships')->where(fn ($q) => $q->where('user_id', $r->user()->id)->where('friend_id', $d['user_id']))->orWhere(fn ($q) => $q->where('user_id', $d['user_id'])->where('friend_id', $r->user()->id))->delete();
            DB::table('friend_requests')->where('status', 'pending')->where(fn ($q) => $q->where('sender_id', $r->user()->id)->where('recipient_id', $d['user_id']))->orWhere(fn ($q) => $q->where('status', 'pending')->where('sender_id', $d['user_id'])->where('recipient_id', $r->user()->id))->update(['status' => 'blocked', 'updated_at' => now()]);

            $matches = DB::table('matches')->whereIn('status', ['pending', 'accepted'])
                ->where(fn ($q) => $q->where(fn ($pair) => $pair->where('user_one_id', $r->user()->id)->where('user_two_id', $d['user_id']))
                    ->orWhere(fn ($pair) => $pair->where('user_one_id', $d['user_id'])->where('user_two_id', $r->user()->id)))
                ->get(['id', 'user_one_id', 'user_two_id']);
            foreach ($matches as $match) {
                DB::table('matches')->where('id', $match->id)->update(['status' => 'skipped', 'updated_at' => now()]);
                DB::table('call_sessions')->where('match_id', $match->id)->whereIn('status', ['ringing', 'active'])
                    ->update(['status' => 'ended', 'ended_at' => now(), 'updated_at' => now()]);
                DB::afterCommit(fn () => event(new MatchStatusChanged($match->id, $match->user_one_id, $match->user_two_id, 'skipped')));
            }
        });

        return response()->noContent();
    }

    public function unblock(Request $r, string $user)
    {
        DB::table('blocks')->where('blocker_id', $r->user()->id)->where('blocked_id', $user)->delete();

        return response()->noContent();
    }

    public function report(Request $r)
    {
        $d = $r->validate(['user_id' => 'required|uuid|exists:users,id', 'category' => 'required|in:Nudity or sexual misconduct,Harassment,Hate speech,Threats,Scams or fraud,Suspected underage user,Spam,Impersonation,Other', 'details' => 'nullable|string|max:3000']);
        abort_if($d['user_id'] === $r->user()->id, 422);
        $id = Str::uuid()->toString();
        DB::table('reports')->insert(['id' => $id, 'reporter_id' => $r->user()->id, 'user_id' => $d['user_id'], 'category' => $d['category'], 'details' => $d['details'] ?? null, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['data' => ['id' => $id, 'userId' => $d['user_id'], 'category' => $d['category'], 'details' => $d['details'] ?? '', 'status' => 'pending', 'date' => now()->toDateString()]], 201);
    }
}
