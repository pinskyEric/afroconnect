<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function review(User $user, Report $report): bool
    {
        return $user->status === 'active' && $user->role === 'admin' && $report->status === 'pending';
    }
}
