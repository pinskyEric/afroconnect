"use client";
import { text as uiText } from "@/config/brand";

import { Photo } from "./photo";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Globe2,
  Sparkles,
  Video,
  Mic,
  Phone,
  Plus,
  MessageCircle,
  Check,
  Heart,
  Smartphone,
  Wifi,
  Music2,
  Plane,
  Palette,
  Code2,
  Utensils,
  Gamepad2,
  Camera,
  Dumbbell,
  Languages,
} from "lucide-react";
import { copy, faqs } from "@/config/brand";
import { profiles, countries } from "@/lib/data";
import { PublicHeader, PublicFooter } from "./layouts";
import { Avatar, ButtonLink, SectionTitle } from "./ui";
import { ProfileCard } from "./profile-card";
const interestIcons = [
  Music2,
  Plane,
  Palette,
  Code2,
  Utensils,
  Gamepad2,
  Camera,
  Dumbbell,
];
export function Landing() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-sun">✳</span>
              {copy.hero.eyebrow}
            </div>
            <h1>
              {copy.hero.title[0]}
              <br />
              {copy.hero.title[1]}
              <br />
              <span>
                {copy.hero.title[2]}
                <svg viewBox="0 0 480 17" aria-hidden="true">
                  <path
                    d="M3 12 Q220 -4 477 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p>{copy.hero.description}</p>
            <div className="hero-actions">
              <ButtonLink href="/register">
                {copy.hero.primary}
                <ArrowUpRight size={19} />
              </ButtonLink>
              <ButtonLink href="/app" variant="secondary">
                {copy.hero.secondary}
                <ArrowRight size={18} />
              </ButtonLink>
            </div>
            <div className="hero-social-proof">
              <div className="avatar-stack">
                {profiles.slice(0, 4).map((p) => (
                  <Avatar
                    key={p.id}
                    profile={{ ...p, online: false }}
                    size={37}
                  />
                ))}
              </div>
              <div>
                <strong>
                  {uiText("landing.different_worlds_one_community")}
                </strong>
                <span>{uiText("landing.come_as_you_are_find_where_you")}</span>
              </div>
            </div>
            <div className="hero-safety">
              <ShieldCheck size={15} />
              <span>{uiText("landing.a_safer_space_to_connect")}</span>
              <i />
              <span>{uiText("landing.18_only")}</span>
              <i />
              <span>{uiText("landing.free_to_explore")}</span>
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label={uiText(
              "landing.preview_of_fictional_community_members",
            )}
          >
            <svg
              className="hero-orbits"
              viewBox="0 0 650 610"
              aria-hidden="true"
            >
              <ellipse
                cx="325"
                cy="305"
                rx="293"
                ry="227"
                transform="rotate(-32 325 305)"
              />
              <ellipse
                cx="325"
                cy="305"
                rx="224"
                ry="291"
                transform="rotate(-32 325 305)"
              />
            </svg>
            <span className="hero-star star-one">✦</span>
            <span className="hero-star star-two">✳</span>
            <div className="floating-hello">
              <span>👋</span>{" "}
              {uiText("landing.a_simple_hello_a_world_of_possibilities")}
            </div>
            <div className="hero-person hero-person-main">
              <Photo
                src="/images/amina.jpg"
                sizes="(max-width:760px) 60vw, 450px"
                alt={uiText("landing.amina_a_fictional_member_from_uganda")}
                fetchPriority="high"
              />
              <span className="hero-person-live">
                <i />
                {uiText("landing.open_to_a_hello")}
              </span>
              <div className="hero-person-caption">
                <div>
                  <strong>
                    {uiText("landing.amina_24")}
                    <span>🇺🇬</span>
                  </strong>
                  <span>{uiText("landing.uganda_travel_good_vibes")}</span>
                </div>
                <span className="hero-connect">
                  <ArrowUpRight size={24} />
                </span>
              </div>
            </div>
            <div className="hero-person hero-person-small">
              <Photo
                src="/images/kwame.jpg"
                sizes="(max-width:760px) 45vw, 350px"
                alt={uiText("landing.kwame_a_fictional_member_from_ghana")}
                fetchPriority="high"
              />
              <div className="hero-person-caption">
                <div>
                  <strong>
                    {uiText("landing.kwame_27")}
                    <span>🇬🇭</span>
                  </strong>
                  <span>{uiText("landing.music_brings_us_together")}</span>
                </div>
              </div>
            </div>
            <div className="connection-sticker">
              <span>
                <Heart size={24} fill="currentColor" />
              </span>
              <div>
                {uiText("landing.new_connection")}
                <strong>
                  {uiText("landing.different_places_same_energy")}
                </strong>
              </div>
              <Sparkles size={19} />
            </div>
            <div className="language-sticker">
              <Languages size={18} />
              <span>{uiText("landing.hello_jambo_bonjour")}</span>
            </div>
            <div className="hero-note">
              {uiText("landing.your_people_are_out_there")}
              <svg width="75" height="42" viewBox="0 0 75 42">
                <path
                  d="M3 5 Q40 48 69 13 M56 17l14-6-2 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </section>
        <div className="community-strip">
          <div className="container">
            <span>
              {uiText("landing.from_your_corner_of_africa")}
              <br />
              <strong>{uiText("landing.to_every_corner_of_the_world")}</strong>
            </span>
            <div>
              {countries.slice(0, 6).map((c) => (
                <Link
                  href={`/app/discover?country=${encodeURIComponent(c.name)}`}
                  key={c.name}
                >
                  <span>{c.flag}</span>
                  {c.name}
                </Link>
              ))}
              <Link className="and-beyond" href="/app/discover">
                <Globe2 size={21} />
                {uiText("landing.and_beyond")}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
        <section
          className="landing-section container discover-preview"
          id="discover"
        >
          <SectionTitle
            title={uiText("landing.your_next_favorite_person_is_out_there")}
            subtitle={uiText("landing.a_shared_interest_a_familiar_language_a")}
            href="/app/discover"
            link={uiText("landing.explore_the_community")}
          />
          <div className="profile-grid landing-profile-grid">
            {profiles.slice(0, 4).map((p) => (
              <ProfileCard key={p.id} profile={p} compact />
            ))}
          </div>
          <p className="sample-caption">
            <span className="status-dot" />
            {uiText("landing.a_glimpse_of_the_community_fictional_profiles")}
          </p>
        </section>
        <section className="how-section" id="how-it-works">
          <div className="container">
            <div className="section-centered">
              <div className="eyebrow">
                {uiText("landing.less_scrolling_more_connecting")}
              </div>
              <h2>
                {uiText("landing.a_good_conversation_starts")}
                <br />
                {uiText("landing.with_a_simple_hello")}
              </h2>
              <p>
                {uiText("landing.no_pressure_no_perfect_opening_line_just")}
              </p>
            </div>
            <div className="how-grid">
              <div className="how-step">
                <span className="step-art">
                  <UsersIllustration />
                </span>
                <small>{uiText("landing.01_make_it_you")}</small>
                <h3>{uiText("landing.bring_your_whole_self")}</h3>
                <p>{uiText("landing.a_few_interests_a_little_about_you")}</p>
              </div>
              <div className="how-step">
                <span className="step-art violet">
                  <Globe2 size={58} strokeWidth={1} />
                  <span className="mini-flag">🇰🇪</span>
                  <span className="mini-flag second">🇬🇭</span>
                </span>
                <small>{uiText("landing.02_find_your_people")}</small>
                <h3>{uiText("landing.follow_your_curiosity")}</h3>
                <p>
                  {uiText("landing.explore_by_country_language_or_the_things")}
                </p>
              </div>
              <div className="how-step">
                <span className="step-art green">
                  <MessageCircle size={50} strokeWidth={1.2} />
                  <Heart size={24} />
                </span>
                <small>{uiText("landing.03_say_that_first_hello")}</small>
                <h3>{uiText("landing.see_where_it_goes")}</h3>
                <p>
                  {uiText("landing.start_a_conversation_share_a_laugh_and")}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-section container interest-section">
          <div>
            <div className="eyebrow">
              {uiText("landing.common_ground_new_connections")}
            </div>
            <h2>
              {uiText("landing.your_thing")}
              <br />
              {uiText("landing.their_thing")}
              <br />
              <span className="violet-text">
                {uiText("landing.something_to_talk_about")}
              </span>
            </h2>
            <p>{uiText("landing.from_afrobeats_to_big_ideas_find_people")}</p>
            <ButtonLink href="/app/discover" variant="secondary">
              {uiText("landing.find_your_common_ground")}
              <ArrowUpRight size={17} />
            </ButtonLink>
          </div>
          <div className="interest-cloud">
            {[
              "Music",
              "Travel",
              uiText("landing.art_design"),
              "Technology",
              "Food",
              "Gaming",
              "Photography",
              "Fitness",
            ].map((name, i) => {
              const Icon = interestIcons[i];
              return (
                <Link
                  className={`interest-tile interest-${i}`}
                  key={name}
                  href={`/app/discover?interest=${encodeURIComponent(name)}`}
                >
                  <Icon size={25} strokeWidth={1.6} />
                  {name}
                  <ArrowUpRight size={15} />
                </Link>
              );
            })}
            <div className="language-discovery">
              <span>
                <Languages size={19} />
                {uiText("landing.speak_your_kind_of_language")}
              </span>
              <div>
                {["English", "Swahili", "French", "Luganda"].map((l) => (
                  <Link key={l} href={`/app/discover?language=${l}`}>
                    {l}
                    <ArrowUpRight size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="container conversation-section">
          <div className="call-preview">
            <div className="call-preview-top">
              <span>
                <i />
                {uiText("landing.conversation_preview")}
              </span>
              <span>
                <Wifi size={15} /> {uiText("landing.looking_good")}
              </span>
            </div>
            <Photo
              className="remote-preview-photo"
              src="/images/zuri.jpg"
              alt={uiText("landing.fictional_video_conversation_preview")}
              loading="lazy"
            />
            <div className="call-preview-name">
              {uiText("landing.zuri_23")}
              <span>🇰🇪</span>
              <small>
                {uiText("landing.good_conversations_have_no_borders")}
              </small>
            </div>
            <Photo
              className="local-preview-photo"
              src="/images/kwame.jpg"
              alt={uiText("landing.local_camera_placeholder")}
              loading="lazy"
            />
            <div className="mock-call-controls">
              <span>
                <Mic size={18} />
              </span>
              <span>
                <Video size={18} />
              </span>
              <Link
                href="/app/match"
                aria-label={uiText("landing.explore_simulated_call")}
              >
                <Phone size={19} />
              </Link>
              <span>
                <MessageCircle size={18} />
              </span>
            </div>
            <span className="preview-only">
              {uiText("landing.mock_video_no_camera_access")}
            </span>
          </div>
          <div className="conversation-copy">
            <div className="eyebrow">
              {uiText("landing.a_little_spontaneity_looks_good_on_you")}
            </div>
            <h2>
              {uiText("landing.a_new_perspective")}
              <br />
              {uiText("landing.just_one_hello_away")}
            </h2>
            <p>{uiText("landing.some_of_the_best_connections_are_the")}</p>
            <ul>
              <li>
                <Check size={16} />
                {uiText("landing.find_a_match_around_your_interests")}
              </li>
              <li>
                <Check size={16} />
                {uiText("landing.connect_on_your_terms_at_your_pace")}
              </li>
              <li>
                <Check size={16} />
                {uiText("landing.skip_leave_or_block_youre_in_control")}
              </li>
            </ul>
            <ButtonLink href="/app/match">
              {uiText("landing.try_a_little_serendipity")}
              <ArrowUpRight size={18} />
            </ButtonLink>
          </div>
        </section>
        <section className="landing-section container safety-section">
          <div className="safety-symbol">
            <ShieldCheck size={56} strokeWidth={1.1} />
            <span>
              {uiText("landing.good_vibes")}
              <br />
              {uiText("landing.stronger_boundaries")}
            </span>
          </div>
          <div>
            <div className="eyebrow">
              {uiText("landing.real_connections_start_with_trust")}
            </div>
            <h2>
              {uiText("landing.a_welcoming_space")}
              <br />
              {uiText("landing.with_your_safety_at_heart")}
            </h2>
            <p>
              {uiText("landing.were_building_a_community_where_respect_isnt")}
            </p>
            <div className="safety-benefits">
              <span>
                <ShieldCheck size={17} />
                {uiText("landing.block_report")}
              </span>
              <span>
                <Heart size={17} />
                {uiText("landing.respectfirst_community")}
              </span>
              <span>{uiText("landing.18_adults_only")}</span>
            </div>
            <Link href="/safety" className="text-link">
              {uiText("landing.our_safety_promise")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
        <section className="container mobile-section">
          <div className="mobile-section-icon">
            <Smartphone size={38} />
          </div>
          <div>
            <h3>{uiText("landing.your_world_wherever_you_go")}</h3>
            <p>{uiText("landing.made_for_your_phone_your_laptop_and")}</p>
          </div>
          <span>
            <Wifi size={17} />
            {uiText("landing.less_data_more_connection")}
          </span>
        </section>
        <section className="landing-section container faq-section">
          <div>
            <div className="eyebrow">
              {uiText("landing.a_little_more_to_know")}
            </div>
            <h2>
              {uiText("landing.good_questions")}
              <br />
              {uiText("landing.honest_answers")}
            </h2>
            <p>
              {uiText("landing.wondering_what_its_all_about")}
              <br />
              {uiText("landing.lets_clear_a_few_things_up")}
            </p>
            <span className="faq-doodle">
              {uiText("landing.hello_curious_human")}
            </span>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={19} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container">
          <div className="closing-cta">
            <span className="cta-star">✳</span>
            <div className="eyebrow">
              {uiText("landing.your_world_is_about_to_get_a")}
            </div>
            <h2>
              {uiText("landing.somewhere_out_there")}
              <br />
              {uiText("landing.someones_waiting_to_say_hello")}
            </h2>
            <ButtonLink href="/register" variant="dark">
              {uiText("landing.lets_make_a_connection")}
              <ArrowUpRight size={18} />
            </ButtonLink>
            <p>{uiText("landing.free_to_explore_always_yourself_18_only")}</p>
            <span className="cta-star second">✦</span>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
function UsersIllustration() {
  return (
    <div className="how-avatars">
      <Photo src="/images/amina.jpg" alt="" loading="lazy" />
      <Photo src="/images/kwame.jpg" alt="" loading="lazy" />
      <span>
        <Plus size={18} />
      </span>
    </div>
  );
}
