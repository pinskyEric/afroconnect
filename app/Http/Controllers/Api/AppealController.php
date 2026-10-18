<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appeal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AppealController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => Appeal::query()->where('user_id', $request->user()->id)
                ->latest()->paginate(20),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'reason' => 'required|string|min:30|max:5000',
            'source_report_id' => 'nullable|uuid',
        ]);
        /** @var User $user */
        $user = $request->user();
        abort_unless(in_array($user->status, ['suspended', 'banned'], true), 409, 'Only suspended or banned accounts may appeal.');

        if (! empty($data['source_report_id'])) {
            abort_unless(DB::table('reports')->where('id', $data['source_report_id'])
                ->where('user_id', $user->id)->exists(), 404);
        }

        $appeal = DB::transaction(function () use ($user, $data): Appeal {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_if(Appeal::where('user_id', $user->id)->where('status', 'pending')->exists(), 409, 'An appeal is already under review.');

            return Appeal::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'source_report_id' => $data['source_report_id'] ?? null,
                'reason' => $data['reason'],
                'status' => 'pending',
            ]);
        });

        return response()->json(['data' => $appeal], 201);
    }
}
