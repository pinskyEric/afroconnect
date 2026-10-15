# Frontend architecture

## Structure

```text
src/
  app/                      Next.js App Router, metadata, manifest, global styles
    page.tsx                Public landing
    [page]/page.tsx          Public account/legal/safety/onboarding route dispatcher
    app/[[...section]]/      Application route dispatcher + shared shell
    admin/                  Development-only admin
    offline/                Offline fallback design
  components/
    ui.tsx                  Buttons, dialogs, fields, toggles, avatars, tags, states
    photo.tsx               Local responsive WebP sources
    layouts.tsx             Public header/footer, desktop sidebar, mobile bottom nav
    provider.tsx            Session-scoped mock state and domain action orchestration
    landing.tsx             Marketing content and previews
    auth.tsx                Login/register/recovery and seven-step onboarding
    discovery.tsx           Dashboard and combined discovery filtering
    profile-card.tsx        Shared profile cards and profile dialogs
    matching.tsx            Matching/call state machine
    social.tsx              Conversations, friends, notifications
    account.tsx             Editable profile and settings
    safety.tsx              Shared report form and safety center
    admin.tsx               Mock operations dashboard
  config/                   Central product, copy and decorative design configuration
  lib/                      Domain types, seed fixtures, validation utilities
  services/                 Service contracts, mock implementations, composition root
public/                     Bundled portraits, WebP derivatives, fonts, license texts, icons
scripts/                    One-time editorial copy migration utility
 tests/                     Node unit tests and Playwright browser tests
```

## Rendering and routing

Server components resolve route parameters and render client domain components. No database, server action or API handler exists. The route dispatchers deliberately use explicit allowlists and return `notFound()` for unsupported paths. Client components using URL search parameters sit inside Suspense boundaries.

One root `AppProvider` retains demo state across client-side navigation. A full document reload resets social data. Public account modes use distinct React keys so state and validation do not leak between login, registration and recovery.

## Data flow

```text
Interaction → component / validated form → typed service
                                      → provider state update
                                      → all subscribed screens
```

Services expose async contracts and return typed data. They intentionally do not pretend to perform secure authentication or network delivery. The mock provider is the session state owner, initialized from the fixture module. When integrating Laravel, replace its fixture initialization with service hydration/loading/error handling and keep existing component contracts.

Domain features are split across modules rather than placed in one page component. `src/services/index.ts` is the adapter composition root. No UI component imports the mock service implementation directly.

## Design system

Semantic colors, font families, scales and brand identity live in `brand.ts`. The root layout exposes CSS custom properties from brand configuration and the decorative palette. Reusable classes specify button variants (`primary`, `secondary`, `dark`, `ghost`, `danger`), field sizing, cards, tags, skeletons, online statuses and dialogs. Tailwind utilities supply local spacing and layout adjustments. Fonts are local variable WOFF2 assets with `font-display: swap`.

`content.en.json` is the typed static copy catalog accessed through `uiText`, with stable semantic keys. Dynamic profile data is not mixed with marketing copy. Dynamic sentences still interpolate local data in their feature modules. This is a rewording foundation, not a completed multi-locale translation system.

Breakpoints cover large desktop, laptop, tablet, 760px mobile, and small 430px handsets. Mobile uses reachable bottom navigation, a list/detail inbox, single-column matching controls, scrollable tabs and safe-area padding. Admin tables intentionally scroll inside their own container rather than the document.

## Accessibility and performance

- Skip link, semantic headings, native controls, explicit accessible names and visible focus rings.
- Dialog Escape handling, focus trap/restoration, backdrop dismissal and scroll lock.
- Switch state via `aria-checked`; profile favorites/chips via `aria-pressed`.
- Form errors use `role=alert`; toast feedback uses `role=status`.
- Color-contrast tuning verified with axe; reduced motion respects system preference and local override.
- Local WebP at 96 / 350 / 700 pixels, responsive `srcset`/`sizes`, lazy-loaded profile imagery.
- No CDN scripts, external fonts, remote avatar calls, analytics, or media-device permission requests.
- Root preferences load safely after hydration and storage exceptions fall back to memory.
- Async matching uses an operation token to invalidate cancelled or stale searches. The timer cleans up on exit.

## Security boundary

There is intentionally no secure session, middleware gate, role enforcement, CSRF protection or admin authorization. Static route visibility is not security. All of these require a separate backend. Reports never leave memory and UI blocking is not a promise of real protection.

## PWA boundary

Manifest, theme colors, local icons, standalone layout and `/offline` are preparation only. No service worker intercepts navigation and no offline caching, synchronization, install prompt or push transport is implemented. Add a reviewed caching strategy after the API/security design is agreed.
