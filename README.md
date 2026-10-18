# AfriConnect — frontend and Laravel-connected prototype

An Africa-first, adults-only social discovery experience built with **Next.js, React, TypeScript, Tailwind CSS, Lucide, React Hook Form, and Zod**. The visual system uses deep teal, warm gold, soft neutrals, Manrope headings, and DM Sans body text.

> **Development status, not production-ready.** The UI can run against fictional mock services or a Laravel API adapter. In mock mode, accounts, messages, reports, matches, and moderation actions are simulated. API mode uses Laravel/Sanctum cookies when configured, but has not been validated against live services in this workspace. Do not enter real personal data or reuse a real password.

## Run locally

Use Node.js 20.9+ (Node 22 LTS recommended) and npm.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Without `NEXT_PUBLIC_API_BASE_URL`, the composition root uses mock services. The Next server binds to `0.0.0.0` for shared previews.

To configure the sibling Laravel backend, copy `.env.example` to `.env.local`. The example uses a same-origin `/api/v1` path and a **server-only** Next.js rewrite target so browser requests do not call a user's `localhost`:

```bash
cp .env.example .env.local
# Local backend target defaults to http://localhost:8000; set public Reverb host/port for your environment.
# Never put secrets or private TURN credentials in NEXT_PUBLIC_*.
npm run dev
```

For deployment, point `AFRICONNECT_API_PROXY_TARGET` to the trusted backend reachable by the Next server, or set `NEXT_PUBLIC_API_BASE_URL` to a reachable HTTPS API origin. Set `NEXT_PUBLIC_REVERB_HOST/PORT/SCHEME` to an externally reachable Reverb endpoint (the websocket is not covered by the HTTP rewrite). The Laravel adapter uses Sanctum stateful cookies, CSRF protection, and `credentials: include`; it does not store bearer tokens in browser storage. Configure Sanctum stateful domains, cookie domain, HTTPS, and Reverb origin settings in the backend. See `/home/user/africonnect-backend/README.md` and its `docs/API.md`. **A local API setting is not evidence of a successful backend connection.** `NEXT_PUBLIC_SERVICE_ADAPTER=mock` explicitly forces mock mode.

For an optimized preview:

```bash
npm run build
npm run start
```

This is the Next.js frontend server. Business data, auth, and authorization belong to the Laravel backend, not this browser application.

## What is implemented

- Responsive landing, registration/login, seven-step onboarding, discovery, profiles, friends, messaging, notifications, settings, safety, and admin demonstration screens.
- A documented mock adapter and a Laravel API adapter for authentication, profiles/preferences, discovery/favorites, matchmaking queue polling, call lifecycle/signaling/ICE configuration, conversations/messages, friends, notifications, reports/blocks, account export/deletion, appeals, and moderation APIs.
- A Laravel Echo/Pusher-protocol Reverb subscription adapter wired to active-session hydration and conversation-generation updates. **Live Reverb, CSRF/CORS, reconnect behavior, and event reconciliation are unverified; treat realtime delivery as unavailable until tested.**
- Local display preferences only under `africonnect-ui`. No password, auth token, DOB, chat text, reports, or uploaded photos are persisted in local storage.
- Fictional demo profiles and photos are not actual users or endorsers. The asset register records image source IDs; rights, model releases, and product-context suitability still need review.

## Routes and demo boundaries

Public: `/`, `/login`, `/register`, `/forgot-password`, `/terms`, `/privacy`, `/safety`.

Application: `/app`, `/app/discover`, `/app/match`, `/app/messages`, `/app/friends`, `/app/notifications`, `/app/profile`, `/app/settings`, `/app/safety`, `/onboarding`.

Additional: `/admin`, `/offline`, and a designed 404. The mock admin route is intentionally not an access-control boundary. Real moderation requires an authenticated backend moderator role; the backend rejects ordinary accounts. The present frontend admin screen is primarily a mock-data view, not a verified live moderation console.

## Service and product boundaries

- **Accounts/persistence:** Laravel has registration, Sanctum session/token flows, profiles, preferences, and server authorization. The UI wires registration/login, server-side DOB submission during onboarding, active-session hydration, persistent preferences, and account services. Provider/social collection hydration and cookie/CORS behavior have not been validated against a live backend. A working login screen does not prove production auth.
- **Age:** date of birth is only a self-asserted 18+ eligibility input. It is not age or identity verification. Any age-assurance method/vendor requires owner, privacy, and jurisdiction review; do not collect identity documents without a reviewed need and safe retention plan.
- **Messages/notifications:** Laravel persists messages and notifications and can dispatch queued Reverb broadcasts. Queue retries/reconciliation during Redis outages and real-time client delivery remain unverified. Do not promise reliable delivery until operational monitoring, retry, and recovery behavior are tested.
- **Calls:** Laravel only authorizes call lifecycle/signaling and returns ICE configuration. The frontend adapter exposes these endpoints, but the matching screen still uses a static-photo preview and has not wired an end-to-end match-acceptance/call/offer-answer-ICE flow or browser `RTCPeerConnection`. A properly operated TURN service with short-lived credentials is required for reliable connectivity. No audio/video media is relayed by Laravel.
- **Moderation:** backend report/block/status/appeal routes and role/audit enforcement exist in source. In API mode the admin screen fetches reports/users and submits status actions with a reason and report decisions with notes; it displays API errors. Mock mode remains fictional. Live moderator authorization, deployment, staffing, response SLAs, escalation, appeals operations, and real abuse-case exercises remain launch gates.
- **Payments:** no payment provider or live payment flow is selected or enabled. Verify target markets, provider availability, settlement/currency, fees, taxes, merchant/KYC requirements, refunds, and sandbox access before designing this feature. Do not use live credentials.
- **Password reset:** backend recovery is email-only. Phone identities do not have a verified SMS reset channel.
- **Data deletion/retention:** backend export/deletion and case-retention mechanisms exist. The current 365-day moderation/audit retention default is proposed and needs owner/privacy/legal approval before production.
- **Legal copy:** `/terms` and `/privacy` remain development placeholders. Do not publish them as binding legal terms or privacy promises.

## Required owner and legal-review inputs

Before public launch, the product owner/legal counsel must provide or approve: legal operating entity and jurisdiction(s); service operator name and verified contact/address; support and safety escalation contacts; intended age policy and country availability; final terms/privacy/community-guideline text; lawful bases, purposes, processors, international transfers, retention schedule and deletion exceptions; complaint/appeal handling and response targets; photo/media rights and model releases; and any age-assurance design. These details are deliberately not invented here.

## Assets

`docs/assets.md` records local fonts and stock-image source IDs. It is **provenance, not a completed license or model-release review**. Confirm each image's current license, attribution requirements, commercial/product context and release status, or replace it with owned/licensed assets. The UI logo/icons remain placeholders; confirm icon/font licenses before release. Demo images must remain explicitly fictional and must not imply depicted people are members or endorsers.

## Checks

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev
npm audit
```

Browser checks (start the frontend in another terminal first):

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

`docs/frontend-testing-checklist.md` records historical automated checks and follow-up work. Earlier 12/12 unit tests, Chromium route/viewport sweeps, accessibility scans, lint/typecheck/build were run before the newest adapter and toolchain changes. Rerun them after `npm ci`; do not treat historical results as current verification. Physical Android/iOS and assistive-technology checks have not been completed.

### Current dependency audit and upgrade status

A coordinated frontend toolchain update moved Tailwind CSS to v4 and updated Next.js and `eslint-config-next` together; it was **not** done with `npm audit fix --force`. The latest recorded full-tree audit still has **5 high developer-tool findings** in the Next ESLint plugin's `fast-glob` → `micromatch` → `braces` chain; npm currently lists `braces@3.0.3` as the latest available release, and its advisory has no patched release available in the registry used here. This is a tooling risk, not a claim of zero risk; keep lint/build tooling off untrusted patterns and recheck the upstream advisory before release. The production-only audit must be rerun and its result recorded after the final lockfile install.

## Exact local backend commands

From `/home/user/africonnect-backend`, after installing PHP/Composer dependencies and Docker Compose v2:

```bash
cp .env.example .env
composer install
php artisan key:generate
docker compose config
docker compose up -d
# Create the MinIO bucket in its console, then:
php artisan migrate --seed
php artisan route:list
php artisan test
php vendor/bin/pint
```

See the backend README for separate web, queue, scheduler, and Reverb processes. PostgreSQL, Redis, Reverb, S3/MinIO, TURN, and Docker runtime behavior must be validated in a configured environment; those live integrations were not available for this inspection.

## Documentation

- [Frontend architecture](docs/frontend-architecture.md)
- [Routes and pages](docs/routes-and-pages.md)
- [Mock data and services](docs/mock-data-and-services.md)
- [Laravel integration plan](docs/backend-integration-plan.md)
- [Testing checklist](docs/frontend-testing-checklist.md)
- [Asset provenance](docs/assets.md)
