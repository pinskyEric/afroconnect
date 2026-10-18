<?php

use App\Jobs\PruneEphemeralState;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new PruneEphemeralState)->everyMinute()->withoutOverlapping();
