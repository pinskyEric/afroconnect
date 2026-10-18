"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import type { Conversation } from "@/lib/types";

declare global {
  interface Window { Pusher: typeof Pusher }
}

interface RealtimeHandlers {
  refreshInbox: () => void;
  refreshNotifications: () => void;
  refreshAll: () => void;
}
export interface RealtimeConnection {
  subscribeConversations: (conversations: Conversation[]) => void;
  disconnect: () => void;
}
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const API_ROOT = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/api\/v1$/, "") : "";

function csrf(): string {
  const cookie = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) : "";
}

export function connectRealtime(userId: string, handlers: RealtimeHandlers): RealtimeConnection {
  window.Pusher = Pusher;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || (API_ROOT ? new URL(API_ROOT).hostname : window.location.hostname);
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
  const secure = (process.env.NEXT_PUBLIC_REVERB_SCHEME || "http") === "https";
  const echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || "local-key",
    wsHost: host,
    wsPort: secure ? undefined : port,
    wssPort: secure ? port : undefined,
    forceTLS: secure,
    enabledTransports: ["ws", "wss"],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const body = new URLSearchParams({ socket_id: socketId, channel_name: channel.name });
        void fetch(`${API_ROOT}/sanctum/csrf-cookie`, { credentials: "include" })
          .then(() => fetch(`${API_ROOT}/broadcasting/auth`, {
            method: "POST",
            credentials: "include",
            headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "X-XSRF-TOKEN": csrf() },
            body,
          }))
          .then(async (response) => {
            if (!response.ok) throw new Error(`Realtime authorization failed (${response.status}).`);
            return response.json();
          })
          .then((data) => callback(null, data))
          .catch((error: Error) => callback(error, { auth: "" }));
      },
    }),
  });
  const userChannel = echo.private(`users.${userId}`);
  userChannel.listen(".notification.created", () => {
    handlers.refreshNotifications();
    handlers.refreshInbox();
  });
  userChannel.listen(".notification.read", handlers.refreshNotifications);
  userChannel.listen(".notification.read_all", handlers.refreshNotifications);
  userChannel.listen(".match.status", handlers.refreshNotifications);
  userChannel.listen(".conversation.channel_rotated", handlers.refreshAll);

  let subscribed: string[] = [];
  return {
    subscribeConversations(conversations) {
      for (const channel of subscribed) echo.leave(channel);
      subscribed = conversations.map((conversation) => `conversations.${conversation.id}.${conversation.channelGeneration || 1}`);
      for (const name of subscribed) {
        echo.private(name).listen(".message.sent", handlers.refreshInbox).listen(".message.read", handlers.refreshInbox);
      }
    },
    disconnect() {
      echo.disconnect();
      subscribed = [];
    },
  };
}
