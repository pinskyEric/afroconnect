<?php

namespace App\Http\Controllers\Api;

use App\Events\NotificationRead;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $r)
    {
        $q = DB::table('notifications')->where('user_id', $r->user()->id);
        if ($r->boolean('unread')) {
            $q->whereNull('read_at');
        }

        $page = $q->orderByDesc('created_at')->paginate(30);
        $data = $page->getCollection()->map(function ($n) {
            $meta = json_decode($n->data ?: '{}', true) ?: [];
            $href = match ($n->kind) {
                'request', 'accepted' => '/app/friends',
                'message' => isset($meta['user_id']) ? '/app/messages?user='.$meta['user_id'] : '/app/messages',
                'match' => '/app/discover',
                'safety' => '/app/safety',
                default => '/app',
            };

            return ['id' => $n->id, 'kind' => $n->kind, 'title' => $n->title, 'description' => $n->description, 'time' => $n->created_at, 'read' => $n->read_at !== null, 'href' => $href];
        });

        return response()->json(['data' => $data, 'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total(), 'last_page' => $page->lastPage()]]);
    }

    public function read(Request $r, string $notification)
    {
        $n = DB::table('notifications')->where('id', $notification)->where('user_id', $r->user()->id)->first();
        abort_unless($n, 404);
        if ($n->read_at === null) {
            $readAt = now();
            DB::table('notifications')->where('id', $notification)->update(['read_at' => $readAt, 'updated_at' => $readAt]);
            DB::afterCommit(fn () => event(new NotificationRead($r->user()->id, $notification, $readAt->toISOString())));
        }

        return response()->noContent();
    }

    public function readAll(Request $r)
    {
        $readAt = now();
        $updated = DB::table('notifications')->where('user_id', $r->user()->id)->whereNull('read_at')->update(['read_at' => $readAt, 'updated_at' => $readAt]);
        if ($updated > 0) {
            DB::afterCommit(fn () => event(new NotificationRead($r->user()->id, null, $readAt->toISOString())));
        }

        return response()->noContent();
    }
}
