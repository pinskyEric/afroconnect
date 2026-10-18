<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AppealController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SafetyController;
use App\Http\Controllers\Api\SocialController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:120,1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1,register');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:8,1,login');
    Route::post('auth/password/forgot', [AuthController::class, 'forgot'])->middleware('throttle:3,1,password-forgot');
    Route::post('auth/password/reset', [AuthController::class, 'reset'])->middleware('throttle:5,1,password-reset');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [ProfileController::class, 'me']);
        Route::get('me/appeals', [AppealController::class, 'index'])->middleware('ability:appeals:read');
        Route::post('me/appeals', [AppealController::class, 'store'])->middleware(['ability:appeals:create', 'throttle:3,10080,appeal']);
        Route::post('me/onboarding/complete', [ProfileController::class, 'completeOnboarding']);
        Route::post('me/presence/heartbeat', [ProfileController::class, 'heartbeat'])->middleware('throttle:30,1,presence');
        Route::match(['patch', 'put'], 'me/profile', [ProfileController::class, 'update'])->middleware('active');
        Route::get('me/preferences', [ProfileController::class, 'preferences'])->middleware('active');
        Route::patch('me/preferences', [ProfileController::class, 'updatePreferences'])->middleware('active');
        Route::post('me/profile/photo', [ProfileController::class, 'photo'])->middleware(['active', 'throttle:10,1,profile-photo']);
        Route::delete('me/profile/photo', [ProfileController::class, 'deletePhoto'])->middleware('active');

        Route::middleware('active')->group(function () {
            Route::get('me/export', [AccountController::class, 'export'])->middleware('throttle:1,60,account-export');
            Route::delete('me/account', [AccountController::class, 'destroy'])->middleware('throttle:2,1440,account-delete');
            Route::get('profiles', [DiscoveryController::class, 'index'])->middleware('throttle:60,1,discovery');
            Route::get('me/favorites', [SocialController::class, 'favorites']);
            Route::put('me/favorites/{user}', [SocialController::class, 'favorite']);
            Route::delete('me/favorites/{user}', [SocialController::class, 'unfavorite']);
            Route::get('friends', [SocialController::class, 'friends']);
            Route::get('friend-requests', [SocialController::class, 'requests']);
            Route::post('friend-requests', [SocialController::class, 'request'])->middleware('throttle:10,1,friend-request');
            Route::post('friend-requests/{friendRequest}/{action}', [SocialController::class, 'respond'])->whereIn('action', ['accept', 'decline', 'cancel']);
            Route::delete('friends/{user}', [SocialController::class, 'remove']);
            Route::get('conversations', [MessageController::class, 'conversations']);
            Route::post('conversations', [MessageController::class, 'createConversation']);
            Route::get('conversations/{conversation}/messages', [MessageController::class, 'history']);
            Route::post('conversations/{conversation}/messages', [MessageController::class, 'send'])->middleware('throttle:30,1,message-send');
            Route::post('conversations/{conversation}/read', [MessageController::class, 'read']);
            Route::get('notifications', [NotificationController::class, 'index']);
            Route::post('notifications/{notification}/read', [NotificationController::class, 'read']);
            Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
            Route::get('blocks', [SafetyController::class, 'blocks']);
            Route::post('blocks', [SafetyController::class, 'block'])->middleware('throttle:10,1,block');
            Route::delete('blocks/{user}', [SafetyController::class, 'unblock']);
            Route::post('reports', [SafetyController::class, 'report'])->middleware('throttle:5,60,report');
            Route::put('matchmaking/preferences', [MatchController::class, 'preferences']);
            Route::post('matchmaking/queue', [MatchController::class, 'queue'])->middleware('throttle:5,1,matchmaking');
            Route::get('matchmaking/queue/{entry}', [MatchController::class, 'queueStatus']);
            Route::delete('matchmaking/queue/{entry}', [MatchController::class, 'cancel']);
            Route::get('matches/{match}', [MatchController::class, 'show']);
            Route::post('matches/{match}/{action}', [MatchController::class, 'act'])->whereIn('action', ['accept', 'skip', 'next']);
            Route::post('calls', [MatchController::class, 'createCall']);
            Route::post('calls/{call}/{action}', [MatchController::class, 'updateCallStatus'])->whereIn('action', ['accept', 'end']);
            Route::post('calls/{call}/signals', [MatchController::class, 'signal'])->middleware('throttle:120,1,call-signal');
            Route::get('calls/{call}/ice-servers', [MatchController::class, 'iceServers']);
        });
    });

    Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
        Route::get('reports', [AdminController::class, 'reports']);
        Route::post('reports/{report}/decision', [AdminController::class, 'decision']);
        Route::get('appeals', [AdminController::class, 'appeals']);
        Route::post('appeals/{appeal}/decision', [AdminController::class, 'appealDecision']);
        Route::get('users', [AdminController::class, 'users']);
        Route::patch('users/{user}/status', [AdminController::class, 'status']);
        Route::get('audit', [AdminController::class, 'audit']);
    });
});
