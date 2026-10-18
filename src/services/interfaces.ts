import type {
  Profile,
  DiscoveryFilters,
  Conversation,
  Message,
  FriendRequest,
  Notification,
  Report,
  AdminUser,
  Preferences,
  Appeal,
  MatchResult,
} from "@/lib/types";
export interface AuthService {
  login(identity: string, password: string): Promise<{ mode: "demo" | "authenticated"; status?: string }>;
  register(identity: string, password: string): Promise<{ mode: "demo" | "authenticated"; status?: string }>;
  current(): Promise<{ status: string; profile: Profile } | null>;
  completeOnboarding(input: { birthDate: string; name: string; username: string; country: string; languages: string[]; interests: string[]; bio: string; photo: string }): Promise<Profile>;
  recover(identity: string): Promise<void>;
  logout(): Promise<void>;
}
export interface ProfileService {
  get(): Promise<Profile>;
  update(profile: Profile): Promise<Profile>;
  getPreferences(): Promise<Preferences>;
  updatePreferences(preferences: Preferences): Promise<Preferences>;
}
export interface DiscoveryService {
  list(filters?: DiscoveryFilters): Promise<Profile[]>;
  favorites(): Promise<Profile[]>;
  favorite(userId: string, saved: boolean): Promise<void>;
}
export interface MatchmakingService {
  find(
    filters: DiscoveryFilters,
    outcome?: "normal" | "empty" | "error",
    excludeIds?: string[],
    mode?: "video" | "text",
    signal?: AbortSignal,
  ): Promise<MatchResult | null>;
  accept(matchId: string): Promise<string>;
  status(matchId: string): Promise<string>;
  skip(matchId: string): Promise<void>;
}
export interface CallService {
  create(matchId: string): Promise<{ id: string; status: string }>;
  setStatus(callId: string, action: "accept" | "end"): Promise<void>;
  signal(callId: string, type: "offer" | "answer" | "ice-candidate", payload: Record<string, unknown>): Promise<void>;
  iceServers(callId: string): Promise<{ urls: string | string[]; username?: string; credential?: string }[]>;
}
export interface MessagingService {
  list(): Promise<Conversation[]>;
  create(userId: string): Promise<Conversation>;
  send(conversationId: string, text: string): Promise<Message>;
  read(conversationId: string, throughMessageId?: string): Promise<void>;
}
export interface FriendsService {
  list(): Promise<string[]>;
  requests(): Promise<FriendRequest[]>;
  request(userId: string): Promise<FriendRequest>;
  respond(requestId: string, accept: boolean): Promise<void>;
  remove(userId: string): Promise<void>;
}
export interface NotificationService {
  list(): Promise<Notification[]>;
  markRead(id?: string): Promise<void>;
}
export interface SafetyService {
  report(input: Omit<Report, "id" | "date" | "status">): Promise<Report>;
  blocks(): Promise<string[]>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
}
export interface AccountService {
  exportData(): Promise<void>;
  deleteAccount(password: string): Promise<void>;
}
export interface AppealService {
  list(): Promise<Appeal[]>;
  create(reason: string): Promise<Appeal>;
}
export interface AdminService {
  reports(): Promise<Report[]>;
  users(search?: string, status?: string): Promise<AdminUser[]>;
  setStatus(id: string, status: AdminUser["status"], reason?: string): Promise<void>;
  resolve(id: string, notes?: string): Promise<void>;
}
