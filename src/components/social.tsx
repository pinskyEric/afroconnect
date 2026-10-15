"use client";
import { text as uiText } from "@/config/brand";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCheck,
  Flag,
  MessageCircle,
  Send,
  UserPlus,
  Users,
  X,
  Bell,
  ShieldCheck,
  Sparkles,
  Megaphone,
  Clock,
} from "lucide-react";
import { profiles, getCountry } from "@/lib/data";
import { copy } from "@/config/brand";
import type { Profile } from "@/lib/types";
import { useApp } from "./provider";
import {
  Avatar,
  Button,
  ButtonLink,
  EmptyState,
  Modal,
  PageHeader,
  SearchInput,
  Tag,
} from "./ui";
import { ProfileModal } from "./profile-card";
export function Messages() {
  const store = useApp();
  const params = useSearchParams();
  const userParam = params.get("user");
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (userParam && profiles.some((p) => p.id === userParam)) {
      const id = store.ensureConversation(userParam);
      setActive(id);
      store.readConversation(id);
    }
    // Opening a deep link should run once per recipient, not on each message update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userParam]);
  const convo = store.conversations.find((c) => c.id === active);
  const person = profiles.find((p) => p.id === convo?.userId);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [convo?.messages.length, active]);
  const visible = store.conversations.filter((c) =>
    profiles
      .find((p) => p.id === c.userId)
      ?.name.toLowerCase()
      .includes(query.toLowerCase()),
  );
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    await store.sendMessage(active, draft.trim());
    setDraft("");
    setSending(false);
  }
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={uiText("social.your_conversations")}
        {...copy.pages.messages}
      />
      <div className={`messaging-layout ${active ? "has-active" : ""}`}>
        <aside className="conversation-sidebar">
          <div className="conversation-list-head">
            <h2>
              {uiText("social.messages")}
              <span>{store.conversations.length}</span>
            </h2>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={uiText("social.search_conversations")}
            />
          </div>
          <div className="conversation-list">
            {visible.map((c) => {
              const p = profiles.find((p) => p.id === c.userId)!;
              const last = c.messages.at(-1);
              return (
                <button
                  className={`conversation-item ${active === c.id ? "active" : ""}`}
                  key={c.id}
                  onClick={() => {
                    setActive(c.id);
                    setDraft("");
                    store.readConversation(c.id);
                  }}
                >
                  <Avatar profile={p} size={46} />
                  <span>
                    <strong>
                      {p.name}
                      <small>{last?.time || "New"}</small>
                    </strong>
                    <span>
                      {last?.text || uiText("social.be_the_first_to_say_hello")}
                    </span>
                  </span>
                  {c.unread > 0 && <b>{c.unread}</b>}
                </button>
              );
            })}
            {!visible.length && (
              <EmptyState
                title={
                  query
                    ? uiText("social.no_conversations_found")
                    : uiText("social.your_first_hello_is_waiting")
                }
                description={
                  query
                    ? uiText("social.try_another_name")
                    : uiText("social.meet_someone_new_to_start_a_conversation")
                }
              />
            )}
          </div>
          <div className="messages-private">
            <ShieldCheck size={15} />
            {uiText("social.only_simulated_messages_nothing_is_sent")}
          </div>
        </aside>
        <section className="active-conversation">
          {person && convo ? (
            <>
              <header>
                <button
                  className="message-back icon-btn"
                  aria-label={uiText("social.back_to_conversations")}
                  onClick={() => setActive(null)}
                >
                  <ArrowLeft size={20} />
                </button>
                <Avatar profile={person} size={42} />
                <div>
                  <h3>{person.name}</h3>
                  <span className="small muted">
                    {getCountry(person.country)?.flag} {person.country} ·{" "}
                    {person.online
                      ? uiText("social.online_in_demo")
                      : "Offline"}
                  </span>
                </div>
                <Link
                  href={`/app/safety?report=${person.id}`}
                  aria-label={`Report ${person.name}`}
                  className="icon-btn"
                >
                  <Flag size={18} />
                </Link>
              </header>
              <div className="chat-messages">
                <div className="chat-start">
                  <span className="tag">
                    {uiText("social.today_demo_conversation")}
                  </span>
                  <p>
                    {uiText(
                      "social.you_connected_through_a_shared_curiosity_start",
                    )}
                  </p>
                </div>
                {convo.messages.length ? (
                  convo.messages.map((m) => (
                    <div key={m.id} className={`message-row ${m.from}`}>
                      <div className="message-bubble">
                        <p>{m.text}</p>
                        <span>
                          {m.time}
                          {m.from === "me" && <Check size={13} />}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title={`Say hello to ${person.name}.`}
                    description={uiText(
                      "social.ask_about_a_shared_interest_a_favorite",
                    )}
                  />
                )}
                <div ref={endRef} />
              </div>
              {store.blocked.includes(person.id) ? (
                <div className="auth-demo-note">
                  {uiText("social.you_blocked_this_person")}
                  <Link href="/app/safety">
                    {uiText("social.manage_blocked_users")}
                  </Link>
                </div>
              ) : (
                <form className="message-composer" onSubmit={send}>
                  <input
                    aria-label={uiText("social.message")}
                    placeholder={`Say something to ${person.name}…`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={2000}
                  />
                  <Button
                    type="submit"
                    loading={sending}
                    disabled={!draft.trim()}
                    aria-label={uiText("social.send_message")}
                  >
                    <Send size={19} />
                  </Button>
                </form>
              )}
              <p className="message-disclaimer">
                {uiText("social.local_demo_only_messages_disappear_when_you")}
              </p>
            </>
          ) : (
            <div className="no-conversation">
              <div className="conversation-art">
                <MessageCircle size={56} strokeWidth={1} />
                <Sparkles size={24} />
              </div>
              <h2>{uiText("social.a_hello_worth_coming_back_to")}</h2>
              <p>
                {uiText("social.pick_a_conversation_on_the_left_or")}
                <br />
                {uiText("social.your_world_is_just_one_message_away")}
              </p>
              <ButtonLink href="/app/discover" variant="secondary">
                {uiText("social.discover_people")}
                <ArrowUpRight size={17} />
              </ButtonLink>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
export function Friends() {
  const store = useApp();
  const [tab, setTab] = useState<"friends" | "incoming" | "outgoing">(
    "friends",
  );
  const [query, setQuery] = useState("");
  const [view, setView] = useState<Profile | null>(null);
  const [remove, setRemove] = useState<Profile | null>(null);
  const ids =
    tab === "friends"
      ? store.friends
      : store.requests.filter((r) => r.direction === tab).map((r) => r.userId);
  const people = profiles.filter(
    (p) =>
      ids.includes(p.id) && p.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={uiText("social.your_community")}
        {...copy.pages.friends}
        action={
          <ButtonLink href="/app/discover">
            <UserPlus size={17} />
            {uiText("social.find_new_friends")}
          </ButtonLink>
        }
      />
      <div className="tabs">
        {(["friends", "incoming", "outgoing"] as const).map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t === "friends"
              ? uiText("social.your_friends")
              : t === "incoming"
                ? uiText("social.incoming_requests")
                : uiText("social.sent_requests")}
            <span>
              {t === "friends"
                ? store.friends.length
                : store.requests.filter((r) => r.direction === t).length}
            </span>
          </button>
        ))}
      </div>
      <div className="list-toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={uiText("social.search_your_connections")}
        />
        <span className="muted small">
          {people.length} {tab === "friends" ? "friends" : "requests"}
        </span>
      </div>
      {people.length ? (
        <div className="friend-grid">
          {people.map((p) => (
            <article className="friend-card panel" key={p.id}>
              <div className="friend-head">
                <Avatar profile={p} size={66} />
                <div>
                  <button className="name-link" onClick={() => setView(p)}>
                    {p.name}, {p.age}
                  </button>
                  <p>
                    {getCountry(p.country)?.flag} {p.country}
                  </p>
                  <span className="small muted">
                    {p.online
                      ? uiText("social.online_in_demo")
                      : uiText("social.recently_active")}
                  </span>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => setView(p)}
                  aria-label={`View ${p.name}`}
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
              <p className="friend-bio">{p.bio}</p>
              <div className="profile-tags">
                {p.interests.slice(0, 2).map((i) => (
                  <Tag key={i}>{i}</Tag>
                ))}
              </div>
              <div className="friend-actions">
                {tab === "friends" ? (
                  <>
                    <ButtonLink
                      variant="secondary"
                      href={`/app/messages?user=${p.id}`}
                    >
                      <MessageCircle size={16} />
                      {uiText("social.say_hello")}
                    </ButtonLink>
                    <Button variant="ghost" onClick={() => setRemove(p)}>
                      {uiText("social.remove")}
                    </Button>
                  </>
                ) : tab === "incoming" ? (
                  <>
                    <Button
                      onClick={() =>
                        store.respondRequest(
                          store.requests.find((r) => r.userId === p.id)!.id,
                          true,
                        )
                      }
                    >
                      <Check size={16} />
                      {uiText("social.accept")}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        store.respondRequest(
                          store.requests.find((r) => r.userId === p.id)!.id,
                          false,
                        )
                      }
                    >
                      <X size={16} />
                      {uiText("social.decline")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="pending-label">
                      <Clock size={15} />
                      {uiText("social.waiting_for_a_hello")}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        store.respondRequest(
                          store.requests.find((r) => r.userId === p.id)!.id,
                          false,
                        )
                      }
                    >
                      {uiText("social.cancel")}
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users size={32} />}
          title={
            query
              ? uiText("social.no_connections_found")
              : tab === "friends"
                ? uiText("social.your_community_starts_with_a_hello")
                : uiText("social.youre_all_caught_up")
          }
          description={
            query
              ? uiText("social.try_searching_another_name")
              : uiText("social.discover_someone_with_a_shared_interest_and")
          }
          action={
            <ButtonLink href="/app/discover" variant="secondary">
              {uiText("social.find_your_people")}
              <ArrowUpRight size={16} />
            </ButtonLink>
          }
        />
      )}{" "}
      {view && (
        <ProfileModal
          profile={view}
          open={true}
          onClose={() => setView(null)}
        />
      )}
      <Modal
        open={!!remove}
        onClose={() => setRemove(null)}
        title={uiText("social.a_little_more_space")}
      >
        <p>
          {uiText("social.remove_2")}
          {remove?.name} {uiText("social.from_your_demo_friends_you_can_send")}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setRemove(null)}>
            {uiText("social.keep_friend")}
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (remove) await store.removeFriend(remove.id);
              setRemove(null);
            }}
          >
            {uiText("social.remove_friend")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
const notificationIcons = {
  request: UserPlus,
  accepted: Users,
  message: MessageCircle,
  match: Sparkles,
  announcement: Megaphone,
  safety: ShieldCheck,
};
export function Notifications() {
  const store = useApp();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const visible = store.notifications.filter((n) => !unreadOnly || !n.read);
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={uiText("social.whats_new")}
        {...copy.pages.notifications}
        action={
          <Button
            variant="secondary"
            onClick={() => store.markRead()}
            disabled={store.notifications.every((n) => n.read)}
          >
            <CheckCheck size={17} />
            {uiText("social.mark_all_as_read")}
          </Button>
        }
      />
      <div className="tabs">
        <button
          className={!unreadOnly ? "active" : ""}
          onClick={() => setUnreadOnly(false)}
        >
          {uiText("social.all_updates")}
        </button>
        <button
          className={unreadOnly ? "active" : ""}
          onClick={() => setUnreadOnly(true)}
        >
          {uiText("social.unread")}
          <span>{store.notifications.filter((n) => !n.read).length}</span>
        </button>
      </div>
      <div className="notification-list">
        {visible.map((n) => {
          const Icon = notificationIcons[n.kind];
          return (
            <article
              className={`notification-item ${!n.read ? "unread" : ""}`}
              key={n.id}
            >
              <span className={`notification-icon ${n.kind}`}>
                <Icon size={22} />
              </span>
              <div>
                <Link href={n.href} onClick={() => store.markRead(n.id)}>
                  <h3>{n.title}</h3>
                </Link>
                <p>{n.description}</p>
                <span>{n.time}</span>
              </div>
              {!n.read && (
                <button
                  className="read-dot"
                  aria-label={`Mark ${n.title} as read`}
                  onClick={() => store.markRead(n.id)}
                >
                  <i />
                </button>
              )}
              <Link
                className="icon-btn"
                href={n.href}
                onClick={() => store.markRead(n.id)}
                aria-label={`Open ${n.title}`}
              >
                <ArrowUpRight size={19} />
              </Link>
            </article>
          );
        })}
        {!visible.length && (
          <EmptyState
            icon={<Bell size={32} />}
            title={uiText("social.nothing_new_plenty_to_discover")}
            description={uiText(
              "social.youre_all_caught_up_with_your_community",
            )}
            action={
              <ButtonLink href="/app/discover" variant="secondary">
                {uiText("social.meet_someone_new")}
              </ButtonLink>
            }
          />
        )}
      </div>
    </div>
  );
}
