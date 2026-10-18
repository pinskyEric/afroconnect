<?php

namespace App\Jobs;

use App\Services\MatchmakingService;
use App\Services\PresenceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class PruneEphemeralState implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(PresenceService $presence, MatchmakingService $matchmaking): void
    {
        $presence->prune();
        $matchmaking->prune();

        $now = now();
        DB::table('call_sessions')
            ->where('status', 'ringing')
            ->where('created_at', '<', $now->copy()->subMinutes(2))
            ->update(['status' => 'ended', 'ended_at' => $now, 'updated_at' => $now]);
        DB::table('call_sessions')
            ->where('status', 'active')
            ->where('started_at', '<', $now->copy()->subHours(4))
            ->update(['status' => 'ended', 'ended_at' => $now, 'updated_at' => $now]);

        $cutoff = $now->copy()->subDays(max(1, (int) config('africonnect.moderation_retention_days', 365)));
        DB::table('reports')->where('status', '!=', 'pending')->where('updated_at', '<', $cutoff)->delete();
        DB::table('appeals')->where('status', '!=', 'pending')->where('updated_at', '<', $cutoff)->delete();
        DB::table('admin_audit_logs')->where('created_at', '<', $cutoff)->delete();
    }
}
