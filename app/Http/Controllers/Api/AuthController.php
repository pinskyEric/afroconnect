<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PresenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'identity' => 'required|string|max:254',
            'password' => ['required', 'confirmed', PasswordRule::min(12)->mixedCase()->numbers()->symbols()],
            'terms_accepted' => 'accepted',
        ]);
        [$email, $phone] = $this->normalizeIdentity($data['identity']);
        abort_if(User::where('email', $email)->orWhere('phone', $phone)->exists(), 422, 'An account already exists for that email or phone.');
        $user = User::create([
            'email' => $email,
            'phone' => $phone,
            'name' => 'New member',
            'username' => 'member'.Str::lower(Str::random(10)),
            'password' => $data['password'],
            'role' => 'user',
            'status' => 'onboarding',
        ]);

        return response()->json(['data' => [
            'user' => ['id' => $user->id, 'identity' => $email ?? $phone, 'status' => $user->status, 'profile' => $user->publicProfile()],
            ...$this->authCredential($request, $user, ['*']),
        ]], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['identity' => 'required|string|max:254', 'password' => 'required|string']);
        [$email, $phone] = $this->normalizeIdentity($data['identity']);
        $user = User::where('email', $email)->orWhere('phone', $phone)->first();
        abort_unless($user && in_array($user->status, ['active', 'onboarding', 'suspended', 'banned'], true) && Hash::check($data['password'], $user->password), 422, 'Invalid credentials.');
        $abilities = in_array($user->status, ['suspended', 'banned'], true)
            ? ['appeals:read', 'appeals:create']
            : ['*'];

        return response()->json(['data' => [
            'user' => ['id' => $user->id, 'identity' => $email ?? $phone, 'status' => $user->status, 'profile' => $user->publicProfile()],
            ...$this->authCredential($request, $user, $abilities),
        ]]);
    }

    public function logout(Request $request)
    {
        app(PresenceService::class)->offline($request->user());
        $request->user()->currentAccessToken()?->delete();
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->noContent();
    }

    public function forgot(Request $request)
    {
        $data = $request->validate(['identity' => 'required|string|max:254']);
        [$email] = $this->normalizeIdentity($data['identity']);
        if ($email) {
            Password::sendResetLink(['email' => $email]);
        }

        return response()->json(['message' => 'If the account is eligible, reset instructions will be sent.'], 202);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'confirmed', PasswordRule::min(12)->mixedCase()->numbers()->symbols()],
        ]);
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $user->tokens()->delete();
        });

        return $status === Password::PASSWORD_RESET
            ? response()->noContent()
            : response()->json(['message' => 'Invalid or expired reset token.'], 422);
    }

    private function authCredential(Request $request, User $user, array $abilities): array
    {
        if ($request->hasSession() && $request->headers->has('Origin')) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();

            return [];
        }

        return ['token' => $user->createToken('api', $abilities)->plainTextToken];
    }

    private function normalizeIdentity(string $identity): array
    {
        $identity = trim($identity);
        if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
            return [Str::lower($identity), null];
        }
        $phone = preg_replace('/[\s().-]+/', '', $identity);
        abort_unless(is_string($phone) && preg_match('/^\+?[1-9][0-9]{6,14}$/', $phone), 422, 'Enter a valid email address or international phone number.');

        return [null, $phone];
    }
}
