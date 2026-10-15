"use client";
import { text as uiText } from "@/config/brand";

import { Photo } from "./photo";
import { useEffect, useRef, useState } from "react";
import {
  Shuffle,
  ArrowUpRight,
  Globe2,
  ShieldCheck,
  Sparkles,
  X,
  Check,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  SkipForward,
  Flag,
  Send,
  Wifi,
  MessageCircle,
  AlertTriangle,
  Search,
  Ban,
} from "lucide-react";
import { countries, languages, interests, getCountry } from "@/lib/data";
import { copy } from "@/config/brand";
import type { DiscoveryFilters, MatchState, Profile } from "@/lib/types";
import { matchmakingService } from "@/services";
import {
  Avatar,
  Button,
  ButtonLink,
  EmptyState,
  Modal,
  PageHeader,
  Select,
  Tag,
} from "./ui";
import { useApp } from "./provider";
import { ReportForm } from "./safety";
export function Matching() {
  const store = useApp();
  const [state, setState] = useState<MatchState>("idle");
  const [mode, setMode] = useState("video");
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [outcome, setOutcome] = useState<"normal" | "empty" | "error">(
    "normal",
  );
  const [person, setPerson] = useState<Profile | null>(null);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [chat, setChat] = useState<{ from: "me" | "them"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState(false);
  const [block, setBlock] = useState(false);
  const operation = useRef(0);
  useEffect(
    () => () => {
      operation.current++;
    },
    [],
  );
  useEffect(() => {
    if (state !== "call") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);
  async function search(skip = false) {
    const token = ++operation.current;
    setState("searching");
    setSeconds(0);
    setChat([]);
    setDraft("");
    try {
      const match = await matchmakingService.find(filters, outcome, [
        ...store.blocked,
        ...(skip && person ? [person.id] : []),
      ]);
      if (token !== operation.current) return;
      setPerson(match);
      setState(match ? "found" : "empty");
    } catch {
      if (token === operation.current) setState("error");
    }
  }
  function cancel() {
    operation.current++;
    setState("idle");
    setPerson(null);
  }
  function accept() {
    setMic(store.preferences.sounds);
    setCamera(store.preferences.video);
    setChat([
      {
        from: "them",
        text: `Hey ${store.profile.name}! Nice to meet you 👋 (sample message)`,
      },
    ]);
    setState("call");
  }
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={uiText("matching.a_little_serendipity")}
        {...copy.pages.match}
        action={
          <span className="safe-label">
            <ShieldCheck size={16} />
            {uiText("matching.your_pace_your_choice")}
          </span>
        }
      />
      {state === "call" && person ? (
        <div className="call-layout">
          <section
            className={`call-stage ${mode === "text" ? "text-mode" : ""}`}
          >
            <div className="call-stage-top">
              <span>
                <i />
                {uiText("matching.simulated_conversation")}
              </span>
              <span>
                <Wifi size={15} />
                {uiText("matching.demo_signal")}
                <b>
                  {Math.floor(seconds / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(seconds % 60).toString().padStart(2, "0")}
                </b>
              </span>
            </div>
            {mode === "video" ? (
              <Photo
                className="remote-video"
                src={person.photo}
                alt={`${person.name} — static photo, not live video`}
              />
            ) : (
              <div className="text-call-person">
                <Avatar profile={person} size={140} />
                <h2>
                  {uiText("matching.youre_chatting_with")}
                  {person.name}.
                </h2>
                <p>{uiText("matching.no_cameras_just_conversation")}</p>
              </div>
            )}
            <div className="call-profile-label">
              <h2>
                {person.name}, {person.age} {getCountry(person.country)?.flag}
              </h2>
              <p>
                {person.country} · {person.languages.join(" / ")}
              </p>
              <span>
                {uiText("matching.static_image_no_live_video_or_audio")}
              </span>
            </div>
            <div className="local-camera">
              {camera && mode === "video" ? (
                <Photo
                  src={store.profile.photo}
                  alt={uiText(
                    "matching.your_static_profile_photo_camera_placeholder",
                  )}
                />
              ) : (
                <VideoOff size={30} />
              )}
              <span>
                {uiText("matching.you")}
                {camera && mode === "video" ? "photo preview" : "camera off"}
              </span>
            </div>
            <div className="call-control-bar">
              <button
                aria-label={
                  mic
                    ? uiText("matching.mute_microphone")
                    : uiText("matching.unmute_microphone")
                }
                className={!mic ? "off" : ""}
                onClick={() => setMic(!mic)}
              >
                {mic ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                aria-label={
                  camera
                    ? uiText("matching.turn_camera_off")
                    : uiText("matching.turn_camera_on")
                }
                className={!camera ? "off" : ""}
                onClick={() => setCamera(!camera)}
              >
                {camera ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button
                className="end-call"
                aria-label={uiText("matching.end_simulated_call")}
                onClick={cancel}
              >
                <PhoneOff size={21} />
              </button>
              <button
                aria-label={uiText("matching.next_person")}
                onClick={() => search(true)}
              >
                <SkipForward size={20} />
              </button>
              <button
                aria-label={uiText("matching.report_user")}
                onClick={() => setReport(true)}
              >
                <Flag size={19} />
              </button>
            </div>
            <button
              className="emergency-disconnect"
              onClick={() => setBlock(true)}
            >
              <ShieldCheck size={15} />
              {uiText("matching.disconnect_block")}
            </button>
          </section>
          <aside className="call-chat">
            <header>
              <MessageCircle size={19} />
              <h3>{uiText("matching.a_little_side_conversation")}</h3>
            </header>
            <div className="call-chat-note">
              <ShieldCheck size={15} />
              {uiText("matching.keep_it_kind_keep_personal_details_private")}
            </div>
            <div className="call-chat-messages">
              {chat.map((m, i) => (
                <div className={`message-row ${m.from}`} key={i}>
                  <div className="message-bubble">{m.text}</div>
                </div>
              ))}
            </div>
            <form
              className="message-composer"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) {
                  setChat((prev) => [
                    ...prev,
                    { from: "me", text: draft.trim() },
                  ]);
                  setDraft("");
                }
              }}
            >
              <input
                aria-label={uiText("matching.call_chat_message")}
                placeholder={uiText("matching.say_a_little_hello")}
                value={draft}
                maxLength={1000}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button
                type="submit"
                aria-label={uiText("matching.send_call_chat_message")}
                disabled={!draft.trim()}
              >
                <Send size={17} />
              </Button>
            </form>
            <p className="message-disclaimer">
              {uiText("matching.demo_chat_not_sent_to_anyone")}
            </p>
          </aside>
        </div>
      ) : (
        <div className="matching-layout">
          <section className={`matching-stage state-${state}`}>
            {state === "idle" && (
              <>
                <div className="match-illustration">
                  <div className="match-ring ring-one" />
                  <div className="match-ring ring-two" />
                  <Photo
                    className="match-face first"
                    src="/images/amina.jpg"
                    alt={uiText("matching.fictional_member")}
                  />
                  <Photo
                    className="match-face second"
                    src="/images/zuri.jpg"
                    alt={uiText("matching.fictional_member")}
                  />
                  <Photo
                    className="match-face third"
                    src="/images/kwame.jpg"
                    alt={uiText("matching.fictional_member")}
                  />
                  <span className="match-main-icon">
                    <Shuffle size={42} strokeWidth={1.4} />
                  </span>
                  <span className="match-star">✦</span>
                </div>
                <span className="eyebrow">
                  {uiText("matching.your_next_hello_is_out_there")}
                </span>
                <h2>
                  {uiText("matching.let_a_little_chance")}
                  <br />
                  {uiText("matching.bring_you_together")}
                </h2>
                <p>
                  {uiText("matching.a_new_face_a_shared_interest_a")}
                  <br />
                  {uiText("matching.well_take_care_of_the_introduction")}
                </p>
                <Button className="match-start" onClick={() => search()}>
                  <Shuffle size={19} />
                  {uiText("matching.start_matching")}
                  <ArrowUpRight size={19} />
                </Button>
                <span className="small muted">
                  {uiText(
                    "matching.18_only_simulated_matching_no_camera_access",
                  )}
                </span>
              </>
            )}
            {state === "searching" && (
              <>
                <div className="searching-orbit">
                  <span />
                  <span />
                  <span />
                  <Search size={40} />
                </div>
                <span className="eyebrow">
                  {uiText("matching.good_connections_take_a_moment")}
                </span>
                <h2>{uiText("matching.finding_a_familiar_energy")}</h2>
                <p>
                  {uiText(
                    "matching.exploring_your_preferences_across_the_demo_community",
                  )}
                </p>
                <Button variant="secondary" onClick={cancel}>
                  <X size={17} />
                  {uiText("matching.cancel_search")}
                </Button>
              </>
            )}
            {state === "found" && person && (
              <>
                <span className="match-found-label">
                  <Sparkles size={16} />
                  {uiText("matching.a_new_hello_is_waiting")}
                </span>
                <div className="match-found-photo">
                  <Photo src={person.photo} alt={person.name} />
                  <span>✦</span>
                </div>
                <h2>
                  {person.name}, {person.age} {getCountry(person.country)?.flag}
                </h2>
                <p>
                  {person.country} · {person.languages.join(" / ")}
                </p>
                <div className="profile-tags">
                  {person.interests.map((i) => (
                    <Tag key={i}>{i}</Tag>
                  ))}
                </div>
                <p className="match-bio">{person.bio}</p>
                <div className="match-found-actions">
                  <Button variant="secondary" onClick={() => search(true)}>
                    <SkipForward size={17} />
                    {uiText("matching.maybe_next_time")}
                  </Button>
                  <Button onClick={accept}>
                    <Check size={18} />
                    {uiText("matching.say_hello")}
                  </Button>
                </div>
                <button className="text-link small" onClick={cancel}>
                  {uiText("matching.back_to_preferences")}
                </button>
                <span className="small muted">
                  {uiText(
                    "matching.fictional_match_accept_to_preview_a_simulated",
                  )}
                </span>
              </>
            )}
            {state === "empty" && (
              <EmptyState
                title={uiText("matching.a_little_quiet_in_this_corner")}
                description={uiText(
                  "matching.no_available_demo_profiles_match_these_preferences",
                )}
                action={
                  <>
                    <Button
                      onClick={() => {
                        setFilters({});
                        setOutcome("normal");
                        setState("idle");
                      }}
                    >
                      {uiText("matching.reset_preferences")}
                      <Globe2 size={17} />
                    </Button>
                    <Button variant="ghost" onClick={cancel}>
                      {uiText("matching.back")}
                    </Button>
                  </>
                }
              />
            )}{" "}
            {state === "error" && (
              <EmptyState
                icon={<AlertTriangle size={35} />}
                title={uiText("matching.a_small_bump_in_the_connection")}
                description={uiText(
                  "matching.this_is_a_simulated_connection_failure_no",
                )}
                action={
                  <>
                    <Button onClick={() => search()}>
                      {uiText("matching.try_again")}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setOutcome("normal");
                        cancel();
                      }}
                    >
                      {uiText("matching.back_to_matching")}
                    </Button>
                  </>
                }
              />
            )}
          </section>
          <aside className="matching-preferences">
            <div className="panel">
              <h3>{uiText("matching.your_kind_of_connection")}</h3>
              <p className="muted small">
                {uiText("matching.a_few_preferences_a_little_possibility")}
              </p>
              <label className="field">
                <span>{uiText("matching.how_would_you_like_to_connect")}</span>
              </label>
              <div className="mode-switch">
                <button
                  disabled={state !== "idle"}
                  className={mode === "video" ? "active" : ""}
                  onClick={() => setMode("video")}
                >
                  <Video size={18} />
                  {uiText("matching.video_preview")}
                </button>
                <button
                  disabled={state !== "idle"}
                  className={mode === "text" ? "active" : ""}
                  onClick={() => setMode("text")}
                >
                  <MessageCircle size={18} />
                  {uiText("matching.text_chat")}
                </button>
              </div>
              <Select
                label={uiText("matching.country_preference")}
                value={filters.country || ""}
                disabled={state !== "idle"}
                onChange={(e) =>
                  setFilters({ ...filters, country: e.target.value })
                }
              >
                <option value="">
                  {uiText("matching.surprise_me_anywhere")}
                </option>
                {countries.map((c) => (
                  <option key={c.code}>{c.name}</option>
                ))}
              </Select>
              <Select
                label={uiText("matching.language")}
                value={filters.language || ""}
                disabled={state !== "idle"}
                onChange={(e) =>
                  setFilters({ ...filters, language: e.target.value })
                }
              >
                <option value="">{uiText("matching.any_language")}</option>
                {languages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
              <Select
                label={uiText("matching.shared_interest")}
                value={filters.interest || ""}
                disabled={state !== "idle"}
                onChange={(e) =>
                  setFilters({ ...filters, interest: e.target.value })
                }
              >
                <option value="">{uiText("matching.open_to_anything")}</option>
                {interests.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
              <details className="demo-controls">
                <summary>
                  {uiText("matching.developer_preview_controls")}
                </summary>
                <Select
                  label={uiText("matching.simulate_an_outcome")}
                  value={outcome}
                  disabled={state !== "idle"}
                  onChange={(e) => setOutcome(e.target.value as typeof outcome)}
                >
                  <option value="normal">
                    {uiText("matching.normal_match")}
                  </option>
                  <option value="empty">
                    {uiText("matching.no_available_matches")}
                  </option>
                  <option value="error">
                    {uiText("matching.connection_failure")}
                  </option>
                </Select>
              </details>
            </div>
            <div className="match-safety">
              <ShieldCheck size={25} />
              <h3>{uiText("matching.good_vibes_clear_boundaries")}</h3>
              <p>{uiText("matching.you_can_skip_end_a_conversation_or")}</p>
              <ButtonLink href="/app/safety" variant="ghost">
                {uiText("matching.explore_our_safety_tools")}
                <ArrowUpRight size={15} />
              </ButtonLink>
            </div>
          </aside>
        </div>
      )}
      <Modal
        open={report}
        onClose={() => setReport(false)}
        title={uiText("matching.report_this_interaction")}
      >
        {person && (
          <ReportForm userId={person.id} onDone={() => setReport(false)} />
        )}
      </Modal>
      <Modal
        open={block}
        onClose={() => setBlock(false)}
        title={uiText("matching.disconnect_and_block")}
      >
        <p>
          {uiText(
            "matching.this_ends_the_simulated_conversation_immediately_and",
          )}
          {person?.name}{" "}
          {uiText("matching.from_discovery_for_this_demo_session")}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setBlock(false)}>
            {uiText("matching.keep_talking")}
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (person) await store.blockUser(person.id);
              setBlock(false);
              cancel();
            }}
          >
            <Ban size={17} />
            {uiText("matching.disconnect_block")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
