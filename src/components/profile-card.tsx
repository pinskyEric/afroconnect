"use client";
import { text as uiText } from "@/config/brand";

import { Photo } from "./photo";
import { useState } from "react";
import {
  Heart,
  ArrowUpRight,
  UserPlus,
  MessageCircle,
  Flag,
  Ban,
  Check,
  Globe2,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { getCountry } from "@/lib/data";
import { useApp } from "./provider";
import { Button, ButtonLink, Modal, Tag } from "./ui";
export function ProfileCard({
  profile,
  compact = false,
}: {
  profile: Profile;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const store = useApp();
  const country = getCountry(profile.country);
  return (
    <>
      <article className={`profile-card ${compact ? "compact" : ""}`}>
        <button
          className="profile-photo"
          onClick={() => setOpen(true)}
          aria-label={`View ${profile.name}’s profile`}
        >
          <Photo
            src={profile.photo}
            alt={`Fictional profile: ${profile.name}`}
            width={350}
            height={400}
            loading="lazy"
          />
          <span className={`online-badge ${profile.online ? "" : "offline"}`}>
            <i />
            {profile.online
              ? uiText("profilecard.online_now")
              : uiText("profilecard.recently_active")}
          </span>
          <span className="photo-open">
            <ArrowUpRight size={19} />
          </span>
        </button>
        <button
          className={`save-profile ${store.saved.includes(profile.id) ? "saved" : ""}`}
          onClick={() => store.toggleSave(profile.id)}
          aria-label={`${store.saved.includes(profile.id) ? "Unsave" : "Save"} ${profile.name}`}
          aria-pressed={store.saved.includes(profile.id)}
        >
          <Heart
            size={17}
            fill={store.saved.includes(profile.id) ? "currentColor" : "none"}
          />
        </button>
        <div className="profile-card-body">
          <div className="profile-name">
            <button onClick={() => setOpen(true)}>
              {profile.name}
              <span>, {profile.age}</span>
            </button>
            <span title={profile.country}>{country?.flag}</span>
          </div>
          <p className="profile-location">
            {profile.country}
            <span>·</span>
            {profile.languages[0]}
          </p>
          {!compact && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-tags">
            {profile.interests.slice(0, 2).map((i) => (
              <Tag key={i}>{i}</Tag>
            ))}
          </div>
          {!compact && (
            <Button
              variant="secondary"
              className="full-width"
              onClick={() => store.requestFriend(profile.id)}
              disabled={
                store.friends.includes(profile.id) ||
                store.requests.some((r) => r.userId === profile.id)
              }
            >
              {store.friends.includes(profile.id) ? (
                <>
                  <Check size={16} />
                  {uiText("profilecard.friends")}
                </>
              ) : store.requests.some((r) => r.userId === profile.id) ? (
                uiText("profilecard.request_pending")
              ) : (
                <>
                  <UserPlus size={16} />
                  {uiText("profilecard.connect")}
                </>
              )}
            </Button>
          )}
        </div>
      </article>
      <ProfileModal
        profile={profile}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
export function ProfileModal({
  profile,
  open,
  onClose,
}: {
  profile: Profile;
  open: boolean;
  onClose: () => void;
}) {
  const store = useApp();
  return (
    <Modal open={open} onClose={onClose} title={`Meet ${profile.name}`}>
      <div className="profile-modal-image">
        <Photo src={profile.photo} alt={profile.name} />
        <span className="online-badge">
          <i />
          {profile.online ? uiText("profilecard.online_now") : "Offline"}
        </span>
      </div>
      <h2 className="mt-5">
        {profile.name}, {profile.age}{" "}
        <span className="flag">{getCountry(profile.country)?.flag}</span>
      </h2>
      <p className="muted">
        @{profile.username} · {profile.country}
      </p>
      <p className="bio-text">{profile.bio}</p>
      <div className="detail-line">
        <Globe2 size={17} />
        {profile.languages.join(" · ")}
      </div>
      <div className="profile-tags">
        {profile.interests.map((i) => (
          <Tag key={i}>{i}</Tag>
        ))}
      </div>
      <p className="muted small mt-4">
        {profile.friends} {uiText("profilecard.friends_fictional_demo_profile")}
      </p>
      <div className="modal-actions">
        <Button
          onClick={() => store.requestFriend(profile.id)}
          disabled={
            store.friends.includes(profile.id) ||
            store.requests.some((r) => r.userId === profile.id)
          }
        >
          <UserPlus size={17} />
          {store.friends.includes(profile.id)
            ? uiText("profilecard.already_friends")
            : store.requests.some((r) => r.userId === profile.id)
              ? uiText("profilecard.request_pending")
              : uiText("profilecard.add_friend")}
        </Button>
        <ButtonLink
          variant="secondary"
          href={`/app/messages?user=${profile.id}`}
        >
          <MessageCircle size={17} />
          {uiText("profilecard.say_hello")}
        </ButtonLink>
      </div>
      <div className="profile-safety-links">
        <ButtonLink variant="ghost" href={`/app/safety?report=${profile.id}`}>
          <Flag size={14} />
          {uiText("profilecard.report")}
        </ButtonLink>
        <Button
          variant="ghost"
          onClick={async () => {
            await store.blockUser(profile.id);
            onClose();
          }}
        >
          <Ban size={14} />
          {uiText("profilecard.block_user")}
        </Button>
      </div>
    </Modal>
  );
}
