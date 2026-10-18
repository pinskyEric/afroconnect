<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appeal;
use App\Models\Report;
use App\Models\User;
use App\Services\ConversationChannelRotator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function reports()
    {
        return response()->json(['data' => DB::table('reports')->orderBy('created_at')->paginate(30)]);
    }

    public function decision(Request $r, string $report)
    {
        $d = $r->validate([
            'decision' => 'required|in:resolved,actioned,dismissed',
            'notes' => 'nullable|string|max:2000',
            'account_status' => 'required_if:decision,actioned|prohibited_unless:decision,actioned|in:suspended,banned',
        ]);
        $reportModel = Report::findOrFail($report);
        $this->authorize('review', $reportModel);
        if ($d['decision'] === 'actioned') {
            abort_if($reportModel->user_id === $r->user()->id, 403, 'Moderators cannot take action on their own account.');
        }
        DB::transaction(function () use ($r, $report, $reportModel, $d) {
            DB::table('moderation_decisions')->insert(['report_id' => $report, 'moderator_id' => $r->user()->id, 'decision' => $d['decision'], 'notes' => $d['notes'] ?? null, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('reports')->where('id', $report)->update(['status' => 'resolved', 'updated_at' => now()]);
            $this->recordAudit($r, 'report.decision', 'report', $report, $d);

            if ($d['decision'] === 'actioned') {
                $target = User::findOrFail($reportModel->user_id);
                $target->update(['status' => $d['account_status']]);
                $target->tokens()->delete();
                $this->rotateConversationChannels($target->id);
                $this->recordAudit($r, 'user.status', 'user', $target->id, [
                    'status' => $d['account_status'],
                    'reason' => $d['notes'] ?? 'Action taken on report '.$report,
                ]);
            }
        });

        return response()->noContent();
    }

    public function users(Request $r)
    {
        $d = $r->validate(['search' => 'nullable|string|max:100', 'status' => 'nullable|in:active,suspended,banned', 'page' => 'nullable|integer|min:1']);
        $q = User::query()->select('id', 'name', 'username', 'email', 'country', 'status', 'created_at');
        if (isset($d['search'])) {
            $q->where(fn ($x) => $x->where('email', 'ilike', '%'.$d['search'].'%')->orWhere('username', 'ilike', '%'.$d['search'].'%'));
        }if (isset($d['status'])) {
            $q->where('status', $d['status']);
        }

        return response()->json(['data' => $q->paginate(30)]);
    }

    public function status(Request $r, string $user)
    {
        $d = $r->validate(['status' => 'required|in:active,suspended,banned', 'reason' => 'required|string|max:1000']);
        $u = User::findOrFail($user);
        abort_if($u->id === $r->user()->id, 403);
        DB::transaction(function () use ($r, $u, $d) {
            $u->update(['status' => $d['status']]);
            if ($d['status'] !== 'active') {
                $u->tokens()->delete();
            }
            $this->rotateConversationChannels($u->id);
            $this->recordAudit($r, 'user.status', 'user', $u->id, $d);
        });

        return response()->noContent();
    }

    public function appeals(Request $request)
    {
        $data = $request->validate(['status' => 'nullable|in:pending,upheld,reinstated,dismissed', 'page' => 'nullable|integer|min:1']);
        $query = Appeal::query()->with('user:id,name,username,status');
        if (isset($data['status'])) {
            $query->where('status', $data['status']);
        }

        return response()->json(['data' => $query->orderBy('created_at')->paginate(30)]);
    }

    public function appealDecision(Request $request, string $appeal)
    {
        $data = $request->validate([
            'decision' => 'required|in:upheld,reinstated,dismissed',
            'notes' => 'required|string|min:5|max:2000',
        ]);
        $model = Appeal::findOrFail($appeal);
        abort_unless($model->status === 'pending', 409, 'This appeal has already been decided.');
        abort_if($model->user_id === $request->user()->id, 403, 'Moderators cannot decide their own appeal.');

        DB::transaction(function () use ($request, $model, $data): void {
            $model = Appeal::whereKey($model->id)->lockForUpdate()->firstOrFail();
            abort_unless($model->status === 'pending', 409, 'This appeal has already been decided.');
            $model->update([
                'status' => $data['decision'],
                'decision_notes' => $data['notes'],
                'reviewer_id' => $request->user()->id,
                'decided_at' => now(),
            ]);

            if ($data['decision'] === 'reinstated') {
                $target = User::findOrFail($model->user_id);
                $target->update(['status' => 'active']);
                $this->rotateConversationChannels($target->id);
                $this->recordAudit($request, 'appeal.reinstated', 'user', $target->id, [
                    'decision' => $data['decision'],
                    'notes' => $data['notes'],
                ]);
            }

            $this->recordAudit($request, 'appeal.decision', 'appeal', $model->id, [
                'decision' => $data['decision'],
                'notes' => $data['notes'],
            ]);
        });

        return response()->noContent();
    }

    public function audit()
    {
        return response()->json(['data' => DB::table('admin_audit_logs')->orderByDesc('created_at')->paginate(50)]);
    }

    private function rotateConversationChannels(string $userId): void
    {
        app(ConversationChannelRotator::class)->rotateForUser($userId);
    }

    private function recordAudit(Request $r, string $action, string $type, string $id, array $meta): void
    {
        DB::table('admin_audit_logs')->insert(['admin_id' => $r->user()->id, 'action' => $action, 'target_type' => $type, 'target_id' => $id, 'metadata' => json_encode(['reason' => $meta['reason'] ?? $meta['notes'] ?? null, 'decision' => $meta['decision'] ?? null, 'status' => $meta['status'] ?? $meta['account_status'] ?? null]), 'ip_address' => $r->ip(), 'created_at' => now(), 'updated_at' => now()]);
    }
}
