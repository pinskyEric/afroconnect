<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PromoteUserToAdmin extends Command
{
    protected $signature = 'africonnect:admin:promote {email : Existing verified operator account email} {--force : Skip interactive confirmation}';

    protected $description = 'Grant the admin role to an existing active user from a trusted CLI session';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();
        if (! $user || $user->status !== 'active') {
            $this->components->error('An existing active account is required.');

            return self::FAILURE;
        }
        if ($user->role === 'admin') {
            $this->components->info('This account already has the admin role.');

            return self::SUCCESS;
        }
        if (! $this->option('force') && ! $this->confirm("Grant admin access to {$user->email}? This enables private moderation endpoints.")) {
            return self::FAILURE;
        }

        DB::transaction(function () use ($user) {
            $user->update(['role' => 'admin']);
            DB::table('admin_audit_logs')->insert([
                'admin_id' => $user->id,
                'action' => 'admin.role.granted',
                'target_type' => 'user',
                'target_id' => $user->id,
                'metadata' => json_encode(['source' => 'trusted_cli', 'note' => 'Provisioned by deployment operator']),
                'ip_address' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
        $this->components->info('Admin role granted and recorded in the audit log.');

        return self::SUCCESS;
    }
}
