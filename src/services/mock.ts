import { text as uiText } from "@/config/brand";
import {
  profiles,
  myProfile,
  conversations,
  friendIds,
  friendRequests,
  notifications,
  reports,
  getCountry,
  defaultPreferences,
} from "@/lib/data";
import type { DiscoveryFilters, Profile } from "@/lib/types";
import type {
  AuthService,
  ProfileService,
  DiscoveryService,
  MatchmakingService,
  MessagingService,
  FriendsService,
  NotificationService,
  SafetyService,
  AdminService,
  AccountService,
  AppealService,
  CallService,
} from "./interfaces";
export const delay = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const id = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
export function filterProfiles(
  filters: DiscoveryFilters = {},
  data: Profile[] = profiles,
) {
  return data.filter(
    (p) =>
      (!filters.query ||
        `${p.name} ${p.username} ${p.bio}`
          .toLowerCase()
          .includes(filters.query.toLowerCase())) &&
      (!filters.country || p.country === filters.country) &&
      (!filters.region || getCountry(p.country)?.region === filters.region) &&
      (!filters.language || p.languages.includes(filters.language)) &&
      (!filters.interest || p.interests.includes(filters.interest)) &&
      (!filters.online || p.online),
  );
}
export const authService: AuthService = {
  async login(identity, password) {
    await delay(700);
    if (identity.toLowerCase() === "error@demo.test")
      throw new Error(
        uiText("mock.simulated_signin_error_try_a_different_fictional"),
      );
    if (!password) throw new Error(uiText("mock.enter_a_demo_password"));
    return { mode: "demo" };
  },
  async register() {
    await delay(600);
    return { mode: "demo" };
  },
  async current() {
    return null;
  },
  async completeOnboarding(input) {
    await delay(250);
    return { ...myProfile, name: input.name, username: input.username, age: 18, country: input.country, languages: input.languages, interests: input.interests, bio: input.bio };
  },
  async recover() {
    await delay(600);
  },
  async logout() {
    await delay(100);
  },
};
export const profileService: ProfileService = {
  async get() {
    await delay();
    return structuredClone(myProfile);
  },
  async update(profile) {
    await delay();
    return { ...profile };
  },
  async getPreferences() {
    return structuredClone(defaultPreferences);
  },
  async updatePreferences(preferences) {
    return structuredClone(preferences);
  },
};
export const discoveryService: DiscoveryService = {
  async list(filters) {
    await delay(300);
    return filterProfiles(filters);
  },
  async favorites() {
    return [];
  },
  async favorite() {
    await delay(80);
  },
};
export const matchmakingService: MatchmakingService = {
  async find(filters, outcome = "normal", excludeIds = []) {
    await delay(2200);
    if (outcome === "error")
      throw new Error(
        uiText("mock.the_demo_connection_was_interrupted_no_camera"),
      );
    if (outcome === "empty") return null;
    const results = filterProfiles({ ...filters, online: true }).filter(
      (p) => !excludeIds.includes(p.id),
    );
    const person = results[Math.floor(Math.random() * results.length)];
    return person ? { id: id(), profile: person, status: "pending" as const } : null;
  },
  async accept() { return "accepted"; },
  async status() { return "accepted"; },
  async skip() { await delay(80); },
};
export const callService: CallService = {
  async create() { return { id: id(), status: "ringing" }; },
  async setStatus() { await delay(80); },
  async signal() { await delay(80); },
  async iceServers() { return [{ urls: "stun:stun.l.google.com:19302" }]; },
};
export const messagingService: MessagingService = {
  async list() {
    return structuredClone(conversations);
  },
  async create(userId) {
    return { id: `c-${userId}`, userId, unread: 0, messages: [] };
  },
  async read() {
    await delay(50);
  },
  async send(_conversationId, text) {
    await delay(120);
    return {
      id: id(),
      text,
      from: "me",
      time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  },
};
export const friendsService: FriendsService = {
  async list() {
    return [...friendIds];
  },
  async requests() {
    return structuredClone(friendRequests);
  },
  async request(userId) {
    await delay(150);
    return { id: id(), userId, direction: "outgoing" };
  },
  async respond() {
    await delay(100);
  },
  async remove() {
    await delay(100);
  },
};
export const notificationService: NotificationService = {
  async list() {
    return structuredClone(notifications);
  },
  async markRead() {
    await delay(80);
  },
};
export const safetyService: SafetyService = {
  async blocks() {
    return [];
  },
  async report(input) {
    await delay(300);
    return {
      ...input,
      id: id(),
      date: new Date().toISOString().slice(0, 10),
      status: "pending",
    };
  },
  async block() {
    await delay(80);
  },
  async unblock() {
    await delay(80);
  },
};
export const accountService: AccountService = {
  async exportData() { await delay(150); },
  async deleteAccount() { await delay(150); },
};
export const appealService: AppealService = {
  async list() { return []; },
  async create(reason) {
    await delay(250);
    return { id: id(), reason, status: "pending", createdAt: new Date().toISOString() };
  },
};
export const adminService: AdminService = {
  async reports() {
    return structuredClone(reports);
  },
  async users() {
    return profiles.map((item) => ({ id: item.id, name: item.name, username: item.username, country: item.country, status: "active" as const }));
  },
  async setStatus() {
    await delay(150);
  },
  async resolve() {
    await delay(100);
  },
};
