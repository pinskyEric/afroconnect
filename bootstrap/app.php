<?php

use App\Http\Middleware\ApiSecurityHeaders;
use App\Http\Middleware\RequireActiveAccount;
use App\Http\Middleware\RequireAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php', health: '/up')
    ->withCommands([__DIR__.'/../app/Console/Commands'])
    ->withBroadcasting(__DIR__.'/../routes/channels.php', ['middleware' => ['api', 'auth:sanctum']])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->append(ApiSecurityHeaders::class);
        $middleware->alias([
            'admin' => RequireAdmin::class,
            'active' => RequireActiveAccount::class,
            'ability' => CheckForAnyAbility::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Laravel's JSON API exception rendering is negotiated by Accept: application/json.
    })->create();
