<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountDeletionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AccountController extends Controller
{
    public function export(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $conversationIds = DB::table('conversation_participants')
            ->where('user_id', $user->id)
            ->pluck('conversation_id');

        $messages = $conversationIds->isEmpty()
            ? collect()
            : DB::table('messages')->whereIn('conversation_id', $conversationIds)
                ->orderBy('created_at')->get([
                    'id', 'conversation_id', 'sender_id', 'client_message_id', 'text', 'created_at', 'read_at',
                ]);

        $payload = [
            'generated_at' => now()->toISOString(),
            'account' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'birth_date' => $user->birth_date?->toDateString(),
                'country' => $user->country,
                'languages' => $user->languages ?? [],
                'interests' => $user->interests ?? [],
                'bio' => $user->bio,
                'photo_url' => $user->photo_key
                    ? Storage::disk('s3')->temporaryUrl($user->photo_key, now()->addHour())
                    : null,
                'created_at' => $user->created_at?->toISOString(),
            ],
            'preferences' => DB::table('user_preferences')->where('user_id', $user->id)->value('preferences')
                ? json_decode(DB::table('user_preferences')->where('user_id', $user->id)->value('preferences'), true)
                : [],
            'favorites' => DB::table('favorites')->where('user_id', $user->id)->get(['favorite_id', 'created_at']),
            'friendships' => DB::table('friendships')->where('user_id', $user->id)->orWhere('friend_id', $user->id)->get(['user_id', 'friend_id', 'created_at']),
            'friend_requests' => DB::table('friend_requests')->where('sender_id', $user->id)->orWhere('recipient_id', $user->id)->get(['id', 'sender_id', 'recipient_id', 'status', 'created_at', 'updated_at']),
            'blocks' => DB::table('blocks')->where('blocker_id', $user->id)->orWhere('blocked_id', $user->id)->get(['blocker_id', 'blocked_id', 'created_at']),
            'conversations' => $conversationIds,
            'messages' => $messages,
            'notifications' => DB::table('notifications')->where('user_id', $user->id)->orderBy('created_at')->get(['id', 'kind', 'title', 'description', 'data', 'read_at', 'created_at']),
            'reports' => DB::table('reports')->where('reporter_id', $user->id)->orWhere('user_id', $user->id)->orderBy('created_at')->get(['id', 'reporter_id', 'user_id', 'category', 'details', 'status', 'created_at', 'updated_at']),
            'appeals' => DB::table('appeals')->where('user_id', $user->id)->orderBy('created_at')->get(['id', 'source_report_id', 'reason', 'status', 'decision_notes', 'decided_at', 'created_at', 'updated_at']),
        ];

        return response()->json(['data' => $payload])
            ->header('Content-Disposition', 'attachment; filename="africonnect-account-export.json"');
    }

    public function destroy(Request $request, AccountDeletionService $deletion)
    {
        $data = $request->validate([
            'password' => 'required|string|max:200',
            'confirmation' => 'required|in:DELETE',
        ]);
        abort_unless(Hash::check($data['password'], $request->user()->password), 422, 'Password confirmation failed.');

        $deletion->delete($request->user());

        return response()->noContent();
    }
}
