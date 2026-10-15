"use client";
import { text as uiText } from "@/config/brand";

import { Photo } from "./photo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Shuffle,
  Globe2,
  Sparkles,
  SlidersHorizontal,
  Check,
  X,
  Heart,
  Music2,
  Plane,
  Palette,
  Code2,
  Camera,
  Users,
  MessageCircle,
  Bell,
} from "lucide-react";
import {
  profiles,
  countries,
  interests,
  languages,
  getCountry,
} from "@/lib/data";
import { copy } from "@/config/brand";
import type { DiscoveryFilters, Profile } from "@/lib/types";
import { discoveryService } from "@/services";
import { useApp } from "./provider";
import {
  Avatar,
  Button,
  ButtonLink,
  EmptyState,
  PageHeader,
  SearchInput,
  SectionTitle,
  Select,
  SkeletonCards,
  Toggle,
} from "./ui";
import { ProfileCard } from "./profile-card";
export function Dashboard() {
  const store = useApp();
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [interest, setInterest] = useState("");
  const recommended = profiles
    .filter(
      (p) =>
        !store.blocked.includes(p.id) &&
        (!country || p.country === country) &&
        (!language || p.languages.includes(language)) &&
        (!interest || p.interests.includes(interest)),
    )
    .slice(0, 4);
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={`A LITTLE HELLO, ${store.profile.name.toUpperCase()} 👋`}
        {...copy.pages.dashboard}
        action={
          <div className="your-status">
            <Toggle
              label={uiText("discovery.im_open_to_a_hello")}
              checked={store.preferences.online}
              onChange={(v) =>
                store.setPreferences((p) => ({ ...p, online: v }))
              }
            />
          </div>
        }
      />
      <div className="dashboard-banner">
        <div>
          <span className="banner-label">
            <Sparkles size={14} />
            {uiText("discovery.a_little_serendipity")}
          </span>
          <h2>
            {uiText("discovery.new_people")}
            <br />
            {uiText("discovery.unexpected_connections")}
          </h2>
          <p>
            {uiText(
              "discovery.your_next_favorite_conversation_hasnt_happened_yet",
            )}
          </p>
          <ButtonLink href="/app/match" variant="dark">
            <Shuffle size={17} />
            {uiText("discovery.start_matching")}
            <ArrowUpRight size={17} />
          </ButtonLink>
        </div>
        <div className="banner-visual">
          <div className="banner-orbit" />
          <Photo src="/images/amina.jpg" alt={uiText("discovery.amina")} />
          <Photo src="/images/kwame.jpg" alt={uiText("discovery.kwame")} />
          <Photo src="/images/zuri.jpg" alt={uiText("discovery.zuri")} />
          <span>✦</span>
          <div className="banner-bubble">
            {uiText("discovery.same_energy_new_connection")}
          </div>
        </div>
      </div>
      <div className="dashboard-stats">
        <Link href="/app/friends">
          <span className="stat-icon lilac">
            <Users size={20} />
          </span>
          <strong>
            {store.friends.length}
            <small>{uiText("discovery.your_connections")}</small>
          </strong>
          <ArrowUpRight size={17} />
        </Link>
        <Link href="/app/messages">
          <span className="stat-icon green">
            <MessageCircle size={20} />
          </span>
          <strong>
            {store.conversations.reduce((a, c) => a + c.unread, 0)}
            <small>{uiText("discovery.unread_messages")}</small>
          </strong>
          <ArrowUpRight size={17} />
        </Link>
        <Link href="/app/notifications">
          <span className="stat-icon peach">
            <Bell size={20} />
          </span>
          <strong>
            {store.notifications.filter((n) => !n.read).length}
            <small>{uiText("discovery.new_updates")}</small>
          </strong>
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-discovery">
          <SectionTitle
            title={uiText("discovery.find_a_familiar_energy")}
            subtitle={uiText("discovery.a_few_people_you_might_click_with")}
            href="/app/discover"
            link={uiText("discovery.discover_all")}
          />
          <div className="quick-filters">
            <Select
              label={uiText("discovery.country")}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">{uiText("discovery.anywhere")}</option>
              {countries.map((c) => (
                <option key={c.code}>{c.name}</option>
              ))}
            </Select>
            <Select
              label={uiText("discovery.language")}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">{uiText("discovery.any_language")}</option>
              {languages.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
            {(country || language || interest) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCountry("");
                  setLanguage("");
                  setInterest("");
                }}
              >
                {uiText("discovery.reset")}
              </Button>
            )}
          </div>
          <div className="interest-tabs">
            {[
              "",
              "Music",
              "Travel",
              uiText("discovery.art_design"),
              "Technology",
            ].map((i, index) => {
              const Icon = [Sparkles, Music2, Plane, Palette, Code2][index];
              return (
                <button
                  className={interest === i ? "active" : ""}
                  onClick={() => setInterest(i)}
                  key={i}
                >
                  <Icon size={15} />
                  {i || uiText("discovery.for_you")}
                </button>
              );
            })}
          </div>
          {recommended.length ? (
            <div className="profile-grid dashboard-profile-grid">
              {recommended.map((p) => (
                <ProfileCard key={p.id} profile={p} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCountry("");
                    setLanguage("");
                    setInterest("");
                  }}
                >
                  {uiText("discovery.reset_preferences")}
                </Button>
              }
            />
          )}
          <SectionTitle
            title={uiText("discovery.crossed_paths_recently")}
            subtitle={uiText("discovery.a_hello_worth_coming_back_to")}
          />
          <div className="recent-matches">
            {profiles
              .filter((p) => !store.blocked.includes(p.id))
              .slice(2, 5)
              .map((p) => (
                <Link key={p.id} href={`/app/messages?user=${p.id}`}>
                  <Avatar profile={p} size={43} />
                  <span>
                    <strong>
                      {p.name}, {p.age}
                    </strong>
                    <small>
                      {getCountry(p.country)?.flag} {p.country}
                    </small>
                  </span>
                  <MessageCircle size={18} />
                </Link>
              ))}
          </div>
        </div>
        <aside className="dashboard-right">
          <div className="panel mini-profile">
            <Avatar
              profile={{ ...store.profile, online: store.preferences.online }}
              size={68}
            />
            <h3>
              {store.profile.name}, {store.profile.age}
            </h3>
            <p>
              {getCountry(store.profile.country)?.flag} {store.profile.country}
            </p>
            <div className="profile-tags">
              {store.profile.interests.slice(0, 2).map((i) => (
                <span className="tag" key={i}>
                  {i}
                </span>
              ))}
            </div>
            <ButtonLink href="/app/profile" variant="secondary">
              {uiText("discovery.your_profile")}
              <ArrowUpRight size={15} />
            </ButtonLink>
          </div>
          <div className="panel request-preview">
            <SectionTitle
              title={uiText("discovery.new_hellos")}
              href="/app/friends"
              link={uiText("discovery.all")}
            />
            {store.requests.filter((r) => r.direction === "incoming").length ? (
              store.requests
                .filter((r) => r.direction === "incoming")
                .map((r) => {
                  const p = profiles.find((p) => p.id === r.userId)!;
                  return (
                    <div className="mini-request" key={r.id}>
                      <Avatar profile={p} size={37} />
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.country}</small>
                      </div>
                      <button
                        className="accept-mini"
                        aria-label={`Accept ${p.name}`}
                        onClick={() => store.respondRequest(r.id, true)}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        aria-label={`Reject ${p.name}`}
                        onClick={() => store.respondRequest(r.id, false)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })
            ) : (
              <p className="muted small">
                {uiText("discovery.all_caught_up_discover_someone_new")}
              </p>
            )}
          </div>
          <div className="daily-note">
            <Globe2 size={24} />
            <h3>
              {uiText("discovery.different_places")}
              <br />
              {uiText("discovery.shared_humanity")}
            </h3>
            <p>{uiText("discovery.try_a_conversation_in_a_new_country")}</p>
            <Link href="/app/discover">
              {uiText("discovery.take_a_look_around")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="panel">
            <SectionTitle
              title={uiText("discovery.your_updates")}
              href="/app/notifications"
              link={uiText("discovery.all")}
            />
            {store.notifications
              .filter((n) => !n.read)
              .slice(0, 2)
              .map((n) => (
                <Link className="mini-update" href={n.href} key={n.id}>
                  <i />
                  <span>
                    {n.title}
                    <small>{n.time}</small>
                  </span>
                </Link>
              ))}
            {store.notifications.every((n) => n.read) && (
              <p className="muted small">
                {uiText("discovery.youre_all_caught_up")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
export function Discovery() {
  const params = useSearchParams();
  const store = useApp();
  const [filters, setFilters] = useState<DiscoveryFilters>({
    country: params.get("country") || "",
    language: params.get("language") || "",
    interest: params.get("interest") || "",
  });
  const [savedOnly, setSavedOnly] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    discoveryService
      .list(filters)
      .then((result) => {
        if (live) {
          setPeople(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (live) {
          setError(
            uiText("discovery.we_couldnt_load_the_demo_profiles_please"),
          );
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [filters, retry]);
  const update = (key: keyof DiscoveryFilters, value: string | boolean) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const visible = people.filter(
    (p) =>
      !store.blocked.includes(p.id) &&
      (!savedOnly || store.saved.includes(p.id)),
  );
  const active = Object.values(filters).filter(Boolean).length;
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={uiText("discovery.a_world_of_possibility")}
        {...copy.pages.discover}
        action={
          <ButtonLink href="/app/match" variant="secondary">
            <Shuffle size={17} />
            {uiText("discovery.surprise_me")}
          </ButtonLink>
        }
      />
      <div className="discovery-toolbar">
        <SearchInput
          value={filters.query || ""}
          onChange={(v) => update("query", v)}
          placeholder={uiText("discovery.search_names_stories_and_good_energy")}
        />
        <Button
          variant={savedOnly ? "primary" : "secondary"}
          onClick={() => setSavedOnly(!savedOnly)}
        >
          <Heart size={17} />
          {savedOnly
            ? uiText("discovery.saved_profiles")
            : uiText("discovery.your_favorites")}
          {store.saved.length > 0 && ` (${store.saved.length})`}
        </Button>
      </div>
      <div className="filter-panel">
        <div className="filter-heading">
          <SlidersHorizontal size={17} />
          <strong>
            {uiText("discovery.a_little_more_your_kind_of_people")}
          </strong>
          {(active > 0 || savedOnly) && (
            <button
              className="text-link"
              onClick={() => {
                setFilters({});
                setSavedOnly(false);
              }}
            >
              {uiText("discovery.clear_all_filters")}
              <X size={13} />
            </button>
          )}
        </div>
        <div className="filter-grid">
          <Select
            label={uiText("discovery.country")}
            value={filters.country || ""}
            onChange={(e) => update("country", e.target.value)}
          >
            <option value="">{uiText("discovery.all_countries")}</option>
            {countries.map((c) => (
              <option key={c.code}>{c.name}</option>
            ))}
          </Select>
          <Select
            label={uiText("discovery.region")}
            value={filters.region || ""}
            onChange={(e) => update("region", e.target.value)}
          >
            <option value="">{uiText("discovery.all_regions")}</option>
            {[...new Set(countries.map((c) => c.region))].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Select
            label={uiText("discovery.language")}
            value={filters.language || ""}
            onChange={(e) => update("language", e.target.value)}
          >
            <option value="">{uiText("discovery.all_languages")}</option>
            {languages.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
          <Select
            label={uiText("discovery.interest")}
            value={filters.interest || ""}
            onChange={(e) => update("interest", e.target.value)}
          >
            <option value="">{uiText("discovery.all_interests")}</option>
            {interests.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
          <Toggle
            label={uiText("discovery.online_now")}
            checked={!!filters.online}
            onChange={(v) => update("online", v)}
          />
        </div>
      </div>
      <div className="results-heading">
        <span>
          {loading
            ? uiText("discovery.finding_your_people")
            : `${visible.length} ${visible.length === 1 ? "person" : "people"} to discover`}
        </span>
        <span>
          <Globe2 size={15} />
          {uiText("discovery.across_africa_beyond")}
        </span>
      </div>
      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <EmptyState
          title={uiText("discovery.a_small_bump_in_the_road")}
          description={error}
          action={
            <Button onClick={() => setRetry((v) => v + 1)}>
              {uiText("discovery.try_again")}
            </Button>
          }
        />
      ) : visible.length ? (
        <div className="profile-grid discover-grid">
          {visible.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            savedOnly
              ? uiText("discovery.your_favorites_start_with_a_little_heart")
              : uiText("discovery.no_matches_just_yet")
          }
          description={
            savedOnly
              ? uiText("discovery.tap_the_heart_on_any_profile_to")
              : uiText(
                  "discovery.try_another_country_language_or_interest_theres",
                )
          }
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({});
                setSavedOnly(false);
              }}
            >
              {uiText("discovery.explore_all_people")}
              <ArrowUpRight size={16} />
            </Button>
          }
        />
      )}
      <div className="discovery-end">
        <Camera size={17} />
        {uiText("discovery.real_stories_start_with_real_respect_keep")}
      </div>
    </div>
  );
}
