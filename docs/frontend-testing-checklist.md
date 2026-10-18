# Frontend testing checklist

## Commands

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run start                     # leave running in a separate terminal
npx playwright install --with-deps chromium
npm run test:e2e
npm audit --omit=dev
```

Set `TEST_BASE_URL` if the frontend runs somewhere other than `http://localhost:3000`. The browser tests never need real credentials or external services. Tests create isolated browser contexts and reset mock state through document navigation.

## Recorded verification

Historical visual/automated review: 14 October 2026. Reverification after the 19 October API, admin, appeal, Tailwind 4, and Next.js patch updates is required. Current checks completed on 19 October 2026 are listed below; prior Chromium counts are not treated as current.

| Check                                  | Result                                                |
| -------------------------------------- | ----------------------------------------------------- |
| Production build                       | Passed                                                |
| TypeScript strict check                | Passed                                                |
| ESLint (zero warnings)                 | Passed                                                |
| Unit tests                             | 12 / 12 passed                                        |
| Chromium browser tests                 | 15 / 15 passed                                        |
| Automated axe WCAG A/AA                | No detected violations across 19 initial route states |
| Mobile route sweep at 390px            | 19 / 19 without document overflow                     |
| Additional 360px, 768px, 1024px sweeps | 57 route/viewport combinations without overflow       |
| Additional console/runtime-error sweep | No detected errors                                    |
| Production npm audit                   | Zero reported vulnerabilities                         |
| Full developer-tool npm audit          | Seven inherited high findings, documented below       |

## Automated coverage

### TypeScript and ESLint

- Strict TypeScript checks for models, service implementations, route props, forms, and components.
- ESLint with Next core web vitals and TypeScript configuration; warnings fail linting.
- Optimized production build including all page dispatchers and the manifest.

### Unit tests (`tests/core.test.ts`)

12 tests covering fixture adult eligibility/country integrity, unique IDs, combined discovery filters, empty searches, date-of-birth birthday boundaries, identity format, password/profile validation, required registration consent, simulated authentication success/failure, local messages, local reports/categories, and normal/empty/failure matching outcomes.

### Browser tests (`tests/e2e/`)

15 browser checks, including grouped route sweeps:

- Every one of the 19 meaningful routes returns HTTP 200, renders a heading, and has no detected broken local images or runtime page errors.
- Every route fits a 390 × 844 viewport without document-level horizontal overflow; mobile bottom navigation is visible.
- Registration validation, password visibility, adult age gate and all seven onboarding steps.
- Simulated login error and honest recovery success through client-side route navigation.
- Combined discovery filters, favorites, profile modal dismissal and outgoing friend request.
- Cancellable matching, acceptance, mic/camera toggle states, call chat and end-call.
- Explicit no-match and simulated connection-error states.
- New local outgoing messages, conversation search and empty search state.
- Friend acceptance and removal confirmation.
- Mark-all notification read state and caught-up view.
- Profile edit, preference persistence across reload, no password/token in local storage.
- Report validation/success, block/unblock, mock admin resolve and suspend actions.
- Image type rejection and PNG preview, keyboard modal focus trap, focus retention after chip updates and focus restoration after Escape.
- Emergency disconnect/block and exclusion of the matched person from discovery.
- Automated axe WCAG 2 A/AA and 2.1 AA checks across all 19 routes in their initial states.

## Visual review

Reviewed desktop 1440 × 1000 and mobile 390 × 844 renderings of the landing and application layouts. Responsive rules also target tablet/laptop widths, internal scrolling tables, mobile inbox list/detail, stacked matching controls and safe-area bottom navigation.

Portraits and fonts are served locally. Below-the-fold profile imagery uses lazy loading and responsive WebP sources. All app routes use the same navigation system and simulated-state notice.

## Manual acceptance checklist

- [ ] Physical Android Chrome and iPhone Safari: keyboard, input zoom, safe areas, orientation, image upload, scrolling, navigation and browser back/forward.
- [ ] Tablet widths and 200% zoom, including admin table scrolling and profile modal overflow.
- [ ] VoiceOver/NVDA reading order, announcements, modal focus behavior and screen-reader form feedback.
- [ ] All matching dynamic states with camera/mic defaults, report form, skip and emergency block; no device permission prompt should appear.
- [ ] Slow network/cache-disabled loading, lower-powered phones and long text entered into forms/messages.
- [ ] Keyboard-only journey through public mobile menu, registration, discovery filters and every dialog.
- [ ] Full brand/copy replacement, icon regeneration and legal review.
- [ ] Fresh install from the lockfile on the intended CI/deployment OS.

Automated accessibility checks are not a WCAG certification. Physical-device and assistive-technology checks are intentionally listed as follow-up, not falsely recorded as completed.

## Reset and failure controls

Refresh to restore all social fixtures. Clear the `africonnect-ui` local-storage entry to reset display preferences. Use `error@demo.test` for sign-in failure. Matchmaking’s developer controls expose no-match and error behavior. Incompatible discovery filters expose empty results. No user data leaves the browser state.

## Dependency audit note

Production dependency audit: zero known advisories at verification. The full developer dependency tree has seven inherited high-severity findings rooted in the unpatched `braces@3.0.3` stack-exhaustion advisory used by glob/build tooling. The source uses fixed, trusted glob patterns. A coordinated Next/ESLint/Tailwind toolchain review is required before launch; do not accept untrusted patterns or claim this is a production security audit.
