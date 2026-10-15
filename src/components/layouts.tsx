"use client";
import { text as uiText } from "@/config/brand";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Home,
  Compass,
  Shuffle,
  MessageCircle,
  Users,
  Bell,
  Settings,
  ShieldCheck,
  ArrowUpRight,
  Menu,
  X,
  Globe2,
  ChevronDown,
} from "lucide-react";
import { brand, copy, navigation } from "@/config/brand";
import { Avatar, ButtonLink, DemoNotice, Logo } from "./ui";
import { useApp } from "./provider";
const icons = {
  home: Home,
  compass: Compass,
  shuffle: Shuffle,
  message: MessageCircle,
  users: Users,
  bell: Bell,
};
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <div className="public-nav container">
        <Logo />
        <nav
          className={open ? "open" : ""}
          aria-label={uiText("layouts.main_navigation")}
        >
          <Link onClick={() => setOpen(false)} href="/app/discover">
            {copy.nav.discover}
          </Link>
          <Link onClick={() => setOpen(false)} href="/#how-it-works">
            {copy.nav.how}
          </Link>
          <Link onClick={() => setOpen(false)} href="/safety">
            {copy.nav.safety}
            <ShieldCheck size={14} />
          </Link>
        </nav>
        <div className="public-nav-actions">
          <Link className="login-link" href="/login">
            {copy.nav.login}
          </Link>
          <ButtonLink href="/register" variant="dark">
            {copy.nav.register}
            <ArrowUpRight size={16} />
          </ButtonLink>
        </div>
        <button
          className="mobile-menu icon-btn"
          aria-expanded={open}
          aria-label={uiText("layouts.toggle_navigation")}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Logo />
            <p>
              {brand.tagline}
              <br />
              {uiText("layouts.rooted_in_africa_open_to_the_world")}
            </p>
          </div>
          <div>
            <strong>{uiText("layouts.find_your_people")}</strong>
            <Link href="/app/discover">
              {uiText("layouts.discover_the_community")}
            </Link>
            <Link href="/app/match">
              {uiText("layouts.try_a_conversation")}
            </Link>
            <Link href="/register">
              {uiText("layouts.join")}
              {brand.name}
            </Link>
          </div>
          <div>
            <strong>{uiText("layouts.a_safer_space")}</strong>
            <Link href="/safety">{uiText("layouts.safety_center")}</Link>
            <Link href="/privacy">{uiText("layouts.privacy_policy")}</Link>
            <Link href="/terms">{uiText("layouts.terms_of_service")}</Link>
          </div>
          <div>
            <strong>{uiText("layouts.say_hello")}</strong>
            <a href={`mailto:${brand.contact}`}>
              {uiText("layouts.contact_us")}
              <ArrowUpRight size={13} />
            </a>
            <Link href="/admin">{uiText("layouts.development_dashboard")}</Link>
            <span className="adult-label">
              {uiText("layouts.18_adults_only")}
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.name}
            {uiText("layouts.made_for_meaningful_connections")}
          </span>
          <span>
            <Globe2 size={14} /> {uiText("layouts.africa_to_everywhere")}
          </span>
        </div>
        <p className="footer-demo">
          {uiText(
            "layouts.frontend_prototype_fictional_profiles_no_live_calls",
          )}
        </p>
      </div>
    </footer>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const store = useApp();
  const unread = store.conversations.reduce((sum, c) => sum + c.unread, 0);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <div className="sidebar-label">
          {uiText("layouts.your_little_world")}
        </div>
        <nav aria-label={uiText("layouts.application_navigation")}>
          {navigation.map((item) => {
            const Icon = icons[item.icon];
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.icon === "message" && unread > 0 && <b>{unread}</b>}
                {item.icon === "shuffle" && (
                  <span className="nav-new">{uiText("layouts.new")}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-promo">
            <div className="promo-orbit">
              <Globe2 size={28} />
              <span>✦</span>
            </div>
            <h3>{uiText("layouts.a_world_of_possibility")}</h3>
            <p>{uiText("layouts.your_next_great_conversation_is_one_hello")}</p>
            <Link href="/app/match">
              {uiText("layouts.lets_meet_someone")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <nav>
            <Link
              className={path === "/app/settings" ? "active" : ""}
              href="/app/settings"
            >
              <Settings size={19} />
              {uiText("layouts.settings")}
            </Link>
            <Link
              className={path === "/app/safety" ? "active" : ""}
              href="/app/safety"
            >
              <ShieldCheck size={19} />
              {uiText("layouts.safety_center")}
            </Link>
          </nav>
          <Link href="/app/profile" className="sidebar-profile">
            <Avatar
              profile={{ ...store.profile, online: store.preferences.online }}
              size={40}
            />
            <span>
              <strong>{store.profile.name}</strong>
              <small>{uiText("layouts.view_your_profile")}</small>
            </span>
            <ChevronDown size={16} />
          </Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div className="mobile-app-logo">
            <Logo compact />
          </div>
          <div className="breadcrumb">
            {uiText("layouts.your_community")}
            <span>/</span>{" "}
            {navigation.find((n) => n.href === path)?.label ||
              path.split("/").pop() ||
              "Overview"}
          </div>
          <div className="topbar-actions">
            <span className="live-status">
              <i />
              {uiText("layouts.good_people_online")}
            </span>
            <Link
              href="/app/notifications"
              className="notification-button icon-btn"
              aria-label={uiText("layouts.notifications")}
            >
              <Bell size={20} />
              {store.notifications.some((n) => !n.read) && <i />}
            </Link>
            <Link
              href="/app/settings"
              aria-label={uiText("layouts.settings")}
              className="icon-btn mobile-settings"
            >
              <Settings size={20} />
            </Link>
            <Link href="/app/profile" aria-label={uiText("layouts.my_profile")}>
              <Avatar
                profile={{ ...store.profile, online: store.preferences.online }}
                size={34}
              />
            </Link>
          </div>
        </header>
        <main className="app-content">
          <DemoNotice />
          {children}
        </main>
        <footer className="app-footer">
          <span>
            {brand.name} {uiText("layouts.good_people_real_connections")}
          </span>
          <Link href="/app/safety">
            <ShieldCheck size={13} />{" "}
            {uiText("layouts.your_safety_comes_first")}
          </Link>
        </footer>
      </div>
      <nav
        className="bottom-nav"
        aria-label={uiText("layouts.mobile_navigation")}
      >
        {navigation.slice(0, 5).map((item) => {
          const Icon = icons[item.icon];
          return (
            <Link
              key={item.href}
              className={path === item.href ? "active" : ""}
              href={item.href}
            >
              <Icon size={22} />
              <span>
                {item.icon === "compass"
                  ? "Discover"
                  : item.icon === "shuffle"
                    ? "Match"
                    : item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
