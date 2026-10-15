# AfriConnect — frontend prototype

An Africa-first, adults-only social discovery experience, built with **Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, React Hook Form, and Zod**. Warm off-white surfaces, expressive portraits, and a violet identity carry across the marketing site and application.

> **Frontend only.** All profiles, accounts, matches, video calls, messages, and moderation actions are fictional. No real authentication, delivery, camera access, payments, database, API, or moderation service exists. Do not enter real personal information or reuse a real password.

## Run locally

Use Node.js 20.9+ (Node 22 LTS recommended) and npm.

```bash
npm ci
npm run dev
```

Open **http://localhost:3000**. No environment variables, API keys, paid services, or external runtime dependencies are required. The server binds to `0.0.0.0` for shared preview environments.

For an optimized preview:

```bash
npm run build
npm run start
```

This is the standard Next.js frontend rendering server, not a business backend. There are no API route handlers, server actions, database connections, or infrastructure services.

## What you can explore

- **Landing:** hero, profile previews, country/language/interest discovery links, how it works, simulated call preview, safety, mobile benefits, FAQs, legal/contact footer.
- **Account entry:** validated login, registration, password visibility, recovery preview, adult eligibility and consent, seven-step onboarding with photo preview.
- **Dashboard:** personalized greeting, online toggle, discovery recommendations and quick filters, recent matches, friend requests, unread messages and notifications.
- **Discovery:** combined country, region, language, interest, online and name/bio search filters; favorites; profile dialogs; friend requests; skeleton and empty states.
- **Matching:** preferences, video/text modes, cancellable search, match acceptance, skip/next, no-match and failure scenarios. Static-photo call stage, camera/mic toggles, timer, chat, report, emergency disconnect/block.
- **Messaging:** searchable conversation list, unread counts, deep-linked recipients, sent bubbles, mobile list/detail navigation, empty states. Messages are local only.
- **Friends:** existing, incoming, outgoing, accept, decline, cancel, remove confirmation, profile dialogs and conversation links.
- **Profile:** editable name, username, country, languages, interests, bio, and validated local image preview. No public email, phone, or precise location.
- **Notifications:** six categories, individual read actions, mark all, unread filter and caught-up state.
- **Settings:** account, discovery, privacy, notification, sound/video, data saver, motion, contrast and logout preview.
- **Safety:** guidelines, 18+ policy, all nine report categories, validated reporting, blocked list, block/unblock confirmation, harassment/scam and privacy guidance.
- **Admin:** obvious development-only notice, seven mock metrics, report review/resolution, user search/status filtering, suspend/ban/restore confirmation, local activity.
- **PWA preparation:** generated manifest, local 192/512 icons, theme colors, safe-area-aware bottom navigation, and `/offline` fallback design. No service worker, push notifications, or offline sync is claimed.

## Routes

Public: `/`, `/login`, `/register`, `/forgot-password`, `/terms`, `/privacy`, `/safety`.

Demo application: `/app`, `/app/discover`, `/app/match`, `/app/messages`, `/app/friends`, `/app/notifications`, `/app/profile`, `/app/settings`, `/app/safety`.

Additional: `/onboarding`, `/admin`, `/offline`, and a designed 404.

The demo application and admin routes are intentionally accessible without authentication. They are **not secure access controls**.

## Quick test scenarios

1. Select **Explore the Platform** to skip account entry and open the seeded Alex profile.
2. Register with `alex@example.com` and any fictional password of at least eight characters. Complete the seven onboarding steps. Dates younger than 18 cannot continue.
3. Log in with `error@demo.test` to preview the simulated authentication error. Other valid fictional identities succeed.
4. In discovery, combine `Uganda` with `English`, save Amina, open her profile, and try the favorites filter.
5. In matching, open **Developer preview controls** to select normal, no-match, or connection-failure behavior.
6. Accept a friend request, send a message, or mark notifications read. Navigate within the app to see state shared between pages.
7. Report a fictional user. A notice explicitly confirms that no moderation team is contacted.

## State and privacy boundaries

**Memory only:** fictional profile changes/photos, friend relationships, outgoing messages, favorites, notifications, reports, blocks, admin status and call state. Full reload resets these. Navigation through Next links retains the provider state.

**Local storage:** only whitelisted, harmless UI preferences under `africonnect-ui`. No password, identity, auth token, date of birth, chat text, report, or uploaded image is stored there. No camera or microphone browser permissions are requested.

Privacy permissions, notification preference, and data saver are saved UI previews; actual enforcement and streaming need backend work. Motion/contrast, online badge, discovery preference links and initial call toggles have visible local effects.

## Rebrand and maintain

The **`src/config/`** directory is the central configuration area:

- `brand.ts`: name, brand colors, typography, spacing/radius/shadow scales, navigation, hero, page headings, FAQs, and the typed copy accessor.
- `content.en.json`: central catalog of static page copy, accessible labels, validation, and demo messages. Edit values, not stable keys. Product-name mentions are replaced through the brand accessor.
- `palette.json`: decorative shades/alpha colors referenced by CSS custom properties; includes contrast-adjusted foreground tones.

`src/components/ui.tsx` contains the shared CSS placeholder logo. Replace its mark or supply a brand asset when the final identity is chosen; regenerate the icon files to match. Profile fixtures and their bios live in `src/lib/data.ts`, separate from editorial copy. Data-dependent sentences remain composed in their domain components.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build

# Browser tests: start the app in another terminal first.
npx playwright install --with-deps chromium
npm run test:e2e
```

The test suite covers all 19 meaningful routes, desktop/mobile overflow, core social flows, onboarding, error scenarios, preference persistence, and accessibility checks. See `docs/frontend-testing-checklist.md` for the recorded scope and manual follow-up.

`npm run format` formats the source, tests and documentation.

### Known limitations / follow-up

- No backend features or real security; no age verification, delivery, moderation, payments, media streaming or account persistence.
- Terms, privacy, contact address, and app icons are development placeholders. Stock-photo subjects are not actual members and do not endorse this product.
- Automated Chromium viewport checks do not replace physical iOS/Android testing or a full assistive-technology review.
- At verification, the **production dependency audit is clean**. The full developer-tool audit reports seven inherited high-severity findings from the unpatched `braces@3.0.3` stack-exhaustion advisory through Tailwind 3 / ESLint's glob tooling. Do not process untrusted glob patterns; review a coordinated toolchain upgrade before launch. This is documented rather than hidden with a breaking `audit fix --force`.

## Documentation

- [Frontend architecture](docs/frontend-architecture.md)
- [Routes and pages](docs/routes-and-pages.md)
- [Mock data and services](docs/mock-data-and-services.md)
- [Laravel integration plan](docs/backend-integration-plan.md)
- [Testing checklist](docs/frontend-testing-checklist.md)
- [Asset provenance](docs/assets.md)

**Recommended next phase:** agree the Laravel REST contracts and authentication/authorization design; replace adapters at `src/services/index.ts`; add secure provider hydration, moderation and age-assurance policies; then integrate real-time messaging and media as separate, explicitly scoped work.
