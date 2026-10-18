<?php

namespace App\Http\Controllers\Api;

use App\Events\CallSignal;
use App\Events\MatchStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\CallSession;
use App\Models\MatchRecord;
use App\Services\BlockGuard;
use App\Services\MatchmakingService;
use App\Services\PresenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class MatchController extends Controller
{
    public function preferences(Request $r)
    {
        $d = $r->validate(['mode' => 'required|in:video,text', 'countries' => 'array|max:20', 'countries.*' => 'string|max:80', 'languages' => 'array|max:20', 'languages.*' => 'string|max:40', 'interests' => 'array|max:30', 'interests.*' => 'string|max:60']);
        DB::table('match_preferences')->updateOrInsert(['user_id' => $r->user()->id], $d + ['updated_at' => now(), 'created_at' => now()]);

        return response()->json(['data' => $d]);
    }

    public function queue(Request $r)
    {
        app(PresenceService::class)->heartbeat($r->user());
        $result = app(MatchmakingService::class)->enqueue($r->user());

        return response()->json(['data' => $result], 202);
    }

    public function queueStatus(Request $r, string $entry)
    {
        return response()->json(['data' => app(MatchmakingService::class)->status($r->user(), $entry)]);
    }

    public function cancel(Request $r, string $entry)
    {
        app(MatchmakingService::class)->cancel($r->user(), $entry);

        return response()->noContent();
    }

    public function show(Request $r, string $match)
    {
        $model = MatchRecord::findOrFail($match);
        Gate::forUser($r->user())->authorize('view', $model);
        $row = DB::table('matches')->where('id', $match)->first();
        abort_unless($row, 404);
        $otherId = $row->user_one_id === $r->user()->id ? $row->user_two_id : $row->user_one_id;
        BlockGuard::assertAllowed($r->user()->id, $otherId);
        $other = User::where('id', $otherId)->where('status', 'active')->firstOrFail();

        return response()->json(['data' => ['id' => $row->id, 'status' => $row->status, 'user' => $other->publicProfile()]]);
    }

    public function act(Request $r, string $match, string $action)
    {
        $matchModel = MatchRecord::findOrFail($match);
        $ability = $action === 'accept' ? 'accept' : 'view';
        Gate::forUser($r->user())->authorize($ability, $matchModel);
        $m = DB::table('matches')->where('id', $match)->first();
        abort_unless($m && in_array($r->user()->id, [$m->user_one_id, $m->user_two_id], true), 404);
        BlockGuard::assertAllowed($m->user_one_id, $m->user_two_id);
        if ($action === 'skip' || $action === 'next') {
            abort_unless(in_array($m->status, ['pending', 'accepted'], true), 409);
            $status = 'skipped';
            DB::transaction(function () use ($match, $m, $status) {
                DB::table('matches')->where('id', $match)->update(['status' => $status, 'updated_at' => now()]);
                DB::table('call_sessions')->where('match_id', $match)->whereIn('status', ['ringing', 'active'])->update(['status' => 'ended', 'ended_at' => now(), 'updated_at' => now()]);
                DB::afterCommit(fn () => event(new MatchStatusChanged($match, $m->user_one_id, $m->user_two_id, $status)));
            });
        } else {
            $field = $r->user()->id === $m->user_one_id ? 'user_one_accepted_at' : 'user_two_accepted_at';
            DB::transaction(function () use ($match, $field) {
                $row = DB::table('matches')->where('id', $match)->lockForUpdate()->first();
                if (! $row || $row->status !== 'pending') {
                    return;
                }DB::table('matches')->where('id', $match)->update([$field => now(), 'updated_at' => now()]);
                $fresh = DB::table('matches')->where('id', $match)->first();
                if ($fresh->user_one_accepted_at && $fresh->user_two_accepted_at) {
                    DB::table('matches')->where('id', $match)->update(['status' => 'accepted', 'accepted_at' => now(), 'updated_at' => now()]);
                }
            });
            $status = DB::table('matches')->where('id', $match)->value('status');
            DB::afterCommit(fn () => event(new MatchStatusChanged($match, $m->user_one_id, $m->user_two_id, $status)));
        }

        $result = ['id' => $match, 'status' => $status];
        if ($action === 'next') {
            $result['queue'] = app(MatchmakingService::class)->enqueue($r->user());
        }

        return response()->json(['data' => $result]);
    }

    public function createCall(Request $r)
    {
        $d = $r->validate(['match_id' => 'required|uuid|exists:matches,id']);
        $m = DB::table('matches')->where('id', $d['match_id'])->where('status', 'accepted')->first();
        abort_unless($m && in_array($r->user()->id, [$m->user_one_id, $m->user_two_id], true), 403);
        BlockGuard::assertAllowed($m->user_one_id, $m->user_two_id);
        $id = Str::uuid()->toString();
        DB::table('call_sessions')->insert(['id' => $id, 'match_id' => $m->id, 'created_by' => $r->user()->id, 'status' => 'ringing', 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['data' => ['id' => $id, 'status' => 'ringing']], 201);
    }

    public function updateCallStatus(Request $r, string $call, string $action)
    {
        $callModel = CallSession::findOrFail($call);
        Gate::forUser($r->user())->authorize('participate', $callModel);
        $c = $callModel;
        $m = DB::table('matches')->where('id', $c->match_id)->first();
        abort_unless($m, 404);
        BlockGuard::assertAllowed($m->user_one_id, $m->user_two_id);
        $status = $action === 'end' ? 'ended' : 'active';
        DB::table('call_sessions')->where('id', $call)->update(['status' => $status, 'started_at' => $status === 'active' ? now() : null, 'ended_at' => $status === 'ended' ? now() : null, 'updated_at' => now()]);

        return response()->json(['data' => ['id' => $call, 'status' => $status]]);
    }

    public function signal(Request $r, string $call)
    {
        $c = CallSession::findOrFail($call);
        Gate::forUser($r->user())->authorize('participate', $c);
        $m = DB::table('matches')->where('id', $c->match_id)->first();
        abort_unless($m, 404);
        BlockGuard::assertAllowed($m->user_one_id, $m->user_two_id);
        $d = $r->validate([
            'type' => 'required|in:offer,answer,ice-candidate',
            'payload' => 'required|array',
            'payload.type' => 'required_if:type,offer,answer|in:offer,answer',
            'payload.sdp' => 'required_if:type,offer,answer|string|max:12000',
            'payload.candidate' => 'required_if:type,ice-candidate|string|max:4096',
            'payload.sdpMid' => 'nullable|string|max:256',
            'payload.sdpMLineIndex' => 'nullable|integer|min:0|max:65535',
        ]);
        abort_if(strlen(json_encode($d['payload'])) > 16000, 413);
        event(new CallSignal($call, $r->user()->id, $d['type'], $d['payload']));

        return response()->json(['status' => 'signal relayed'], 202);
    }

    public function iceServers(Request $r, string $call)
    {
        $c = CallSession::findOrFail($call);
        Gate::forUser($r->user())->authorize('participate', $c);
        $m = DB::table('matches')->where('id', $c->match_id)->first();
        abort_unless($m, 404);
        BlockGuard::assertAllowed($m->user_one_id, $m->user_two_id);

        return response()->json(['data' => ['iceServers' => [['urls' => ['stun:stun.l.google.com:19302']]]]]);
    }
}
