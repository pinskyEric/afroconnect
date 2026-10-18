<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BlockGuard;
use App\Services\NotificationWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SocialController extends Controller
{
    public function favorites(Request $r)
    {
        $userId = $r->user()->id;
        $blocked = DB::table('blocks')->select('blocked_id')->where('blocker_id', $userId)
            ->union(DB::table('blocks')->select('blocker_id')->where('blocked_id', $userId));
        $ids = DB::table('favorites')->where('user_id', $userId)->whereNotIn('favorite_id', $blocked)->pluck('favorite_id');

        return response()->json(['data' => User::where('status', 'active')->whereIn('id', $ids)->get()->map(fn ($u) => $u->publicProfile())]);
    }

    public function favorite(Request $r, string $user)
    {
        abort_if($r->user()->id === $user, 422);
        abort_unless(User::where('id', $user)->where('status', 'active')->exists(), 404);
        BlockGuard::assertAllowed($r->user()->id, $user);
        DB::table('favorites')->insertOrIgnore(['user_id' => $r->user()->id, 'favorite_id' => $user, 'created_at' => now(), 'updated_at' => now()]);

        return response()->noContent();
    }

    public function unfavorite(Request $r, string $user)
    {
        DB::table('favorites')->where('user_id', $r->user()->id)->where('favorite_id', $user)->delete();

        return response()->noContent();
    }

    public function friends(Request $r)
    {
        $me = $r->user()->id;
        $ids = DB::table('friendships')->where('user_id', $me)->pluck('friend_id');
        $blocked = DB::table('blocks')->select('blocked_id')->where('blocker_id', $me)->union(DB::table('blocks')->select('blocker_id')->where('blocked_id', $me));

        return response()->json(['data' => User::withCount('friends')->where('status', 'active')->whereIn('id', $ids)->whereNotIn('id', $blocked)->get()->map(fn ($u) => $u->publicProfile())]);
    }

    public function requests(Request $r)
    {
        $direction = $r->validate(['direction' => 'sometimes|in:incoming,outgoing'])['direction'] ?? 'incoming';
        $q = DB::table('friend_requests')->where('status', 'pending');
        $direction === 'outgoing' ? $q->where('sender_id', $r->user()->id) : $q->where('recipient_id', $r->user()->id);
        $page = $q->orderByDesc('created_at')->paginate(30);
        $data = $page->getCollection()->map(fn ($item) => ['id' => $item->id, 'userId' => $direction === 'outgoing' ? $item->recipient_id : $item->sender_id, 'direction' => $direction]);

        return response()->json(['data' => $data, 'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total(), 'last_page' => $page->lastPage()]]);
    }

    public function request(Request $r)
    {
        $d = $r->validate(['user_id' => 'required|uuid|exists:users,id']);
        BlockGuard::assertAllowed($r->user()->id, $d['user_id']);
        $prefs = json_decode(DB::table('user_preferences')->where('user_id', $d['user_id'])->value('preferences') ?: '{}', true);
        abort_if(($prefs['requests'] ?? 'Everyone') === 'Nobody', 403);
        if (($prefs['requests'] ?? 'Everyone') === 'Friends only') {
            abort_unless(DB::table('friendships')->where('user_id', $r->user()->id)->where('friend_id', $d['user_id'])->exists(), 403);
        }
        $id = Str::uuid()->toString();
        DB::table('friend_requests')->updateOrInsert(['sender_id' => $r->user()->id, 'recipient_id' => $d['user_id']], ['id' => $id, 'status' => 'pending', 'updated_at' => now(), 'created_at' => now()]);
        $actual = DB::table('friend_requests')->where('sender_id', $r->user()->id)->where('recipient_id', $d['user_id'])->first();
        if ($actual->id === $id) {
            NotificationWriter::create($d['user_id'], 'request', 'A new friend request', 'Someone would like to connect.', ['request_id' => $id]);
        }

        return response()->json(['data' => ['id' => $actual->id, 'userId' => $d['user_id'], 'direction' => 'outgoing']], 201);
    }

    public function respond(Request $r, string $friendRequest, string $action)
    {
        $q = DB::table('friend_requests')->where('id', $friendRequest)->where('status', 'pending');
        $row = $q->first();
        abort_unless($row, 404);
        BlockGuard::assertAllowed($row->sender_id, $row->recipient_id);
        $me = $r->user()->id;
        abort_unless(($action === 'accept' && $row->recipient_id === $me) || (($action === 'decline' && $row->recipient_id === $me) || ($action === 'cancel' && $row->sender_id === $me)), 403);
        DB::transaction(function () use ($row, $action) {
            DB::table('friend_requests')->where('id', $row->id)->update(['status' => $action === 'accept' ? 'accepted' : $action, 'updated_at' => now()]);
            if ($action === 'accept') {
                DB::table('friendships')->insertOrIgnore([['user_id' => $row->sender_id, 'friend_id' => $row->recipient_id, 'created_at' => now(), 'updated_at' => now()], ['user_id' => $row->recipient_id, 'friend_id' => $row->sender_id, 'created_at' => now(), 'updated_at' => now()]]);
            }
        });
        if ($action === 'accept') {
            NotificationWriter::create($row->sender_id, 'accepted', 'Friend request accepted', 'You are now connected.', ['user_id' => $row->recipient_id]);
        }

        return response()->noContent();
    }

    public function remove(Request $r, string $user)
    {
        DB::table('friendships')->where(fn ($q) => $q->where('user_id', $r->user()->id)->where('friend_id', $user))->orWhere(fn ($q) => $q->where('friend_id', $r->user()->id)->where('user_id', $user))->delete();

        return response()->noContent();
    }
}
