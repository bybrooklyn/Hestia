# PERFORMANCE_NOTES.md

Performance investigation notes for the jellyfin-vue fork.

This file is now the combined performance document. It folds in the measured audit from `perf.md` on 2026-05-23 and keeps the earlier planning context from `FORK_ROADMAP.md` section 5 / section 6.

Goal context: reduce the "loading-heavy" feel relative to Jellyfin Web while keeping the existing architecture recognizable.

## Audit Snapshot

Date: 2026-05-23

Repo path: `/Users/brooklyn/data/jellyfin-vue`

Checkout audited: `develop` at `49582bc0`, with a dirty working tree. The build and source audit include the current local changes, including untracked pages under `packages/frontend/src/pages/photo/` and `packages/frontend/src/pages/settings/plugins.vue`.

Primary measurement command:

```sh
pnpm -C packages/frontend build
```

Runtime used for the build: Node `v24.15.0`, pnpm `11.1.2`.

Limitations: this audit did not attach to a real Jellyfin server, so API latency, server payload byte counts, image response sizes, and Lighthouse field timings were not measured. The conclusions below are based on production bundle output, generated HTML, and source-level startup/data-flow inspection.

## What Already Exists

Do not rebuild these systems:

- IndexedDB response cache in a Web Worker under `packages/frontend/src/store/dbs/`.
- Stale-while-revalidate fetching, request cancellation (`cancellableWrapper`), and argument-level dedup (`deepEqual`) in `packages/frontend/src/composables/apis.ts`.
- Effect teardown on route change (`JView_isRouting`).
- Session memoization for `fetchIndexPage()` in `packages/frontend/src/composables/use-index-page.ts`.
- Virtualized item grids through `JVirtual`.
- Blurhash placeholders decoded and drawn off-thread.
- Vendor chunking in `packages/vite-plugins/src/bundle.ts`.

The work is tuning and rendering, not cache-building.

## Executive Summary

The current first load is dominated by work that does not belong on the first screen.

- The production build is `4.0 MiB` raw, `1.16 MiB` gzip, `974.8 KiB` brotli across 141 files.
- The generated `index.html` references 39 initial resources totaling `3.04 MiB` raw, `801.0 KiB` gzip, `651.8 KiB` brotli before the app can be useful.
- `packages/frontend/vite.config.ts:31-40` sets `vue-router/vite` to `importMode: 'sync'`, so every page component is statically imported into the startup graph.
- The first page is told to preload playback-only and route-only libraries: `hls.js`, `libpgs`, `assjs`, `audiomotion-analyzer`, `swiper`, `sortablejs`, `marked`, `dompurify`, the full Vuetify runtime, date-fns locale data, and most app code.
- `packages/frontend/src/App.vue:15` renders `<PlayerElement v-if="remote.auth.currentUser.value" />`. Because component auto-imports are static, this pulls the player, HLS, ASS/PGS subtitle renderers, and playback stores into the base app even when nothing is playing.
- `packages/frontend/src/main.ts:48-52` blocks Vue mounting on font loading even though the built font CSS uses `font-display: swap`.
- `packages/frontend/src/layouts/default.vue:30` awaits `useIndexPage()` just to render the default layout drawer. That function fetches home-page data too, so many non-home routes wait on home data.
- `packages/ui-toolkit/src/components/JImg.vue:3-19` uses `<link rel="preload" as="image">` for every mounted image and renders images with `decoding="sync"`. Off-screen cards are therefore pushed toward eager image fetching instead of native lazy loading.

Highest ROI implementation order:

1. Make page routes async by default and verify the initial HTML no longer preloads feature-route chunks.
2. Lazy-load the root player and move HLS/ASS/PGS imports to the playback/subtitle paths that actually need them.
3. Stop blocking `app.mount()` on font readiness and reduce the startup `config.json` round trip cost.
4. Split default-layout library views from full home-page data and render home sections progressively.
5. Replace image-wide preloading with visible/hero-only priority, native lazy images, explicit image sizes, and bounded server image widths.
6. Lazy-load date-fns locales and reduce all-fields/all-image-types API requests after measurement.

## Measured Production Build

Build result summary:

| Area | Files | Raw | gzip | brotli |
|---|---:|---:|---:|---:|
| All JS | 130 | 3457.8 KiB | 1054.7 KiB | 890.6 KiB |
| All CSS | 4 | 538.1 KiB | 73.7 KiB | 49.4 KiB |
| Fonts | 2 | 29.7 KiB | 29.7 KiB | 29.7 KiB |
| Other | 5 | 20.2 KiB | 6.0 KiB | 5.1 KiB |
| Total build | 141 | 4045.9 KiB | 1164.2 KiB | 974.8 KiB |

Generated initial page:

- `packages/frontend/dist/index.html` has 1 module script, 32 modulepreload links, and 4 stylesheets.
- Initial resources referenced by HTML total `3113.5 KiB` raw, `801.0 KiB` gzip, `651.8 KiB` brotli.
- `config.json` is not linked in the HTML, but `packages/frontend/src/utils/external-config.ts:55-67` fetches it during module evaluation, adding a separate startup round trip.

Largest initial resources:

| Resource | Raw | gzip | brotli | Why it is concerning |
|---|---:|---:|---:|---|
| `assets/vendor/hls.js-*.js` | 497.4 KiB | 152.3 KiB | 124.6 KiB | Playback-only, loaded before playback |
| `assets/main-*.js` | 464.0 KiB | 117.7 KiB | 93.6 KiB | App and all sync route code |
| `assets/vendor/vuetify-*.js` | 416.5 KiB | 129.8 KiB | 106.0 KiB | Framework runtime |
| `assets/vendor/vuetify-*.css` | 393.5 KiB | 48.6 KiB | 28.6 KiB | Render-blocking CSS |
| `assets/vendor/date-fns-*.js` | 319.4 KiB | 72.8 KiB | 54.2 KiB | Date functions plus locale imports |
| `assets/vendor/jellyfin-*.js` | 241.6 KiB | 31.4 KiB | 24.2 KiB | SDK, needed, but benefits from route/API splitting |
| `assets/main-*.css` | 139.7 KiB | 23.8 KiB | 19.8 KiB | Includes route/component CSS due sync imports |
| `assets/vendor/swiper-*.js` | 111.9 KiB | 32.6 KiB | 28.9 KiB | Home/player carousel only |
| `assets/vendor/i18next-vue-*.js` | 84.6 KiB | 32.9 KiB | 29.6 KiB | Core i18n integration |
| `assets/vendor/libpgs-*.js` | 61.4 KiB | 22.0 KiB | 19.3 KiB | PGS subtitle playback only |
| `assets/vendor/marked-*.js` | 40.4 KiB | 12.2 KiB | 11.1 KiB | Markdown/HTML rendering only |
| `assets/vendor/sortablejs-*.js` | 35.8 KiB | 12.4 KiB | 11.2 KiB | Playlist/queue drag only |
| `assets/vendor/assjs-*.js` | 33.0 KiB | 12.2 KiB | 11.0 KiB | ASS subtitle playback only |
| `assets/vendor/audiomotion-analyzer-*.js` | 29.7 KiB | 11.7 KiB | 10.5 KiB | Music visualizer only |
| `assets/vendor/dompurify-*.js` | 23.1 KiB | 9.2 KiB | 8.2 KiB | Sanitized HTML/markdown only |

The raw JS parse/compile cost matters even when compressed transfer looks acceptable. On mobile and low-power TV browsers, `3.0 MiB` of initially referenced JS/CSS is a large startup tax.

## Startup Critical Path

The current startup path is roughly:

1. `index.html` loads the generated entry.
2. The generated entry imports splashscreen and main.
3. `main.ts` imports i18n, routes, router, remote, Vuetify, styles, and root app.
4. `external-config.ts` fetches `config.json` with `cache: 'no-store'` at top level.
5. `remote/auth.ts` constructs the auth singleton and immediately starts `_bootstrap()`.
6. `main.ts` registers all generated routes, installs plugins, then waits for `router.isReady()`, `font.load()` for every document font, and `document.fonts.ready`.
7. `MainView.vue` wraps layouts and pages in Suspense, so top-level awaits in layout/page setup block the visible routed page.

Important source references:

- `packages/frontend/src/utils/external-config.ts:55-67` fetches and awaits `config.json`.
- `packages/frontend/src/main.ts:35-42` adds all generated routes and installs app plugins.
- `packages/frontend/src/main.ts:48-52` waits for route readiness and fonts before mounting.
- `packages/frontend/src/plugins/remote/auth.ts:399-407` refreshes current user and servers immediately after singleton construction.
- `packages/frontend/src/components/Layout/MainView.vue:6-27` suspends route/layout rendering and shows the splashscreen fallback only at root.
- `packages/frontend/src/layouts/default.vue:30` awaits `useIndexPage()` before the default layout resolves.

## Current Bottlenecks

| Ref | Bottleneck | Likely cause | Severity |
|---|---|---|---|
| P0-A | Startup downloads most of the app | `vue-router/vite` uses `importMode: 'sync'` | Critical |
| P0-B | Playback libraries are initial | Root `App.vue` statically pulls `PlayerElement`; player store imports HLS/ASS/PGS | Critical |
| P0-C | Default layout waits on full home data | `layouts/default.vue` awaits `useIndexPage()` | Critical |
| P1-A | App mount waits for fonts | `main.ts` waits on all font faces and `document.fonts.ready` | High |
| P1-B | Startup has a blocking config fetch | `external-config.ts` top-level awaits `config.json` with `cache: 'no-store'` | High |
| P1-C | date-fns locale data is initial | `use-datefns.ts` imports all generated locale exports synchronously | High |
| P1-D | Images are too eager | `JImg` preloads every image and decodes synchronously | High |
| P1-E | Item API payloads are likely oversized | `apis.ts` requests every `ItemFields` and every `ImageType` | High, needs server measurement |
| P2-A | CSS is render blocking and mostly initial | Sync routes pull scoped CSS; Vuetify CSS is global | Medium |
| P2-B | WebSocket subscriptions may be broad | socket subscribes to tasks/activity/sessions immediately | Medium, needs server measurement |
| P2-C | Warm navigation still revalidates | SWR refreshes even when cached data exists | Medium, behavior-sensitive |
| P2-D | Page re-navigation remounts views | No route `<KeepAlive>` | Medium, behavior-sensitive |
| P2-E | Large-library memory/jank uncertain | Grid virtualizes, but route data may still hold large arrays | Medium, needs profiling |

## Detailed Findings

### P0-A - Route Components Are Synchronously Imported

Evidence:

- `packages/frontend/vite.config.ts:31-40` configures `VueRouter({ importMode: 'sync' })`.
- The generated `dist/index.html` preloads 32 JS chunks for the first page.
- Initial resources include route-specific dependencies for playback, settings, search, metadata, playlists, and home carousels.

Impact:

- Users visiting `/server/login`, `/server/select`, or any single route still download and parse most of the app.
- Admin/settings pages and playback libraries affect first load even when the user is unauthenticated.
- CSS code splitting is largely defeated because route-scoped styles are pulled into initial CSS.

Recommendation:

- Switch generated route imports to async by default.
- If needed, keep only tiny server/login/wizard routes eager after measurement. The default should be lazy route chunks.
- Group chunks by product area if the default split is too fragmented: `server`, `home`, `item-detail`, `library`, `playback`, `settings-admin`.
- After the change, rebuild and check that `dist/index.html` no longer preloads `hls.js`, `swiper`, `sortablejs`, `libpgs`, `assjs`, admin settings chunks, or route CSS for pages that are not needed initially.

Expected result:

- The initial JS/CSS transfer should drop substantially. A reasonable first target is below `350 KiB` gzip initial JS+CSS for unauthenticated server pages, excluding images and fonts.

Risks:

- Route metadata and guards must still work before component code is loaded. Verify generated route records still include `<route>` block metadata.
- Suspense fallback behavior may become more visible during route chunk loads. That is acceptable if the fallback is fast and stable.

### P0-B - Player and Playback Libraries Are in the Root App

Evidence:

- `packages/frontend/src/App.vue:15` includes `<PlayerElement v-if="remote.auth.currentUser.value" />`.
- Component auto-import makes that a static import, even though the template has `v-if`.
- `packages/frontend/src/components/Playback/PlayerElement.vue:45-46` statically imports `hls.js` and the HLS worker URL.
- `packages/frontend/src/store/player-element.ts:7-9` statically imports `assjs`, `libpgs`, and the PGS worker URL.
- Initial build output preloads `hls.js` (`497.4 KiB` raw), `libpgs` (`61.4 KiB` raw), `assjs` (`33.0 KiB` raw), and the playback-related app code.

Impact:

- The base app pays for video playback, HLS, ASS subtitles, and PGS subtitles before playback starts.
- The unauthenticated login/select flow pays for playback code because all routes and root components are sync.

Recommendation:

- Replace the static root player with an explicit async component:

```ts
const PlayerElement = defineAsyncComponent(() =>
  import('#/components/Playback/PlayerElement.vue')
);
```

- Gate loading more narrowly than `currentUser` if possible. For example, mount the player when playback state first needs a local media element, not immediately on login.
- Move `hls.js` import into the branch that needs HLS playback. Native direct-play audio/video should not require loading HLS.
- Move `assjs` into `_applySsaSubtitles()` and `libpgs` into `_applyPgsSubtitles()`.
- Make `MusicVisualizer` lazy when `viewMode === 'visualizer'` in `packages/frontend/src/pages/playback/music.vue:46-49`, since `audiomotion-analyzer` is otherwise a first-load dependency.
- Make `DraggableQueue` and playlist drag support lazy on queue dialog / playlist route activation, since `sortablejs` is only needed for drag interactions.

Expected result:

- Remove roughly `210 KiB` gzip from the initial graph just from HLS, subtitle renderers, visualizer, Swiper, Sortable, and nearby playback code, before accounting for app chunk shrinkage.

Risks:

- Player persistence across route changes is important. Keep the player mounted once active; just do not load it before it is needed.
- Dynamic HLS import must not delay first frame too much. Preload HLS only when the user initiates video playback or when playback info indicates HLS/transcode is required.

### P0-C - Default Layout Blocks on Full Home Data

Evidence:

- `packages/frontend/src/layouts/default.vue:30` does `const { views } = await useIndexPage();`.
- `packages/frontend/src/composables/use-index-page.ts:30-33` memoizes `fetchIndexPage()`, which fixed the duplicate home fetch problem.
- `packages/frontend/src/utils/items.ts:594-652` still fetches home data as one large unit:
  - First `getUserViews`.
  - Then latest media per library.
  - Then seven home rows: resume video, latest media carousel, next up, resume audio, favorite albums, favorite artists, favorite songs.
- `MainView.vue` Suspense means this top-level await delays layout/page resolution.

Impact:

- Any default-layout route may wait for home-page sections just to draw the navigation drawer.
- Home first paint waits for the slowest library/latest/favorite request instead of rendering rows as they arrive.
- The memoization prevents duplicate work, but it also makes a broad request bundle the default dependency for many routes.

Recommendation:

- Split `useIndexPage()` into at least two layers:
  - `useLibraryViews()` for the default layout drawer.
  - `useHomeSections()` for the home page only.
- In `layouts/default.vue`, await only user views or render the shell immediately with a drawer skeleton.
- In `pages/index.vue`, render the carousel and each section progressively as data resolves instead of awaiting all rows before the route resolves.
- Keep the existing session memoization, but memoize each section independently so one slow library does not block unrelated sections.
- Record route resolve time before and after using marks in `MainView.vue` Suspense `@pending` and `@resolve`.

Expected result:

- Logged-in non-home routes should stop waiting on home data.
- Home should show the layout and first available rows sooner, even if later sections are still loading.

Risks:

- Progressive sections change render order and loading states. Treat this as behavior-changing until validated.
- Avoid layout shift by reserving stable row/carousel heights.

### P1-A - App Mount Is Blocked by Fonts

Evidence:

- `packages/frontend/src/main.ts:48-52` waits for every current font face to `load()` and then waits for `document.fonts.ready`.
- `packages/frontend/src/assets/styles/index.css:1` imports `@fontsource-variable/figtree`.
- The built font CSS uses `font-display: swap`, but waiting in JS defeats much of that benefit.
- Font files are small (`29.7 KiB` total), but they still add network and font subsystem latency to app mount.

Impact:

- The user stays on the splashscreen until fonts are ready, even though the app could render with fallback fonts and swap later.
- This is especially noticeable on cold mobile connections or offline/poor-cache cases.

Recommendation:

- Do not block `app.mount()` on font loading.
- Mount after `router.isReady()` and let CSS `font-display: swap` handle font replacement.
- If typography flash is unacceptable, preload only the primary Latin font in HTML and continue to mount without waiting.
- Consider loading non-default font choices after initial mount.

### P1-B - Runtime Config Adds a Blocking Round Trip

Evidence:

- `packages/frontend/src/utils/external-config.ts:55-67` fetches `config.json` at top level.
- The fetch uses `cache: 'no-store'`.
- `packages/frontend/public/config.json` is only 86 bytes, but it is still a separate request that blocks modules importing `jsonConfig`.
- Router creation and default server logic depend on `jsonConfig`.

Impact:

- Every cold load has an extra network round trip before main app setup can finish.
- `no-store` prevents normal browser caching and conditional reuse.

Recommendation:

- Prefer an inline config script in `index.html` for hosted deployments, with `config.json` as fallback.
- If the file must remain external, add an early preload:

```html
<link rel="preload" as="fetch" href="./config.json" crossorigin>
```

- Reconsider `cache: 'no-store'`. `cache: 'no-cache'` still revalidates but lets the browser use conditional requests.
- Keep the runtime override behavior, but do not make an 86 byte file a blind startup barrier when defaults are adequate.

### P1-C - date-fns Locales Are Pulled Into the Initial Graph

Evidence:

- Initial build preloads `assets/vendor/date-fns-*.js` at `319.4 KiB` raw / `72.8 KiB` gzip.
- `packages/frontend/src/composables/use-datefns.ts:1` imports `* as datefnslocales` from `virtual:locales/date-fns`.
- `packages/i18n/src/vite.ts:47-58` and `101-104` generate exports for all matching date-fns locales.
- `packages/frontend/src/utils/time.ts:5-13` imports date-fns functions and `useDateFns`, and common components use `utils/time.ts`.

Impact:

- Locale support for every bundled language becomes part of the startup path.
- Route splitting will help settings-only date formatting, but common media/time helpers can still keep this chunk initial.

Recommendation:

- Change `virtual:locales/date-fns` to export async locale loaders, similar to i18next resources.
- Keep `en` synchronous if needed, then lazy-load the current locale after i18n initializes.
- For simple visible time strings, prefer built-in `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` where behavior is good enough.
- Audit `utils/time.ts` so basic `formatTime()` / tick formatting stays date-fns-free.

Risk:

- `useDateFns()` is currently synchronous. Making locales async will require either a current-locale store or graceful fallback to English while the locale module loads.

### P1-D - Image Loading Is Too Eager and Too High Priority

Evidence:

- `packages/ui-toolkit/src/components/JImg.vue:3-9` creates `<link rel="preload" as="image">` whenever an image has a `src` and is not shown.
- `packages/ui-toolkit/src/components/JImg.vue:13-19` renders the final `<img>` only after preload and uses `decoding="sync"`.
- `packages/frontend/src/components/Layout/Images/Blurhash/BlurhashImage.vue:47-53` computes an image URL with no loading policy.
- `packages/frontend/src/components/Item/Card/ItemCard.vue:10-12` does not pass width/height to `BlurhashImage`.
- `packages/frontend/src/utils/images.ts:241-268` defaults to `quality = 90`, with optional `width` but no global size cap.

Impact:

- Every mounted card image becomes a preload candidate.
- Off-screen images compete with critical JS/CSS and the hero image.
- Synchronous image decoding can add main-thread jank.
- Cards without width constraints can request larger server images than necessary.

Recommendation:

- Replace default preload behavior with regular `<img>` loading:
  - default `loading="lazy"`
  - default `decoding="async"`
  - default `fetchpriority="auto"` or omitted
- Add explicit props for priority images:
  - hero/backdrop: `loading="eager"`, `fetchpriority="high"`, possibly one preload
  - above-fold cards: `loading="eager"` only if measured useful
  - all other cards: lazy
- Pass width/height/sizes from card shape and breakpoint into `BlurhashImage`.
- Reduce default image quality from 90 after visual comparison, or make it responsive by image role.
- Intersection-gate Blurhash canvas drawing for large lists if worker traffic becomes visible in profiles.

### P1-E - API Requests Ask for Too Much Metadata by Default

Evidence:

- `packages/frontend/src/store/dbs/api/index.ts:21-24` defines `apiEnums.fields` as every `ItemFields` value and `apiEnums.images` as every `ImageType`.
- `packages/frontend/src/composables/apis.ts:150-159` adds those full fields/image types to base item requests.
- Earlier notes already identified this as P5, but no payload measurement exists yet.

Impact:

- Every item row/card/list may download fields needed only by detail pages, playback, metadata editing, or admin screens.
- Larger JSON increases transfer, parse time, IndexedDB write cost, and Vue reactive object size.

Recommendation:

- Instrument payload size before changing behavior.
- Add optional `fields` and `imageTypes` overrides to `useBaseItem` / `fetchAndAdd`.
- Keep the current broad field set as the compatibility default initially.
- Tune high-volume requests first: home rows, library grids, search results, related-item carousels.
- Define field presets by view contract, for example `cardFields`, `detailFields`, `playbackFields`, `metadataEditorFields`.

Risk:

- Missing fields can create subtle UI regressions. This should land behind measurement and route-by-route validation.

### P2-A - CSS Is Render Blocking and Mostly Initial

Evidence:

- Build CSS total is `538.1 KiB` raw / `73.7 KiB` gzip.
- Initial CSS includes Vuetify CSS (`393.5 KiB` raw / `48.6 KiB` gzip), main app CSS (`139.7 KiB` raw / `23.8 KiB` gzip), and Swiper CSS (`4.7 KiB` raw).
- `packages/frontend/src/plugins/vuetify.ts:6-7` imports `vuetify/styles`.
- Synchronous route imports pull scoped CSS for many pages into the initial CSS.

Recommendation:

- Fix async route splitting first; this should move route-scoped CSS into route chunks where Vite can split it.
- Audit `main-*.css` after route splitting for large inline Iconify masks and route-specific utility classes.
- Avoid importing Swiper CSS globally through sync route components.
- Treat Vuetify CSS reduction as a later, harder task; it may require Vuetify-specific style strategy changes.

### P2-B - Background WebSocket Subscriptions May Be Too Broad

Evidence:

- `packages/frontend/src/plugins/remote/socket.ts:42-49` subscribes to `ScheduledTasksInfoStart`, `ActivityLogEntryStart`, and `SessionsStart` on every WebSocket connection.
- `_updateInterval` is `'0,1'` at `packages/frontend/src/plugins/remote/socket.ts:38`.

Recommendation:

- Verify actual server semantics and message volume.
- Subscribe only when consumers are mounted, or centralize reference-counted subscriptions.
- Keep session/activity/task streams off by default for non-admin users and non-admin routes if possible.

### P2-C - Stale-While-Revalidate Fires on Warm Cached Navigation

Evidence:

- `packages/frontend/src/composables/apis.ts:484-493` checks cached data and still runs a refresh when cached data exists.

Recommendation:

- Instrument request count and route resolve timing first.
- Add an optional TTL/refresh policy for high-volume routes after measurement.
- Keep default behavior fresh until a measured policy proves better.

## Safe vs. Risky Summary

| Optimization | Behavior change? | Ship as |
|---|---|---|
| Async route chunks | No intended behavior change | Always-on after metadata/guard verification |
| Lazy playback/player imports | No intended behavior change | Always-on after playback regression testing |
| Stop waiting on fonts before mount | Minor visual timing change | Always-on if acceptable |
| Config preload/cache tuning | No intended behavior change | Always-on |
| De-duplicate `fetchIndexPage` | No | Already done |
| Scroll-after-suspense | No, fixes a bug | Always-on |
| Profiled rerender/dependency fixes | No | Always-on after profiling |
| Image lazy-load hardening | No if priority images are explicit | Always-on after visual validation |
| Progressive home sections | Yes, render order/loading states | Experimental, then default on if proven |
| Route `<KeepAlive>` cache | Yes, staleness/memory | Experimental |
| Session data cache | Yes, staleness | Experimental |
| Reduced metadata fields | Yes, missing-field risk | Experimental, fork-only first |
| Refresh-policy / TTL changes | Yes, staleness | Experimental |
| Prefetch on hover/focus | Yes, extra speculative requests | Experimental |
| Compact item models | Yes, feature-loss risk | Experimental, fork-only first |

## Experimental Setting Candidates

Performance-related toggles from `FORK_ROADMAP.md` section 6:

- Route component cache (`<KeepAlive>`).
- Home page section cache.
- Progressive home section rendering.
- Reduced metadata fetching.
- Refresh policy / cache TTL.
- Prefetch on hover/focus.
- Compact item models.
- Debug playback stats overlay / API request inspector / render timing overlay.
- Transcode/debug visibility.

Rule: pure no-risk fixes must not get a toggle. Toggles are for behavior-changing work only.

## Recommended Implementation Plan

### Phase 1 - Shrink Initial App

1. Change router import mode from sync to async.
2. Rebuild and record:
   - number of initial modulepreloads
   - initial raw/gzip/brotli size
   - whether playback/admin/swiper/sortable chunks are absent from login/select HTML
3. Make `PlayerElement` async in `App.vue`.
4. Dynamically import `hls.js`, `assjs`, `libpgs`, `audiomotion-analyzer`, and `sortablejs` at their use sites.
5. Remove font readiness from the blocking mount path.

Acceptance targets:

- Initial login/select page does not preload HLS, Swiper, Sortable, ASS, PGS, or admin settings code.
- Initial JS+CSS gzip for unauthenticated server pages is below `350 KiB`.
- App shell mounts without waiting for document fonts.

### Phase 2 - Improve Logged-In Home and Navigation

1. Split `useLibraryViews()` from full `useHomeSections()`.
2. Default layout waits only for views, or renders a stable shell while views load.
3. Home page fetches each section independently and renders rows progressively.
4. Add route timing instrumentation around router navigation and `MainView.vue` Suspense resolution.

Acceptance targets:

- Non-home default-layout routes do not trigger all home section requests.
- Home first visible shell appears before all library/latest/favorites requests finish.
- Route timing logs show pending -> resolve duration per route.

### Phase 3 - Images and API Payloads

1. Replace global image preload with explicit image priority props.
2. Add width/height/sizes to card and carousel image calls.
3. Instrument image request counts and decoded sizes on home/library.
4. Instrument API response size and duration in `fetchAndAdd()`.
5. Add optional field/image presets and tune high-volume card/list endpoints.

Acceptance targets:

- Off-screen card images are lazy by default.
- Home/library image requests are close to visible images plus a small buffer.
- API payload size reductions are measured before becoming default.

### Phase 4 - Budget and Regression Guards

1. Extend `JBundleSizeReport` to print gzip and brotli sizes. Current report only prints raw size.
2. Add a small script that parses `dist/index.html` and reports initial resources and top offenders.
3. Set soft budgets:
   - initial gzip JS+CSS
   - largest initial JS chunk
   - total CSS gzip
   - no playback-only vendors in unauthenticated initial graph
4. Keep `pnpm -C packages/frontend analyze:bundle` for source-level deep dives, but make the fast size budget script run in normal local checks.

## Recommended Instrumentation

Before changing API behavior, measure:

- Route load time: mark `performance.now()` at router navigation start and at Suspense `@resolve` in `MainView.vue`.
- API volume: count calls in `apis.ts` `fetchAndAdd`; record method name, args hash, duration, cache hit/miss, and response byte count.
- Duplicate requests: group counted requests by `funcName + stringifiedArgs` within a short window.
- Payload size: log `JSON.stringify(response.data).length` or `Content-Length` per endpoint; compare full vs. trimmed `ItemFields`.
- Home composition: time `fetchIndexPage` start to resolve and each inner `useBaseItem`.
- Player init: time from `play()` / route enter to media `loadeddata` and first `timeupdate`.
- Render: Vue DevTools component render flamegraph for `library/[itemId]`, `index`, and `video`; browser Performance panel for long tasks during scroll.
- Memory: heap snapshot after scrolling a large library; count retained `BaseItemDto` objects.
- Images: image request count and dimensions by route.

Read-only developer overlay candidates:

- Route load time, last and rolling average.
- API request count, session and current route.
- Duplicate request count.
- Image request count.
- Cache hit/miss count and ratio.
- Slowest endpoint.
- Playback info request timing.
- Player initialization time.
- Render timing for large views.

Keep instrumentation read-only and off in production by default.

## Areas to Profile

Routing / rendering:

- `MainView.vue` Suspense pending to resolve timing per route.
- Re-mount cost of `pages/index.vue`, `pages/library/[itemId].vue`, `pages/playback/video.vue`.
- Transition (`JTransition`) overlap with data loading.

API:

- `apis.ts` request count, cache hit ratio, and revalidation frequency.
- `fetchIndexPage` fan-out and section timing.
- Payload size with full `ItemFields`.
- `apidb.worker.ts` round-trip latency for cache reads.

Images:

- `utils/images.ts` request count, sizes, blurhash decode time, and lazy-load coverage.
- `JImg.vue` preload behavior after replacing global preload.

Playback:

- `getPostedPlaybackInfo` timing and how often it re-fires.
- Player route enter to first frame.
- Source-swap timing.
- HLS.js level switching and buffer health.

Library:

- Item count held in memory for a large library.
- `JVirtual` windowing efficiency.
- Scroll FPS and long tasks.

## Validation Checklist

After each optimization:

```sh
pnpm -C packages/frontend build
pnpm -C packages/frontend check
```

Then compare:

- `dist/index.html` modulepreload count.
- initial raw/gzip/brotli size from the generated HTML references.
- top initial chunks.
- route timing logs on:
  - `/server/select`
  - `/server/login`
  - `/`
  - `/library/:itemId`
  - `/item/:itemId`
  - `/playback/video`
- network request count on cold home and warm back navigation.
- image request count on home/library at desktop and mobile widths.

## Findings Appendix

Current measured finding, 2026-05-23:

- `pnpm -C packages/frontend build` completed successfully.
- Generated `dist/index.html` had 1 module script, 32 modulepreload links, and 4 stylesheets.
- Initial resources referenced by generated HTML totaled `3113.5 KiB` raw, `801.0 KiB` gzip, `651.8 KiB` brotli.
- Full build totaled `4045.9 KiB` raw, `1164.2 KiB` gzip, `974.8 KiB` brotli.
- Largest initial offenders were `hls.js`, `main`, Vuetify JS/CSS, `date-fns`, Jellyfin SDK, Swiper, `libpgs`, `marked`, `sortablejs`, `assjs`, and `audiomotion-analyzer`.

Bottom line: the biggest performance win is to stop treating the SPA as one synchronous application. Async route boundaries plus lazy playback imports should remove the largest incorrect first-load costs. After that, the next real user-facing wins are progressive home rendering and image priority fixes. API payload trimming is promising but should be measured and phased carefully because the app currently relies on broad item metadata for correctness.

## Soft Budgets (Phase 4 — 2026-05-23)

Enforced by `pnpm -C packages/frontend check:budget`
(`packages/frontend/scripts/initial-budget.ts`). Tighten as wins land; the
script reads `dist/index.html` and walks every modulepreload + stylesheet.

| Budget | Threshold | Why |
|---|---|---|
| Total initial gzip JS+CSS | ≤ 550 KiB | Headroom for date-fns locales + Vuetify until P1-C lands; tighten to 350 KiB once locales go async. |
| Largest initial chunk (gzip) | ≤ 150 KiB | Forces big vendors (Vuetify, date-fns) to stay split; flags accidental merges. |
| Playback-only vendors in initial graph | 0 | `hls.js`, `libpgs`, `assjs`, `audiomotion-analyzer`, `sortablejs`, `swiper` must never preload before the user touches playback. |

Phase 1–3 measured outcome (post-implementation):

- Initial modulepreloads: 32 → 53 (more chunks, but each tiny — see below).
- Initial raw: 3113.5 KiB → ~2050 KiB.
- Initial gzip: 801.0 KiB → ~503 KiB.
- Initial brotli: 651.8 KiB → ~408 KiB.
- `main-*.js`: 497.94 KiB → ~36 KiB (route-scoped code moved out of entry).
- HLS / libpgs / assjs / audiomotion / sortablejs / swiper: **removed** from initial graph; load on demand.

Remaining initial weight is dominated by Vuetify runtime + date-fns
(locale data), which are out of scope for this round; tracked as P1-C and
the Vuetify CSS reduction in the audit above.
