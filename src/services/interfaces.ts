import type {
  Profile,
  DiscoveryFilters,
  Conversation,
  Message,
  FriendRequest,
  Notification,
  Report,
  AdminUser,
} from "@/lib/types";
export interface AuthService {
  login(
    identity: string,
    password: string,
  ): Promise<{ mode: "demo" | "authenticated" }>;
  register(
    identity: string,
    password: string,
  ): Promise<{ mode: "demo" | "authenticated" }>;
  recover(identity: string): Promise<void>;
  logout(): Promise<void>;
}
export interface ProfileService {
  get(): Promise<Profile>;
  update(profile: Profile): Promise<Profile>;
}
export interface DiscoveryService {
  list(filters?: DiscoveryFilters): Promise<Profile[]>;
}
export interface MatchmakingService {
  find(
    filters: DiscoveryFilters,
    outcome?: "normal" | "empty" | "error",
    excludeIds?: string[],
  ): Promise<Profile | null>;
}
export interface MessagingService {
  list(): Promise<Conversation[]>;
  send(conversationId: string, text: string): Promise<Message>;
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
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
}
export interface AdminService {
  reports(): Promise<Report[]>;
  setStatus(id: string, status: AdminUser["status"]): Promise<void>;
  resolve(id: string): Promise<void>;
}
