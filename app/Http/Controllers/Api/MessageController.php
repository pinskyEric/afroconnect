<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\User;
use App\Services\BlockGuard;
use App\Services\BroadcastPrivacy;
use App\Services\NotificationWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    private function member(string $id, string $uid): Conversation
    {
        $conversation = Conversation::findOrFail($id);
        abort_unless($conversation->participants()->where('users.id', $uid)->exists(), 404);
        Gate::forUser(User::findOrFail($uid))->authorize('view', $conversation);

        return $conversation;
    }

    public function conversations(Request $r)
    {
        $ids = DB::table('conversation_participants')->where('user_id', $r->user()->id)->pluck('conversation_id');
        $me = $r->user()->id;
        $blocked = DB::table('blocks')->select('blocked_id')->where('blocker_id', $me)->union(DB::table('blocks')->select('blocker_id')->where('blocked_id', $me));
        $rows = DB::table('conversation_participants as cp')->join('conversation_participants as other', 'other.conversation_id', '=', 'cp.conversation_id')->where('cp.user_id', $me)->where('other.user_id', '<>', $me)->whereNotIn('other.user_id', $blocked)->whereIn('cp.conversation_id', $ids)->join('conversations as c', 'c.id', '=', 'cp.conversation_id')->get(['cp.conversation_id as id', 'other.user_id', 'cp.unread_count as unread', 'c.channel_generation']);
        $data = $rows->map(function ($row) use ($me) {
            $messages = DB::table('messages')->where('conversation_id', $row->id)->orderByDesc('created_at')->limit(50)->get()->reverse()->values()->map(fn ($m) => ['id' => $m->id, 'text' => $m->text, 'from' => $m->sender_id === $me ? 'me' : 'them', 'time' => $m->created_at]);

            return ['id' => $row->id, 'userId' => $row->user_id, 'channel_generation' => (int) $row->channel_generation, 'unread' => (int) $row->unread, 'messages' => $messages];
        });

        return response()->json(['data' => $data]);
    }

    public function createConversation(Request $r)
    {
        $d = $r->validate(['user_id' => 'required|uuid|exists:users,id']);
        BlockGuard::assertAllowed($r->user()->id, $d['user_id']);
        $isFriend = DB::table('friendships')->where('user_id', $r->user()->id)->where('friend_id', $d['user_id'])->exists();
        $recipientPrefs = json_decode(DB::table('user_preferences')->where('user_id', $d['user_id'])->value('preferences') ?: '{}', true);
        $privacy = $recipientPrefs['messages'] ?? 'Friends only';
        abort_if($privacy === 'Nobody' || ($privacy === 'Friends only' && ! $isFriend), 403);
        $existing = DB::table('conversation_participants as a')->join('conversation_participants as b', 'b.conversation_id', '=', 'a.conversation_id')->where('a.user_id', $r->user()->id)->where('b.user_id', $d['user_id'])->value('a.conversation_id');
        if ($existing) {
            return response()->json(['data' => [
                'id' => $existing,
                'user_id' => $d['user_id'],
                'channel_generation' => BroadcastPrivacy::conversationGeneration($existing),
                'unread' => 0,
            ]]);
        }
        $id = Str::uuid()->toString();
        DB::transaction(function () use ($r, $d, $id) {
            DB::table('conversations')->insert(['id' => $id, 'created_at' => now(), 'updated_at' => now()]);
            foreach ([$r->user()->id, $d['user_id']] as $uid) {
                DB::table('conversation_participants')->insert(['conversation_id' => $id, 'user_id' => $uid, 'created_at' => now(), 'updated_at' => now()]);
            }
        });

        return response()->json(['data' => ['id' => $id, 'user_id' => $d['user_id'], 'channel_generation' => 1, 'unread' => 0]], 201);
    }

    public function history(Request $r, string $conversation)
    {
        $this->member($conversation, $r->user()->id);
        $other = DB::table('conversation_participants')->where('conversation_id', $conversation)->where('user_id', '<>', $r->user()->id)->value('user_id');
        BlockGuard::assertAllowed($r->user()->id, $other);

        return response()->json(['data' => DB::table('messages')->where('conversation_id', $conversation)->orderByDesc('created_at')->cursorPaginate(50)]);
    }

    public function send(Request $r, string $conversation)
    {
        $conversationModel = $this->member($conversation, $r->user()->id);
        Gate::forUser($r->user())->authorize('send', $conversationModel);
        $other = DB::table('conversation_participants')->where('conversation_id', $conversation)->where('user_id', '<>', $r->user()->id)->value('user_id');
        BlockGuard::assertAllowed($r->user()->id, $other);
        $d = $r->validate(['text' => 'required|string|max:4000', 'client_message_id' => 'required|uuid']);
        $inserted = DB::transaction(function () use ($r, $conversation, $other, $d) {
            $created = DB::table('messages')->insertOrIgnore(['id' => Str::uuid()->toString(), 'conversation_id' => $conversation, 'sender_id' => $r->user()->id, 'client_message_id' => $d['client_message_id'], 'text' => $d['text'], 'created_at' => now(), 'updated_at' => now()]);
            if ($created) {
                DB::table('conversation_participants')->where('conversation_id', $conversation)->where('user_id', $other)->increment('unread_count');
                NotificationWriter::create($other, 'message', 'A new message', mb_substr($d['text'], 0, 160), ['user_id' => $r->user()->id, 'conversation_id' => $conversation]);
            }

            return $created;
        });
        $message = DB::table('messages')->where('conversation_id', $conversation)->where('sender_id', $r->user()->id)->where('client_message_id', $d['client_message_id'])->first();
        if ($message && $inserted) {
            DB::afterCommit(function () use ($conversation, $message): void {
                $generation = BroadcastPrivacy::conversationGeneration($conversation);
                if ($generation !== null) {
                    event(new MessageSent($conversation, (array) $message, $generation));
                }
            });
        }

        return response()->json(['data' => $message], $inserted ? 201 : 200);
    }

    public function read(Request $r, string $conversation)
    {
        $this->member($conversation, $r->user()->id);
        $other = DB::table('conversation_participants')->where('conversation_id', $conversation)->where('user_id', '<>', $r->user()->id)->value('user_id');
        BlockGuard::assertAllowed($r->user()->id, $other);
        $data = $r->validate(['through_message_id' => 'nullable|uuid']);
        $through = null;
        if (! empty($data['through_message_id'])) {
            $through = DB::table('messages')->where('id', $data['through_message_id'])->where('conversation_id', $conversation)->first();
            abort_unless($through && $through->sender_id !== $r->user()->id, 422);
            DB::table('messages')->where('conversation_id', $conversation)->where('sender_id', '<>', $r->user()->id)->where('created_at', '<=', $through->created_at)->whereNull('read_at')->update(['read_at' => now(), 'updated_at' => now()]);
        }
        $unread = DB::table('messages')->where('conversation_id', $conversation)->where('sender_id', '<>', $r->user()->id)->whereNull('read_at')->count();
        DB::table('conversation_participants')->where('conversation_id', $conversation)->where('user_id', $r->user()->id)->update(['unread_count' => $unread, 'last_read_at' => now(), 'updated_at' => now()]);
        $readerId = $r->user()->id;
        DB::afterCommit(function () use ($conversation, $readerId, $through): void {
            $generation = BroadcastPrivacy::conversationGeneration($conversation);
            if ($generation !== null) {
                event(new MessageRead($conversation, $readerId, $through?->id, $generation));
            }
        });

        return response()->noContent();
    }
}
