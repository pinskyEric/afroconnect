"use client";
import { text as uiText } from "@/config/brand";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as data from "@/lib/data";
import type {
  Profile,
  Preferences,
  Conversation,
  FriendRequest,
  Notification,
  Report,
  AdminUser,
} from "@/lib/types";
import {
  friendsService,
  messagingService,
  notificationService,
  safetyService,
  profileService,
  adminService,
} from "@/services";
import { CheckCircle2, X, Info } from "lucide-react";
function useStore() {
  const [profile, setProfile] = useState<Profile>(data.myProfile);
  const [preferences, setPreferences] = useState<Preferences>(
    data.defaultPreferences,
  );
  const [ready, setReady] = useState(false);
  const [friends, setFriends] = useState<string[]>(data.friendIds);
  const [requests, setRequests] = useState<FriendRequest[]>(
    data.friendRequests,
  );
  const [conversations, setConversations] = useState<Conversation[]>(
    data.conversations,
  );
  const [notifications, setNotifications] = useState<Notification[]>(
    data.notifications,
  );
  const [reports, setReports] = useState<Report[]>(data.reports);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AdminUser["status"]>>(
    {},
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("africonnect-ui");
      if (stored) {
        const parsed = JSON.parse(stored);
        const safe: Partial<Preferences> = {};
        for (const key of Object.keys(
          data.defaultPreferences,
        ) as (keyof Preferences)[]) {
          if (typeof parsed[key] === typeof data.defaultPreferences[key])
            Object.assign(safe, { [key]: parsed[key] });
        }
        setPreferences({ ...data.defaultPreferences, ...safe });
      }
    } catch {
      /* Local storage is optional. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("africonnect-ui", JSON.stringify(preferences));
      } catch {
        /* Continue in memory. */
      }
    document.documentElement.dataset.motion = preferences.reducedMotion
      ? "reduced"
      : "normal";
    document.documentElement.dataset.contrast = preferences.highContrast
      ? "high"
      : "normal";
  }, [preferences, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  function notify(message: string, type: "success" | "info" = "success") {
    setToast({ message, type });
  }
  async function requestFriend(userId: string) {
    if (blocked.includes(userId)) {
      notify(uiText("provider.unblock_this_person_before_connecting"), "info");
      return;
    }
    if (friends.includes(userId) || requests.some((r) => r.userId === userId)) {
      notify(
        uiText("provider.youre_already_connected_or_have_a_pending"),
        "info",
      );
      return;
    }
    const request = await friendsService.request(userId);
    setRequests((prev) =>
      prev.some((r) => r.userId === userId) ? prev : [...prev, request],
    );
    notify(uiText("provider.friend_request_added_to_the_local_demo"));
  }
  async function respondRequest(requestId: string, accept: boolean) {
    const req = requests.find((r) => r.id === requestId);
    await friendsService.respond(requestId, accept);
    if (req && accept)
      setFriends((prev) => [...new Set([...prev, req.userId])]);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    notify(
      accept
        ? uiText("provider.connection_accepted_say_hello")
        : uiText("provider.request_removed"),
    );
  }
  async function removeFriend(userId: string) {
    await friendsService.remove(userId);
    setFriends((prev) => prev.filter((id) => id !== userId));
    notify(uiText("provider.friend_removed_from_the_demo"));
  }
  function toggleSave(userId: string) {
    setSaved((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }
  function ensureConversation(userId: string) {
    const existing = conversations.find((c) => c.userId === userId);
    if (existing) return existing.id;
    const id = `c-${userId}`;
    setConversations((prev) =>
      prev.some((c) => c.userId === userId)
        ? prev
        : [...prev, { id, userId, unread: 0, messages: [] }],
    );
    return id;
  }
  async function sendMessage(conversationId: string, text: string) {
    const convo = conversations.find((c) => c.id === conversationId);
    if (convo && blocked.includes(convo.userId)) {
      notify(uiText("provider.this_person_is_blocked"), "info");
      return;
    }
    const msg = await messagingService.send(conversationId, text);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c,
      ),
    );
  }
  function readConversation(id: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  }
  async function markRead(id?: string) {
    await notificationService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (!id || n.id === id ? { ...n, read: true } : n)),
    );
  }
  async function submitReport(
    userId: string,
    category: string,
    details: string,
  ) {
    const report = await safetyService.report({ userId, category, details });
    setReports((prev) => [report, ...prev]);
    notify(
      uiText("provider.report_saved_locally_no_moderation_team_was"),
      "info",
    );
  }
  async function blockUser(userId: string) {
    await safetyService.block(userId);
    setBlocked((prev) => [...new Set([...prev, userId])]);
    setFriends((prev) => prev.filter((id) => id !== userId));
    setRequests((prev) => prev.filter((r) => r.userId !== userId));
    notify(uiText("provider.user_blocked_in_this_demo"));
  }
  async function unblockUser(userId: string) {
    await safetyService.unblock(userId);
    setBlocked((prev) => prev.filter((id) => id !== userId));
    notify(uiText("provider.user_unblocked"));
  }
  async function saveProfile(next: Profile) {
    setProfile(await profileService.update(next));
    notify(uiText("provider.profile_updated_for_this_demo_session"));
  }
  async function moderate(id: string, status: AdminUser["status"]) {
    await adminService.setStatus(id, status);
    setStatuses((prev) => ({ ...prev, [id]: status }));
    notify(
      `Mock account marked ${status}. No real account was affected.`,
      "info",
    );
  }
  async function resolveReport(id: string) {
    await adminService.resolve(id);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r)),
    );
    notify(uiText("provider.demo_report_marked_resolved"));
  }
  return {
    profile,
    preferences,
    setPreferences,
    friends,
    requests,
    conversations,
    notifications,
    reports,
    blocked,
    saved,
    statuses,
    toast,
    setToast,
    notify,
    requestFriend,
    respondRequest,
    removeFriend,
    toggleSave,
    ensureConversation,
    sendMessage,
    readConversation,
    markRead,
    submitReport,
    blockUser,
    unblockUser,
    saveProfile,
    moderate,
    resolveReport,
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return (
    <Context.Provider value={store}>
      {children}
      {store.toast && (
        <div className={`toast ${store.toast.type}`} role="status">
          {store.toast.type === "success" ? (
            <CheckCircle2 size={21} />
          ) : (
            <Info size={21} />
          )}
          <span>{store.toast.message}</span>
          <button
            aria-label={uiText("provider.dismiss_notification")}
            onClick={() => store.setToast(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error(uiText("provider.appprovider_missing"));
  return context;
}
