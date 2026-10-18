export interface Country {
  name: string;
  flag: string;
  region: string;
  code: string;
}
export interface Profile {
  id: string;
  name: string;
  username: string;
  age: number | null;
  country: string;
  languages: string[];
  interests: string[];
  bio: string;
  photo: string;
  online: boolean;
  friends: number;
}
export interface DiscoveryFilters {
  query?: string;
  country?: string;
  region?: string;
  language?: string;
  interest?: string;
  online?: boolean;
}
export interface Message {
  id: string;
  text: string;
  from: "me" | "them";
  time: string;
}
export interface Conversation {
  id: string;
  userId: string;
  unread: number;
  messages: Message[];
  channelGeneration?: number;
}
export interface FriendRequest {
  id: string;
  userId: string;
  direction: "incoming" | "outgoing";
}
export type NotificationKind =
  "request" | "accepted" | "message" | "match" | "announcement" | "safety";
export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href: string;
}
export interface Report {
  id: string;
  userId: string;
  category: string;
  details: string;
  status: "pending" | "resolved";
  date: string;
}
export interface Preferences {
  online: boolean;
  notifications: boolean;
  sounds: boolean;
  video: boolean;
  dataSaver: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  requests: string;
  messages: string;
  language: string;
  country: string;
}
export interface Appeal {
  id: string;
  reason: string;
  status: "pending" | "upheld" | "reinstated" | "dismissed";
  createdAt: string;
  decisionNotes?: string | null;
}
export interface AdminUser {
  id: string;
  status: "active" | "suspended" | "banned";
  name?: string;
  username?: string;
  country?: string | null;
}
export interface MatchResult {
  id: string;
  profile: Profile;
  status: "pending" | "accepted" | "skipped";
}
export type MatchState =
  "idle" | "searching" | "found" | "call" | "empty" | "error";
