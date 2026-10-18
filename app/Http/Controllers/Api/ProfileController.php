<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PresenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ProfileController extends Controller
{
    public function me(Request $r)
    {
        $u = $r->user();

        return response()->json(['data' => ['id' => $u->id, 'email' => $u->email, 'phone' => $u->phone, 'status' => $u->status, 'profile' => $u->publicProfile()]]);
    }

    public function completeOnboarding(Request $r)
    {
        abort_unless($r->user()->status === 'onboarding', 409, 'Onboarding is already complete.');
        $data = $r->validate([
            'birth_date' => 'required|date|after_or_equal:1900-01-01|before_or_equal:'.now()->subYears(18)->toDateString(),
            'name' => 'required|string|max:80',
            'username' => 'required|alpha_dash|min:3|max:30|unique:users,username,'.$r->user()->id,
            'country' => 'required|string|max:80',
            'languages' => 'required|array|min:1|max:10',
            'languages.*' => 'string|max:40',
            'interests' => 'required|array|max:30',
            'interests.*' => 'string|max:60',
            'bio' => 'nullable|string|max:500',
        ]);
        $r->user()->update($data + ['status' => 'active']);

        return response()->json(['data' => $r->user()->fresh()->publicProfile()]);
    }

    public function heartbeat(Request $r)
    {
        app(PresenceService::class)->heartbeat($r->user());

        return response()->noContent();
    }

    public function update(Request $r)
    {
        $d = $r->validate(['name' => 'sometimes|string|max:80', 'username' => 'sometimes|alpha_dash|min:3|max:30|unique:users,username,'.$r->user()->id, 'country' => 'nullable|string|max:80', 'languages' => 'sometimes|array|max:10', 'languages.*' => 'string|max:40', 'interests' => 'sometimes|array|max:30', 'interests.*' => 'string|max:60', 'bio' => 'nullable|string|max:500', 'online' => 'sometimes|boolean']);
        $r->user()->update($d);
        if (array_key_exists('online', $d)) {
            if ($d['online']) {
                app(PresenceService::class)->heartbeat($r->user());
            } else {
                app(PresenceService::class)->offline($r->user());
            }
        }

        return response()->json(['data' => $r->user()->fresh()->publicProfile()]);
    }

    public function preferences(Request $r)
    {
        $prefs = \DB::table('user_preferences')->where('user_id', $r->user()->id)->value('preferences');

        return response()->json(['data' => json_decode($prefs ?: '{}', true)]);
    }

    public function updatePreferences(Request $r)
    {
        $d = $r->validate(['online' => 'sometimes|boolean', 'notifications' => 'sometimes|boolean', 'sounds' => 'sometimes|boolean', 'video' => 'sometimes|boolean', 'dataSaver' => 'sometimes|boolean', 'reducedMotion' => 'sometimes|boolean', 'highContrast' => 'sometimes|boolean', 'requests' => 'sometimes|in:Everyone,Friends only,Nobody', 'messages' => 'sometimes|in:Everyone,Friends only,Nobody', 'language' => 'sometimes|string|max:40', 'country' => 'sometimes|string|max:80']);
        $old = json_decode(\DB::table('user_preferences')->where('user_id', $r->user()->id)->value('preferences') ?: '{}', true);
        $prefs = array_merge($old, $d);
        \DB::table('user_preferences')->updateOrInsert(['user_id' => $r->user()->id], ['preferences' => json_encode($prefs), 'updated_at' => now(), 'created_at' => now()]);
        if (array_key_exists('online', $d)) {
            if ($d['online']) {
                app(PresenceService::class)->heartbeat($r->user());
            } else {
                app(PresenceService::class)->offline($r->user());
            }
        }

        return response()->json(['data' => $prefs]);
    }

    public function photo(Request $r)
    {
        $r->validate(['photo' => 'required|image|mimes:jpeg,png,webp|max:5120|dimensions:max_width=3000,max_height=3000']);
        $file = $r->file('photo');
        try {
            $image = (new ImageManager(new Driver))->read($file->getRealPath())->orient()->scaleDown(width: 1600, height: 1600)->toWebp(quality: 82);
        } catch (\Throwable $e) {
            abort(422, 'Invalid image content.');
        }$key = 'profiles/'.$r->user()->id.'/'.Str::uuid().'.webp';
        \Storage::disk('s3')->put($key, (string) $image, ['visibility' => 'private', 'ContentType' => 'image/webp']);
        if ($r->user()->photo_key) {
            \Storage::disk('s3')->delete($r->user()->photo_key);
        }$r->user()->update(['photo_key' => $key]);

        return response()->json(['data' => ['photo_url' => $r->user()->fresh()->publicProfile()['photo']]], 201);
    }

    public function deletePhoto(Request $r)
    {
        if ($r->user()->photo_key) {
            \Storage::disk('s3')->delete($r->user()->photo_key);
        }$r->user()->update(['photo_key' => null]);

        return response()->noContent();
    }
}
