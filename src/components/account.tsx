"use client";
import { text as uiText } from "@/config/brand";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowUpRight,
  Camera,
  Check,
  Edit3,
  Globe2,
  Heart,
  Languages,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Bell,
  Wifi,
  Accessibility,
  LockKeyhole,
} from "lucide-react";
import { useApp } from "./provider";
import { countries, languages, interests, getCountry } from "@/lib/data";
import { copy } from "@/config/brand";
import { profileSchema, readPhoto } from "@/lib/validation";
import { authService } from "@/services";
import {
  Avatar,
  Button,
  ButtonLink,
  ChipSelect,
  FormError,
  Modal,
  PageHeader,
  Select,
  Tag,
  Toggle,
} from "./ui";
export function MyProfile() {
  const store = useApp();
  const [edit, setEdit] = useState(false);
  const [photo, setPhoto] = useState(store.profile.photo);
  const [country, setCountry] = useState(store.profile.country);
  const [spoken, setSpoken] = useState(store.profile.languages);
  const [likes, setLikes] = useState(store.profile.interests);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: store.profile,
  });
  function openEdit() {
    reset(store.profile);
    setPhoto(store.profile.photo);
    setCountry(store.profile.country);
    setSpoken(store.profile.languages);
    setLikes(store.profile.interests);
    setError("");
    setEdit(true);
  }
  async function save(values: z.infer<typeof profileSchema>) {
    if (!spoken.length || !likes.length) {
      setError(uiText("account.choose_at_least_one_language_and_one"));
      return;
    }
    await store.saveProfile({
      ...store.profile,
      ...values,
      photo,
      country,
      languages: spoken,
      interests: likes,
    });
    setEdit(false);
  }
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={uiText("account.your_profile")}
        {...copy.pages.profile}
        action={
          <Button onClick={openEdit}>
            <Edit3 size={17} />
            {uiText("account.edit_profile")}
          </Button>
        }
      />
      <div className="my-profile-layout">
        <section className="profile-overview panel">
          <div className="profile-cover">
            <span>✳</span>
            <Globe2 size={130} strokeWidth={0.5} />
            <span>✦</span>
          </div>
          <div className="profile-overview-body">
            <Avatar
              profile={{ ...store.profile, online: store.preferences.online }}
              size={114}
            />
            <span className="self-tag">{uiText("account.this_is_you")}</span>
            <h1>
              {store.profile.name}, {store.profile.age}
              <span>{getCountry(store.profile.country)?.flag}</span>
            </h1>
            <p>@{store.profile.username}</p>
            <div className="profile-location-line">
              <Globe2 size={16} />
              {store.profile.country}
              <span>·</span>
              <i
                className={`status-dot ${!store.preferences.online ? "offline" : ""}`}
              />
              {store.preferences.online
                ? uiText("account.open_to_a_hello")
                : uiText("account.taking_a_little_quiet_time")}
            </div>
            <p className="my-bio">
              {store.profile.bio ||
                uiText("account.your_story_is_still_being_written_add")}
            </p>
            <div className="profile-counts">
              <Link href="/app/friends">
                <strong>{store.friends.length}</strong>
                <span>{uiText("account.friends")}</span>
              </Link>
              <Link href="/app/discover">
                <strong>{store.saved.length}</strong>
                <span>{uiText("account.saved_profiles")}</span>
              </Link>
              <Link href="/app/messages">
                <strong>{store.conversations.length}</strong>
                <span>{uiText("account.conversations")}</span>
              </Link>
            </div>
            <div className="profile-detail-section">
              <h3>
                <Languages size={19} />
                {uiText("account.a_familiar_language")}
              </h3>
              <div className="profile-tags">
                {store.profile.languages.map((l) => (
                  <Tag key={l}>{l}</Tag>
                ))}
              </div>
            </div>
            <div className="profile-detail-section">
              <h3>
                <Heart size={19} />
                {uiText("account.the_things_that_light_me_up")}
              </h3>
              <div className="profile-tags">
                {store.profile.interests.map((i) => (
                  <Tag key={i}>{i}</Tag>
                ))}
              </div>
            </div>
          </div>
        </section>
        <aside>
          <div className="panel profile-tips">
            <SparkleIcon />
            <h3>{uiText("account.a_little_you_goes_a_long_way")}</h3>
            <p>
              {uiText(
                "account.people_connect_with_personality_not_perfection_try",
              )}
            </p>
            <Button variant="secondary" onClick={openEdit}>
              {uiText("account.make_it_yours")}
              <Edit3 size={15} />
            </Button>
          </div>
          <div className="daily-note mt-5">
            <ShieldCheck size={26} />
            <h3>
              {uiText("account.share_your_story")}
              <br />
              {uiText("account.keep_your_privacy")}
            </h3>
            <p>
              {uiText("account.your_email_phone_number_and_precise_location")}
            </p>
            <ButtonLink variant="ghost" href="/app/settings">
              {uiText("account.privacy_preferences")}
              <ArrowUpRight size={15} />
            </ButtonLink>
          </div>
          <div className="auth-demo-note">
            {uiText("account.fictional_profile_changes_are_held_in_memory")}
          </div>
        </aside>
      </div>
      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title={uiText("account.make_your_profile_a_little_more_you")}
        wide
      >
        <form onSubmit={handleSubmit(save)} noValidate>
          <div className="photo-upload">
            <Avatar profile={{ ...store.profile, photo }} size={80} />
            <div>
              <label className="btn btn-secondary">
                <Camera size={16} />
                {uiText("account.choose_photo")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      try {
                        setPhoto(await readPhoto(file));
                        setError("");
                      } catch (err) {
                        setError((err as Error).message);
                      }
                  }}
                />
              </label>
              <p className="small muted mt-2">
                {uiText("account.jpg_png_webp_max_5_mb")}
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>{uiText("account.display_name")}</span>
              <input {...register("name")} maxLength={40} />
              <FormError message={errors.name?.message} />
            </label>
            <label className="field">
              <span>{uiText("account.username")}</span>
              <input {...register("username")} maxLength={24} />
              <FormError message={errors.username?.message} />
            </label>
          </div>
          <Select
            label={uiText("account.country")}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.code}>{c.name}</option>
            ))}
          </Select>
          <label className="field">
            <span>{uiText("account.your_bio")}</span>
            <textarea {...register("bio")} rows={3} maxLength={240} />
            <FormError message={errors.bio?.message} />
          </label>
          <div className="field">
            <span>{uiText("account.languages")}</span>
            <ChipSelect
              options={languages}
              value={spoken}
              onChange={setSpoken}
            />
          </div>
          <div className="field">
            <span>{uiText("account.interests")}</span>
            <ChipSelect options={interests} value={likes} onChange={setLikes} />
          </div>
          <FormError message={error} />
          <div className="modal-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setEdit(false)}
            >
              {uiText("account.cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <Check size={16} />
              {uiText("account.save_profile")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
function SparkleIcon() {
  return <span className="profile-tip-star">✦</span>;
}
export function Settings() {
  const store = useApp();
  const router = useRouter();
  const [section, setSection] = useState("Account");
  const [logout, setLogout] = useState(false);
  const p = store.preferences;
  const change = (key: keyof typeof p, value: boolean | string) =>
    store.setPreferences((prev) => ({ ...prev, [key]: value }));
  const sections = [
    { name: "Account", icon: User },
    { name: "Discovery", icon: SlidersHorizontal },
    { name: "Privacy", icon: LockKeyhole },
    { name: "Notifications", icon: Bell },
    { name: uiText("account.sound_video"), icon: Wifi },
    { name: "Accessibility", icon: Accessibility },
  ];
  return (
    <div id="main-content">
      <PageHeader
        eyebrow={uiText("account.your_preferences")}
        {...copy.pages.settings}
      />
      <div className="settings-layout">
        <nav
          className="settings-nav"
          aria-label={uiText("account.settings_sections")}
        >
          {sections.map((s) => (
            <button
              key={s.name}
              className={section === s.name ? "active" : ""}
              onClick={() => setSection(s.name)}
            >
              <s.icon size={18} />
              {s.name}
            </button>
          ))}
          <button className="logout-link" onClick={() => setLogout(true)}>
            <LogOut size={18} />
            {uiText("account.log_out")}
          </button>
        </nav>
        <section className="settings-panel panel">
          <h2>
            {section === "Discovery"
              ? uiText("account.make_discovery_feel_like_you")
              : section === "Privacy"
                ? uiText("account.your_boundaries_matter")
                : section === "Account"
                  ? uiText("account.the_basics_all_in_one_place")
                  : section === "Notifications"
                    ? uiText("account.a_little_less_noise")
                    : section === uiText("account.sound_video")
                      ? uiText("account.connect_your_way")
                      : uiText("account.a_comfortable_experience")}
          </h2>
          <p className="muted">
            {uiText("account.harmless_interface_preferences_are_saved_on_this")}
          </p>
          {section === "Account" && (
            <>
              <div className="account-summary">
                <Avatar profile={store.profile} size={66} />
                <div>
                  <h3>{store.profile.name}</h3>
                  <p>@{store.profile.username}</p>
                </div>
                <ButtonLink variant="secondary" href="/app/profile">
                  <Edit3 size={15} />
                  {uiText("account.edit_profile")}
                </ButtonLink>
              </div>
              <div className="account-info-row">
                <span>{uiText("account.account_type")}</span>
                <strong>{uiText("account.fictional_demo_account")}</strong>
              </div>
              <div className="account-info-row">
                <span>{uiText("account.country")}</span>
                <strong>
                  {getCountry(store.profile.country)?.flag}{" "}
                  {store.profile.country}
                </strong>
              </div>
              <div className="account-info-row">
                <span>{uiText("account.email_phone")}</span>
                <strong>
                  {uiText("account.not_stored_in_this_prototype")}
                </strong>
              </div>
              <div className="account-info-row">
                <span>{uiText("account.authentication")}</span>
                <strong>{uiText("account.simulated_no_secure_session")}</strong>
              </div>
              <div className="auth-demo-note">
                <ShieldCheck size={18} />
                {uiText(
                  "account.password_changes_verification_account_deletion_and_security",
                )}
              </div>
              <Button variant="secondary" onClick={() => setLogout(true)}>
                <LogOut size={16} />
                {uiText("account.leave_the_demo")}
              </Button>
            </>
          )}
          {section === "Discovery" && (
            <>
              <Select
                label={uiText("account.preferred_language")}
                value={p.language}
                onChange={(e) => change("language", e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
              <Select
                label={uiText("account.preferred_country")}
                value={p.country}
                onChange={(e) => change("country", e.target.value)}
              >
                <option>{uiText("account.any_country")}</option>
                {countries.map((c) => (
                  <option key={c.code}>{c.name}</option>
                ))}
              </Select>
              <p className="small muted">
                {uiText(
                  "account.saved_as_interface_preferences_you_can_always",
                )}
              </p>
              <ButtonLink
                href={`/app/discover?language=${p.language}${p.country === uiText("account.any_country") ? "" : `&country=${encodeURIComponent(p.country)}`}`}
              >
                {uiText("account.explore_with_these_preferences")}
                <ArrowUpRight size={16} />
              </ButtonLink>
            </>
          )}
          {section === "Privacy" && (
            <>
              <Toggle
                label={uiText("account.show_my_online_status")}
                description={uiText(
                  "account.let_people_see_when_youre_open_to",
                )}
                checked={p.online}
                onChange={(v) => change("online", v)}
              />
              <Select
                label={uiText("account.who_can_send_friend_requests")}
                value={p.requests}
                onChange={(e) => change("requests", e.target.value)}
              >
                <option>{uiText("account.everyone")}</option>
                <option>{uiText("account.shared_interests_only")}</option>
                <option>{uiText("account.no_one")}</option>
              </Select>
              <Select
                label={uiText("account.who_can_message_me")}
                value={p.messages}
                onChange={(e) => change("messages", e.target.value)}
              >
                <option>{uiText("account.everyone")}</option>
                <option>{uiText("account.friends_only")}</option>
                <option>{uiText("account.no_one")}</option>
              </Select>
              <div className="account-info-row">
                <span>{uiText("account.blocked_users")}</span>
                <ButtonLink variant="ghost" href="/app/safety">
                  {uiText("account.manage")}
                  {store.blocked.length} {uiText("account.blocked_users_2")}
                  <ArrowUpRight size={15} />
                </ButtonLink>
              </div>
              <div className="auth-demo-note">
                {uiText(
                  "account.request_and_message_permissions_are_ui_previews",
                )}
              </div>
            </>
          )}
          {section === "Notifications" && (
            <>
              <Toggle
                label={uiText("account.inapp_notification_preference")}
                description={uiText(
                  "account.save_your_preference_for_the_future_live",
                )}
                checked={p.notifications}
                onChange={(v) => change("notifications", v)}
              />
              <div className="auth-demo-note">
                <Bell size={20} />
                {uiText(
                  "account.push_notifications_email_updates_and_sms_alerts",
                )}
              </div>
            </>
          )}
          {section === uiText("account.sound_video") && (
            <>
              <Toggle
                label={uiText("account.microphone_on_by_default")}
                description={uiText(
                  "account.default_microphone_toggle_in_the_simulated_call",
                )}
                checked={p.sounds}
                onChange={(v) => change("sounds", v)}
              />
              <Toggle
                label={uiText("account.camera_preview_on_by_default")}
                description={uiText(
                  "account.show_your_static_photo_in_the_simulated",
                )}
                checked={p.video}
                onChange={(v) => change("video", v)}
              />
              <Toggle
                label={uiText("account.data_saver_preference")}
                description={uiText(
                  "account.saved_for_future_media_streaming_this_prototype",
                )}
                checked={p.dataSaver}
                onChange={(v) => change("dataSaver", v)}
              />
            </>
          )}
          {section === "Accessibility" && (
            <>
              <Toggle
                label={uiText("account.reduce_motion")}
                description={uiText(
                  "account.disable_decorative_transitions_and_animations",
                )}
                checked={p.reducedMotion}
                onChange={(v) => change("reducedMotion", v)}
              />
              <Toggle
                label={uiText("account.stronger_contrast")}
                description={uiText(
                  "account.increase_text_and_border_contrast_on_light",
                )}
                checked={p.highContrast}
                onChange={(v) => change("highContrast", v)}
              />
              <div className="auth-demo-note">
                {uiText(
                  "account.keyboard_navigation_and_visible_focus_indicators_are",
                )}
              </div>
            </>
          )}
          <div className="settings-saved">
            <Check size={14} />
            {uiText("account.preferences_save_automatically_on_this_device")}
          </div>
        </section>
      </div>
      <Modal
        open={logout}
        onClose={() => setLogout(false)}
        title={uiText("account.see_you_around")}
      >
        <p>{uiText("account.this_will_leave_the_demo_and_return")}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setLogout(false)}>
            {uiText("account.stay_a_little_longer")}
          </Button>
          <Button
            onClick={async () => {
              await authService.logout();
              router.push("/login");
            }}
          >
            <LogOut size={16} />
            {uiText("account.leave_demo")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
