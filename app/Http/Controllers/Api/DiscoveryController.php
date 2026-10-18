<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PresenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscoveryController extends Controller
{
    public function index(Request $r)
    {
        $d = $r->validate(['search' => 'nullable|string|max:100', 'country' => 'nullable|string|max:80', 'region' => 'nullable|string|max:80', 'language' => 'nullable|string|max:40', 'interest' => 'nullable|string|max:60', 'online' => 'nullable|boolean', 'favorite' => 'nullable|boolean', 'page' => 'nullable|integer|min:1', 'per_page' => 'nullable|integer|min:1|max:50']);
        $onlineIds = app(PresenceService::class)->onlineIds();
        $onlineSet = array_fill_keys($onlineIds, true);
        $q = User::query()->withCount('friends')->where('status', 'active')->whereNull('deleted_at');
        if ($r->user()) {
            $me = $r->user()->id;
            $q->where('id', '<>', $me)->whereNotIn('id', DB::table('blocks')->select('blocked_id')->where('blocker_id', $me)->union(DB::table('blocks')->select('blocker_id')->where('blocked_id', $me)));
        }if (isset($d['search'])) {
            $q->where(fn ($x) => $x->where('name', 'ilike', '%'.$d['search'].'%')->orWhere('username', 'ilike', '%'.$d['search'].'%')->orWhere('bio', 'ilike', '%'.$d['search'].'%'));
        }if (isset($d['country'])) {
            $q->where('country', $d['country']);
        }if (isset($d['online'])) {
            $d['online'] ? $q->whereIn('id', $onlineIds) : $q->whereNotIn('id', $onlineIds);
        }if (isset($d['region'])) {
            $regions = ['East Africa' => ['Uganda', 'Kenya', 'Rwanda'], 'West Africa' => ['Ghana', 'Nigeria'], 'Southern Africa' => ['South Africa'], 'North Africa' => ['Egypt'], 'Central Africa' => ['Cameroon'], 'International' => ['United Kingdom', 'Canada']];
            $q->whereIn('country', $regions[$d['region']] ?? []);
        }if (isset($d['language'])) {
            $q->whereJsonContains('languages', $d['language']);
        }if (isset($d['interest'])) {
            $q->whereJsonContains('interests', $d['interest']);
        }if ($r->user() && ($d['favorite'] ?? false)) {
            $q->whereIn('id', DB::table('favorites')->select('favorite_id')->where('user_id', $r->user()->id));
        }$page = $q->paginate($d['per_page'] ?? 20);

        return response()->json(['data' => $page->getCollection()->map(function ($u) use ($onlineSet) {
            $profile = $u->publicProfile();
            $profile['online'] = isset($onlineSet[$u->id]);

            return $profile;
        }), 'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total(), 'last_page' => $page->lastPage()]]);
    }
}
