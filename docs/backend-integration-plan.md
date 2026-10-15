# Future Laravel integration plan — not implemented

No Laravel code, databases, migrations, Redis, WebSocket infrastructure, WebRTC servers, or API keys are included.

## 1. Agree contracts before connecting

Use versioned REST resources and ISO timestamps. Keep public `Profile` fields separate from private account data. Standardize pagination, validation errors, request IDs and `401/403/409/422/429/5xx` handling. Validate server responses at adapter boundaries and translate DTOs to the existing frontend types.

Suggested endpoints (proposals only):

| Frontend domain | Proposed REST resources                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Auth            | `POST /api/v1/auth/register`, `login`, `logout`, `password/forgot`, `password/reset`; `GET /api/v1/me` |
| Profile         | `GET/PATCH /api/v1/me/profile`; presigned or validated photo-upload workflow                           |
| Discovery       | `GET /api/v1/profiles?country=&region=&language=&interest=&online=&search=&cursor=`                    |
| Matchmaking     | `POST /api/v1/matchmaking/search`; accept, skip and cancel resources                                   |
| Friends         | `/api/v1/friends`, `/api/v1/friend-requests`; accept, decline, cancel, remove                          |
| Messaging       | `/api/v1/conversations`, `/conversations/{id}/messages`; cursor pagination and idempotency             |
| Notifications   | `/api/v1/notifications`; single and bulk read actions                                                  |
| Safety          | `/api/v1/reports`, `/api/v1/blocks`; controlled unblock                                                |
| Preferences     | `GET/PATCH /api/v1/me/preferences`                                                                     |
| Admin           | `/api/v1/admin/users`, `/reports`, `/activity`, `/stats`; server-enforced moderation actions           |

## 2. Replace services, not screens

Create implementations matching `src/services/interfaces.ts` and select them in `src/services/index.ts`. Introduce a small typed HTTP client, use relative same-origin URLs, pass cancellation signals, and normalize errors. Do not put fetch calls throughout cards and forms.

Replace the provider's fixture initialization with async hydration from service list/get methods. Preserve the provider's public actions while adding loading/error/retry, server reconciliation and optimistic rollback. Replace local catalog profile lookup with a hydrated public-profile map. Add pagination for real datasets rather than loading everyone into the browser.

The mock outcome argument is a development fixture. A production matchmaking adapter must ignore or remove developer controls and rely only on server eligibility. Shared country/language catalogs can remain static until the backend owns them.

## 3. Authentication and authorization

Choose Laravel Sanctum or another reviewed first-party session approach appropriate for the final deployment. Prefer secure HttpOnly cookies with correct SameSite, CSRF, CORS and origin controls. Never store bearer tokens or passwords in localStorage. Add server-side age assurance, email/phone verification, reset flows, rate limits and session expiry/revocation.

Protect every resource by server authorization policies. Frontend route redirects improve UX but do not protect APIs. `/admin` is intentionally public today: remove all fixture data and add server-enforced role/permission checks and audit logging before exposing real operations.

## 4. Safety and privacy before media

Enforce blocks and message/request permissions on every applicable server action. Prevent contact through discovery, matching and conversations when blocked. Design report acknowledgement, retention, evidence access, appeals and moderator escalation. Require server-side file validation, image sanitization, quotas, content review, and secure object storage for uploads.

Review underage risk, harassment/scams, country-specific legal obligations, privacy rights and emergency guidance with qualified specialists. Replace legal placeholders and the `.example` contact address. Do not collect identity documents through this prototype.

## 5. Real-time messaging and calls are separate milestones

Design delivery state, idempotent sends, unread consistency, reconnect behavior and pagination first. Add a selected real-time transport later, with authenticated channels and authorization. No transport is assumed by this frontend.

For calls, scope consent, camera/mic permission handling, device selection, signaling, TURN/STUN, connectivity failures, bandwidth adaptation, abuse mitigation and disconnect cleanup. Remove simulated labels only when end-to-end behavior is actually implemented and verified. Do not treat the static-photo timer as a real media session.

## 6. Deployment and PWA

Adopt TLS, CSP, logging/monitoring, dependency scanning, privacy-aware analytics if chosen, and reviewed secrets handling. Revisit the toolchain's inherited development `braces` advisory before launch. Implement service-worker caching only with an explicit policy that avoids caching private API responses or sensitive conversation data. Treat push notifications and offline synchronization as separate features requiring consent, backend transport, and conflict handling.

## Acceptance gates

Contract tests against Laravel; server authorization and abuse tests; browser tests on real Android/iPhone devices; assistive-technology review; privacy/legal approval; load/latency testing from target African networks; security review before removing development notices.
