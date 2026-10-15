"use client";
import { text as uiText } from "@/config/brand";

import { Photo } from "./photo";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useId,
  type ReactNode,
  type ButtonHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import {
  ArrowUpRight,
  X,
  Search,
  ShieldCheck,
  Sparkles,
  Loader2,
  Globe2,
  Check,
  AlertCircle,
} from "lucide-react";
import { brand } from "@/config/brand";
import type { Profile } from "@/lib/types";
export function Logo({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`logo ${light ? "light" : ""}`}
      aria-label={`${brand.name} home`}
    >
      {brand.logo.asset ? (
        <Photo src={brand.logo.asset} alt="" width={34} height={34} />
      ) : (
        <span className="logo-mark" aria-hidden="true">
          <span />
          <span />
        </span>
      )}
      {!compact && <span>{brand.name}</span>}
    </Link>
  );
}
export function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`btn btn-${variant} ${className}`}
    >
      {loading && <Loader2 size={17} className="spin" />}
      {children}
    </button>
  );
}
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`btn btn-${variant} ${className}`}>
      {children}
    </Link>
  );
}
export function Avatar({
  profile,
  size = 44,
}: {
  profile: Pick<Profile, "photo" | "name" | "online">;
  size?: number;
}) {
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <Photo
        src={profile.photo}
        alt={profile.name}
        sizes={`${size}px`}
        width={size}
        height={size}
      />
      {profile.online && <i />}
    </span>
  );
}
export function Tag({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`tag ${className}`}>{children}</span>;
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function SectionTitle({
  title,
  subtitle,
  href,
  link = uiText("ui.view_all"),
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  link?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link href={href}>
          {link}
          <ArrowUpRight size={17} />
        </Link>
      )}
      {children}
    </div>
  );
}
export function EmptyState({
  title = uiText("ui.a_little_quiet_here"),
  description = uiText("ui.try_adjusting_your_filters_to_discover_more"),
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon || <Globe2 size={30} />}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = uiText("ui.search_people"),
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          aria-label={uiText("ui.clear_search")}
          onClick={() => onChange("")}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} aria-label={label} {...props}>
        {children}
      </select>
    </label>
  );
}
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <div>
        <strong>{label}</strong>
        {description && <p>{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focus = () =>
      ref.current
        ?.querySelector<HTMLElement>("button,input,select,textarea,a[href]")
        ?.focus();
    focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const list = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex="0"]',
        );
        if (!list?.length) return;
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-btn"
            aria-label={uiText("ui.close_dialog")}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function DemoNotice({ admin = false }: { admin?: boolean }) {
  return (
    <div className={`demo-notice ${admin ? "admin-notice" : ""}`}>
      <ShieldCheck size={17} />
      <span>
        {admin
          ? uiText("ui.development_only_no_admin_authentication_or_permissions")
          : uiText("ui.youre_exploring_a_demo_connections_calls_and")}
      </span>
      <span className="demo-tag">{admin ? "DEV ONLY" : "PREVIEW"}</span>
    </div>
  );
}
export function FormError({ message }: { message?: string }) {
  return message ? (
    <p className="form-error" role="alert">
      <AlertCircle size={14} />
      {message}
    </p>
  ) : null;
}
export function SkeletonCards() {
  return (
    <div
      className="profile-grid"
      aria-label={uiText("ui.loading_profiles")}
      role="status"
    >
      {[1, 2, 3, 4].map((i) => (
        <div className="skeleton-card" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="chip-group">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`chip ${value.includes(option) ? "selected" : ""}`}
          aria-pressed={value.includes(option)}
          onClick={() =>
            onChange(
              value.includes(option)
                ? value.filter((v) => v !== option)
                : [...value, option],
            )
          }
        >
          {value.includes(option) && <Check size={14} />} {option}
        </button>
      ))}
    </div>
  );
}
export function SparkleLabel({ children }: { children: ReactNode }) {
  return (
    <span className="sparkle-label">
      <Sparkles size={14} />
      {children}
    </span>
  );
}
