import type { Appeal, Conversation, DiscoveryFilters, FriendRequest, MatchResult, Message, Notification, Preferences, Profile, Report } from "@/lib/types";
import type { AccountService, AdminService, AppealService, AuthService, CallService, DiscoveryService, FriendsService, MatchmakingService, MessagingService, NotificationService, ProfileService, SafetyService } from "./interfaces";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const API_ROOT = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/api\/v1$/, "") : "";
let csrfReady = false;
let currentUserId = "";

async function csrfCookie(): Promise<void> {
  if (csrfReady || typeof document === "undefined") return;
  const response = await fetch(`${API_ROOT}/sanctum/csrf-cookie`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not start a secure session. Check the API URL and CORS configuration.");
  csrfReady = true;
}
function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) : undefined;
}
async function request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    await csrfCookie();
    const token = csrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, method, headers, credentials: "include" });
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const payload = body as { message?: string; errors?: Record<string, string[]> };
    const error = new Error(payload?.message || `Request failed (${response.status}).`) as Error & { status?: number; errors?: Record<string, string[]> };
    error.status = response.status;
    error.errors = payload?.errors;
    throw error;
  }
  return body as T;
}
const asList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as { data?: unknown };
    if (Array.isArray(record.data)) return record.data as T[];
  }
  return [];
};
const timeLabel = (value: string | null | undefined) => value ? new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
type JsonRecord = Record<string, unknown>;
function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}
function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function profile(raw: unknown): Profile {
  const value = asRecord(raw);
  const age = value.age;
  return {
    id: stringValue(value.id), name: stringValue(value.name, "Member"), username: stringValue(value.username, "member"),
    age: age == null ? null : Number(age), country: stringValue(value.country),
    languages: stringArray(value.languages), interests: stringArray(value.interests), bio: stringValue(value.bio),
    photo: stringValue(value.photo || value.photo_url, "/images/profile-placeholder.svg"), online: Boolean(value.online), friends: Number(value.friends || 0),
  };
}
function message(raw: unknown, me = currentUserId): Message {
  const value = asRecord(raw);
  const sender = stringValue(value.sender_id);
  const from = stringValue(value.from, sender === me ? "me" : "them");
  return { id: stringValue(value.id), text: stringValue(value.text), from: from === "me" ? "me" : "them", time: timeLabel(stringValue(value.time || value.created_at)) };
}
function conversation(raw: unknown): Conversation & { channelGeneration?: number } {
  const value = asRecord(raw);
  const messages = Array.isArray(value.messages) ? value.messages.map((item) => message(item)) : [];
  return { id: stringValue(value.id), userId: stringValue(value.userId || value.user_id), unread: Number(value.unread || 0), messages, channelGeneration: Number(value.channel_generation || 1) };
}
function notification(raw: unknown): Notification {
  const value = asRecord(raw);
  const kind = stringValue(value.kind);
  const allowed = ["request", "accepted", "message", "match", "announcement", "safety"];
  return { id: stringValue(value.id), kind: allowed.includes(kind) ? kind as Notification["kind"] : "announcement", title: stringValue(value.title), description: stringValue(value.description), time: timeLabel(stringValue(value.time || value.created_at)), read: Boolean(value.read), href: stringValue(value.href, "/app") };
}
function friendRequest(raw: unknown): FriendRequest {
  const value = asRecord(raw);
  return { id: stringValue(value.id), userId: stringValue(value.userId || value.user_id), direction: value.direction === "outgoing" ? "outgoing" : "incoming" };
}
function report(raw: unknown): Report {
  const value = asRecord(raw);
  return { id: stringValue(value.id), userId: stringValue(value.userId || value.user_id), category: stringValue(value.category), details: stringValue(value.details), status: value.status === "pending" ? "pending" : "resolved", date: stringValue(value.date || value.created_at).slice(0, 10) };
}
function appeal(raw: unknown): Appeal {
  const value = asRecord(raw);
  const status = ["upheld", "reinstated", "dismissed"].includes(stringValue(value.status)) ? value.status as Appeal["status"] : "pending";
  return { id: stringValue(value.id), reason: stringValue(value.reason), status, createdAt: stringValue(value.created_at), decisionNotes: value.decision_notes == null ? null : stringValue(value.decision_notes) };
}
async function uploadPhoto(photo: string): Promise<string | undefined> {
  if (!photo.startsWith("data:")) return undefined;
  const blob = await (await fetch(photo)).blob();
  const form = new FormData();
  form.append("photo", blob, "profile-upload.webp");
  const response = await request<{ data: { photo_url: string } }>("/me/profile/photo", { method: "POST", body: form });
  return response.data.photo_url;
}

export const authService: AuthService = {
  async login(identity, password) {
    const response = await request<{ data: { user: { id: string; status: string }; token?: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ identity, password }) });
    currentUserId = response.data.user.id;
    return { mode: "authenticated", status: response.data.user.status };
  },
  async register(identity, password) {
    const response = await request<{ data: { user: { id: string; status: string }; token?: string } }>("/auth/register", { method: "POST", body: JSON.stringify({ identity, password, password_confirmation: password, terms_accepted: true }) });
    currentUserId = response.data.user.id;
    return { mode: "authenticated", status: response.data.user.status };
  },
  async current() {
    try {
      const response = await request<{ data: { id: string; status: string; profile: unknown } }>("/me");
      currentUserId = response.data.id;
      return { status: response.data.status, profile: profile(response.data.profile) };
    } catch (error) {
      if ((error as { status?: number }).status === 401) return null;
      throw error;
    }
  },
  async completeOnboarding(input) {
    const response = await request<{ data: unknown }>("/me/onboarding/complete", { method: "POST", body: JSON.stringify({ birth_date: input.birthDate, name: input.name, username: input.username, country: input.country, languages: input.languages, interests: input.interests, bio: input.bio }) });
    let updated = profile(response.data);
    try {
      const photo = await uploadPhoto(input.photo);
      if (photo) updated = { ...updated, photo };
    } catch {
      // Profile completion succeeds independently; photo can be uploaded later.
    }
    return updated;
  },
  async recover(identity) {
    await request("/auth/password/forgot", { method: "POST", body: JSON.stringify({ identity }) });
  },
  async logout() {
    await request("/auth/logout", { method: "POST", body: "{}" });
    currentUserId = "";
    csrfReady = false;
  },
};

export const profileService: ProfileService = {
  async get() {
    const response = await request<{ data: { profile: unknown } }>("/me");
    return profile(response.data.profile);
  },
  async update(next) {
    const photo = await uploadPhoto(next.photo);
    const response = await request<{ data: unknown }>("/me/profile", { method: "PATCH", body: JSON.stringify({ name: next.name, username: next.username, country: next.country, languages: next.languages, interests: next.interests, bio: next.bio }) });
    return { ...profile(response.data), photo: photo || next.photo };
  },
  async getPreferences() {
    const response = await request<{ data: Preferences }>("/me/preferences");
    return { ...response.data };
  },
  async updatePreferences(preferences) {
    const response = await request<{ data: Preferences }>("/me/preferences", { method: "PATCH", body: JSON.stringify(preferences) });
    return { ...response.data };
  },
};

export const discoveryService: DiscoveryService = {
  async list(filters: DiscoveryFilters = {}) {
    const query = new URLSearchParams();
    if (filters.query) query.set("search", filters.query);
    if (filters.country) query.set("country", filters.country);
    if (filters.region) query.set("region", filters.region);
    if (filters.language) query.set("language", filters.language);
    if (filters.interest) query.set("interest", filters.interest);
    if (filters.online !== undefined) query.set("online", String(filters.online));
    const response = await request<{ data: unknown[] }>(`/profiles${query.toString() ? `?${query.toString()}` : ""}`);
    return response.data.map(profile);
  },
  async favorites() {
    const response = await request<{ data: unknown[] }>("/me/favorites");
    return response.data.map(profile);
  },
  async favorite(userId, saved) {
    await request(`/me/favorites/${encodeURIComponent(userId)}`, { method: saved ? "PUT" : "DELETE", body: saved ? "{}" : undefined });
  },
};

export const matchmakingService: MatchmakingService = {
  async find(filters, _outcome, excludeIds = [], mode = "video", signal) {
    await request("/matchmaking/preferences", { method: "PUT", body: JSON.stringify({ mode, countries: filters.country ? [filters.country] : [], languages: filters.language ? [filters.language] : [], interests: filters.interest ? [filters.interest] : [] }) });
    const started = await request<{ data: { queue_id: string; status: string; match?: unknown } }>("/matchmaking/queue", { method: "POST", body: "{}", signal });
    const entry = started.data.queue_id;
    const deadline = Date.now() + 45_000;
    try {
      let match: JsonRecord | null = started.data.match ? asRecord(started.data.match) : null;
      while (!match && Date.now() < deadline) {
        if (signal?.aborted) throw new DOMException("Match search cancelled", "AbortError");
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 1400);
          signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Match search cancelled", "AbortError")); }, { once: true });
        });
        const result = await request<{ data: { status: string; match?: unknown } }>(`/matchmaking/queue/${entry}`, { signal });
        match = result.data.match ? asRecord(result.data.match) : null;
        if (result.data.status === "cancelled" || result.data.status === "expired") return null;
      }
      if (!match || !match.user) return null;
      const target = profile(match.user);
      if (excludeIds.includes(target.id)) {
        await this.skip(String(match.id));
        return null;
      }
      return { id: String(match.id), profile: target, status: match.status || "pending" } as MatchResult;
    } finally {
      await request(`/matchmaking/queue/${entry}`, { method: "DELETE" }).catch(() => undefined);
    }
  },
  async accept(matchId) {
    const result = await request<{ data: { status: string } }>(`/matches/${encodeURIComponent(matchId)}/accept`, { method: "POST", body: "{}" });
    return result.data.status;
  },
  async status(matchId) {
    const result = await request<{ data: { status: string } }>(`/matches/${encodeURIComponent(matchId)}`);
    return result.data.status;
  },
  async skip(matchId) {
    await request(`/matches/${encodeURIComponent(matchId)}/skip`, { method: "POST", body: "{}" });
  },
};

export const callService: CallService = {
  async create(matchId) {
    const response = await request<{ data: { id: string; status: string } }>("/calls", { method: "POST", body: JSON.stringify({ match_id: matchId }) });
    return response.data;
  },
  async setStatus(callId, action) {
    await request(`/calls/${encodeURIComponent(callId)}/${action}`, { method: "POST", body: "{}" });
  },
  async signal(callId, type, payload) {
    await request(`/calls/${encodeURIComponent(callId)}/signals`, { method: "POST", body: JSON.stringify({ type, payload }) });
  },
  async iceServers(callId) {
    const response = await request<{ data: { iceServers: { urls: string | string[]; username?: string; credential?: string }[] } }>(`/calls/${encodeURIComponent(callId)}/ice-servers`);
    return response.data.iceServers;
  },
};

export const messagingService: MessagingService = {
  async list() {
    const response = await request<{ data: unknown[] }>("/conversations");
    return response.data.map(conversation);
  },
  async create(userId) {
    const response = await request<{ data: unknown }>("/conversations", { method: "POST", body: JSON.stringify({ user_id: userId }) });
    return conversation(response.data);
  },
  async send(conversationId, text) {
    const response = await request<{ data: unknown }>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", body: JSON.stringify({ text, client_message_id: crypto.randomUUID() }) });
    return message(response.data);
  },
  async read(conversationId, throughMessageId) {
    await request(`/conversations/${encodeURIComponent(conversationId)}/read`, { method: "POST", body: JSON.stringify(throughMessageId ? { through_message_id: throughMessageId } : {}) });
  },
};

export const friendsService: FriendsService = {
  async list() {
    const response = await request<{ data: unknown[] }>("/friends");
    return response.data.map((item) => stringValue(asRecord(item).id));
  },
  async requests() {
    const [incoming, outgoing] = await Promise.all([
      request<{ data: unknown[] }>("/friend-requests?direction=incoming"),
      request<{ data: unknown[] }>("/friend-requests?direction=outgoing"),
    ]);
    return [...incoming.data, ...outgoing.data].map(friendRequest);
  },
  async request(userId) {
    const response = await request<{ data: unknown }>("/friend-requests", { method: "POST", body: JSON.stringify({ user_id: userId }) });
    return friendRequest(response.data);
  },
  async respond(requestId, accept) {
    await request(`/friend-requests/${encodeURIComponent(requestId)}/${accept ? "accept" : "decline"}`, { method: "POST", body: "{}" });
  },
  async remove(userId) {
    await request(`/friends/${encodeURIComponent(userId)}`, { method: "DELETE" });
  },
};

export const notificationService: NotificationService = {
  async list() {
    const response = await request<{ data: unknown[] }>("/notifications");
    return response.data.map(notification);
  },
  async markRead(id) {
    if (id) await request(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST", body: "{}" });
    else await request("/notifications/read-all", { method: "POST", body: "{}" });
  },
};

export const safetyService: SafetyService = {
  async blocks() {
    const response = await request<{ data: unknown[] }>("/blocks");
    return response.data.map((item) => stringValue(asRecord(item).blocked_id));
  },
  async report(input) {
    const response = await request<{ data: unknown }>("/reports", { method: "POST", body: JSON.stringify({ user_id: input.userId, category: input.category, details: input.details }) });
    return report(response.data);
  },
  async block(userId) {
    await request("/blocks", { method: "POST", body: JSON.stringify({ user_id: userId }) });
  },
  async unblock(userId) {
    await request(`/blocks/${encodeURIComponent(userId)}`, { method: "DELETE" });
  },
};

export const accountService: AccountService = {
  async exportData() {
    const response = await fetch(`${API_BASE}/me/export`, { credentials: "include", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Account export failed (${response.status}).`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "africonnect-account-export.json";
    link.click();
    URL.revokeObjectURL(url);
  },
  async deleteAccount(password) {
    await request("/me/account", { method: "DELETE", body: JSON.stringify({ password, confirmation: "DELETE" }) });
    currentUserId = "";
  },
};

export const appealService: AppealService = {
  async list() {
    const response = await request<{ data: unknown }>("/me/appeals");
    return asList<unknown>(response.data).map(appeal);
  },
  async create(reason) {
    const response = await request<{ data: unknown }>("/me/appeals", { method: "POST", body: JSON.stringify({ reason }) });
    return appeal(response.data);
  },
};

export const adminService: AdminService = {
  async reports() {
    const response = await request<{ data: unknown }>("/admin/reports");
    return asList<unknown>(response.data).map(report);
  },
  async users(search, status) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (status && status !== "all") query.set("status", status);
    const response = await request<{ data: unknown }>(`/admin/users${query.toString() ? `?${query}` : ""}`);
    return asList<unknown>(response.data).map((raw) => {
      const value = asRecord(raw);
      const accountStatus = ["suspended", "banned"].includes(stringValue(value.status)) ? value.status as "suspended" | "banned" : "active";
      return { id: stringValue(value.id), name: stringValue(value.name, "Member"), username: stringValue(value.username), country: stringValue(value.country), status: accountStatus };
    });
  },
  async setStatus(id, status, reason = "") {
    await request(`/admin/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) });
  },
  async resolve(id, notes = "") {
    await request(`/admin/reports/${encodeURIComponent(id)}/decision`, { method: "POST", body: JSON.stringify({ decision: "resolved", notes }) });
  },
};
