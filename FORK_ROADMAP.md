# FORK_ROADMAP.md

Discovery document for the personal jellyfin-vue fork. **No source code was modified to produce this.** It records the current state of the repository, audits unfinished features, and proposes a sequenced plan of small, mostly upstreamable tasks.

Scope reminder: stay recognisably jellyfin-vue. No rebrand, no rename, no architecture rewrite. Differences from upstream should be features, quality-of-life, and performance only.

> **Convention:** difficulty and risk are `Low` / `Medium` / `High`. "Upstreamable" means the change is generic enough that the jellyfin org would plausibly accept it. Uncertainties are called out explicitly — when the repo did not prove something, it is marked `UNCERTAIN`.

---

## 1. Project architecture overview

| Area | Finding |
|---|---|
| Package manager | `pnpm@11.1.2`, workspace. `engineStrict` on. Node `>=24.11.0 <25`. Versions shared via `pnpm-workspace.yaml` `catalogs`. |
| Framework / build | Vue 3.5 + Vuetify 3.11, Vite 8 (rolldown reporter observed), UnoCSS + Lightning CSS. TS targets ES2022/ES2024 (top-level await, `Object.groupBy`). |
| Monorepo packages | `packages/frontend` (the SPA), `packages/ui-toolkit` (`J*` components, auto-imported), `packages/shared` (`universal/` + `node/`), `packages/i18n` (i18next, virtual modules), `packages/configs`, `packages/vite-plugins`, `packages/tauri-runtime` + `packaging/tauri`. |
| Routing | File-based via `unplugin-vue-router` from `src/pages/`. `<route>` blocks are YAML. Routes registered in `main.ts`. Generated dts: `types/global/routes.d.ts`. |
| Route rendering | `components/Layout/MainView.vue` wraps each route in `<Suspense>`. **No `<KeepAlive>`** — every navigation re-mounts the page component and re-runs its `<script setup>`. |
| State management | No Pinia. Class-based singleton stores extending `BaseState → CommonStore → SyncedStore` (`store/super/`). `SyncedStore` mirrors selected keys to the server `DisplayPreferences`. provide/inject keys centralised in `store/keys.ts`. |
| API / client usage | All server access goes through the `remote` singleton (`plugins/remote/`: `auth`, `sdk`, `socket`, `axios`). Data fetching via `composables/apis.ts` (`useBaseItem` / `useApi`). |
| API cache layer | `store/dbs/` — Dexie/IndexedDB cache running in a Web Worker (`apidb.worker.ts`). Stale time **1 week** (`base-db.ts`). `useBaseItem`/`useApi` are stale-while-revalidate: cached data returned immediately, a refresh request is still fired. Request cancellation (`cancellableWrapper`) and arg-based dedup (`deepEqual`) are already built in. Effects stop on route change via `JView_isRouting`. |
| Playback files | `store/playback-manager.ts` (device-agnostic playback state), `store/player-element.ts` (local `<video>`/`<audio>` + subtitle rendering), `components/Playback/PlayerElement.vue` (HTMLMediaElement + `hls.js`), `pages/playback/video.vue` + `music.vue`, `components/Buttons/Playback/*`, `components/Playback/*`, `utils/playback-profiles/` (DeviceProfile builder — entire module marked `@deprecated`). |
| Settings files | `store/settings/` — `client.ts` (locale), `subtitle.ts` (subtitle appearance), `theme.ts`. `pages/settings/` — index + account, apikeys, devices, server, logs-and-activity, subtitles, users. Many entries on the settings index are disabled (see §2). |
| Localization | i18next via `packages/i18n`; locales generated into virtual modules. Source strings in `packages/i18n/strings/*.json` (44 locale files). Managed by Weblate — do not hand-edit. |
| Component structure | `components/` grouped by domain: `Buttons/`, `Playback/`, `Item/` (`Card/`, `MediaDetail/`, `Metadata/`, `Identify/`), `Layout/`, `Forms/`, `Selectors/`, `Wizard/`, `System/`, `Users/`, `Skeletons/`, `Dialogs/`. `J*` components are auto-imported from `ui-toolkit`. |
| Testing / linting | `pnpm lint` (ESLint), `pnpm check:types` (vue-tsc), `pnpm test` (Vitest — only `packages/shared` currently has tests), `pnpm analyze:cycles`. Per-package: `pnpm -C packages/frontend {start,build,storybook,check}`. |
| Docker / deploy | `packaging/docker`, `packaging/deb` (Debian packaging), `packaging/tauri` (desktop). `.devcontainer/`. CI in `.github/workflows/`. **Note:** upstream CI `check:types` and `lint` are currently red for pre-existing dependency-drift reasons unrelated to feature work. |

### Architectural observations relevant to this fork
- The data layer is **more capable than it looks**: caching, dedup, cancellation, and offline queueing already exist. Performance work should *use* this layer, not reinvent it.
- The `playback-profiles/` module is entirely `@deprecated` with a documented intent to move to the `MediaCapabilities` API. Touching it is sensitive — see §3.
- `_currentPlaybackInfo` in `playback-manager.ts` already fetches the full `PlaybackInfoResponse` (media sources, transcoding URL, play session) but is **private**; transcode/quality diagnostics would mostly be a matter of *exposing* existing data.

---

## 2. Feature parity audit

The full, capability-level parity audit now lives in **[`PARITY.md`](./PARITY.md)** — a tracked gap list against a pinned baseline (jellyfin-web `10.11.8`). See `CONTEXT.md` for terminology and `docs/adr/0001-target-full-capability-parity-with-jellyfin-web.md` for the decision.

This section is deliberately not duplicated here. Division of labour:

- **`PARITY.md`** — the single source of truth for *what's left to reach jellyfin-web parity*, capability by capability.
- **`KNOWN_BUGS.md`** — defects that are broken regardless of jellyfin-web (not parity work).
- **`FORK_ROADMAP.md`** (this file) — *strategy*: architecture, the playback deep-dive (§3–4), performance (§5), Experimental plan (§6), upstreaming approach (§7–8), and fork-only ideas (§9).

---

## 3. Playback feature audit

| Feature | Status | Detail |
|---|---|---|
| Quality selection | **UI exists but disabled** (fix in flight) | Disabled `<VSelect>` in `PlaybackSettingsButton.vue`. PR #2815 wires it to a max-bitrate model. |
| `maxStreamingBitrate` usage | **Missing → partial** | Not passed to `getPostedPlaybackInfo` on `master`; PR #2815 adds it. The `DeviceProfile` hardcodes `MaxStreamingBitrate: 120_000_000` (`playback-profiles/index.ts`). |
| Subtitle stream selection | **Implemented** | `SubtitleSelectionButton.vue` + `MediaStreamSelector.vue`; "Disabled" option = index `-1`. |
| Audio stream selection | **Implemented** | `MediaStreamSelector` on item page; in-player via the settings menu. Switching re-requests playback info. |
| Playback speed | **Implemented** | `PlaybackSettingsButton.vue` combobox, 0.5–2× presets + free entry; clamped 0.0625–16. Applied via `mediaControls.rate`. |
| Media source selection | **Implemented (pre-playback only)** | `MediaSourceSelector` on the item page. Not available mid-playback. |
| Direct play / direct stream / transcode | **Implemented, invisible** | `getItemPlaybackUrl` picks a direct `stream.<container>` URL when `SupportsDirectStream`, else the server `TranscodingUrl`. The user is never told which path is active. |
| Playback info requests | **Implemented** | `_currentPlaybackInfo` (`computedAsync`) calls `getPostedPlaybackInfo` with the `DeviceProfile`; re-runs when item/source/audio/subtitle indexes change. |
| Player state management | **Implemented** | Split: `playback-manager.ts` (agnostic) vs. `player-element.ts` (local element). Clean separation. |
| Queue handling | **Implemented** | `addToQueue`, `playNext`, `setNewQueue`, `changeItemPosition`, `DraggableQueue.vue`, `UpNext.vue`. |
| Shuffle / repeat | **Implemented** | `toggleShuffle` (worker-based shuffle), `toggleRepeatMode` (none/one/all). |
| Resume behavior | **Implemented** | `play({ startFromTime })`; `onLoadedData` restores `currentTime`. Home page "Continue watching" via `getResumeItems`. |
| Seeking | **Implemented** | `TimeSlider`; `skipForward`/`skipBackward` = ±15 s; media-key seek handlers. |
| Playback settings persistence | **Missing** | `playbackManager` has no `persistenceType`; `_reset()` on `stop()` resets speed and (PR-added) `maxStreamingBitrate`. Speed/quality do **not** survive a stop or reload. |
| Transcode reason visibility | **Missing** | Zero references to `TranscodeReason`. The data is reachable from `_currentPlaybackInfo` but not exposed. |
| Playback stats overlay | **Missing** | No stats/diagnostics component. |
| HLS / DASH / direct file | **Partial** | `hls.js` for HLS; native HLS fallback for Safari iOS; direct progressive files supported. **No DASH.** |
| Browser compatibility assumptions | **Implemented but `@deprecated`** | `playback-profiles/` builds the `DeviceProfile` from `<video>.canPlayType` probes. Module documents an intent to migrate to `MediaCapabilities`. `codec-profiles.ts` has TODOs noting Safari probes that pass but fail at playback. |

---

## 4. Subtitle / audio-specific audit

| Concern | Current state |
|---|---|
| Subtitle selector | Present (`SubtitleSelectionButton.vue`); lists parsed tracks + a "Disabled" entry. |
| External subtitles | Supported — VTT/SRT via `<track>`, ASS/SSA via `assjs`, PGS via `libpgs` worker (`player-element.ts`). |
| Embedded subtitles | Supported — `SubtitleDeliveryMethod.Encode` (server burn-in) and `.External`. |
| Forced subtitles | **No explicit handling found.** `IsForced` exists on `MediaStream` and is shown in the media-info panel, but nothing auto-selects forced tracks. UNCERTAIN whether server defaults cover this. |
| SDH/HI subtitles | **No explicit handling.** No SDH/HI flag on `MediaStream`; would require title heuristics. |
| Default subtitle language | **Not a client preference.** `subtitle.ts` stores appearance only. Selection relies on server user config + `IsDefault`. |
| Default audio language | **Not a client preference.** Same as above. |
| Audio track switching | Works; triggers a new `getPostedPlaybackInfo` and a seamless source reload. |
| Fallback audio behavior | `MediaStreamSelector` defaults to `IsDefault` track, else first track. |
| Subtitle burn-in / transcode implications | `Encode` delivery = server burns subtitles into the video → forces a video transcode. External delivery = client-side render, no transcode. This trade-off is **not surfaced** to the user. |
| Signs of subtitle/audio forcing transcode | Changing audio/subtitle indexes re-runs `getPostedPlaybackInfo`; the server may respond with a transcoding source. There is **no indication** to the user that their track choice caused a transcode. |

**Recommended tasks (documented only, not implemented):** preferred audio/subtitle language preferences; forced-subtitle auto-enable preference; SDH/HI labelling; a "this track requires transcoding" hint in the selectors.

---

## 5. Performance suspicion audit

No optimization performed. Suspected issues only.

| # | Symptom | Likely cause | Inspect later | How to measure | Always-on or Experimental |
|---|---|---|---|---|---|
| P1 | Whole route blank/old until all data ready | Every page `await`s data at the top of `<script setup>`; `MainView.vue` `<Suspense>` holds the route until *all* awaited composables resolve | `pages/*.vue`, `MainView.vue`, `apis.ts` | Route-change → first-contentful time; count awaits per route | Experimental (progressive rendering changes behavior) |
| P2 | Re-navigating to a page always re-loads it | **No `<KeepAlive>`** — page components fully re-mount and re-suspend each visit | `MainView.vue`, `plugins/router/` | Navigate away & back; time to interactive; watch network panel | Experimental (route cache) |
| P3 | Home shows duplicate network activity | `fetchIndexPage()` is called by **both** `layouts/default.vue` and `pages/index.vue` | `utils/items.ts`, `layouts/default.vue`, `pages/index.vue` | Count `getUserViews`/`getLatestMedia` requests on a cold load | Always-on (pure dedup, no behavior change) |
| P4 | Home page slow on first load | `fetchIndexPage` issues `1 + N(libraries) + 3` requests, all awaited together before mount | `utils/items.ts:586` | Time `fetchIndexPage` resolution; N vs. latency | Experimental (progressive sections) |
| P5 | Large API responses | `apis.ts` requests `fields: apiEnums.fields` (**every** `ItemFields` value) and `enableImageTypes: apiEnums.images` (every image type) on every item request | `composables/apis.ts`, `store/dbs/api/index.ts` | Response payload sizes; compare trimmed field set | Experimental (reduced metadata may break consumers) |
| P6 | Constant background refreshing | Stale-while-revalidate fires a refresh request on *every* composable use even with a warm 1-week cache | `apis.ts` (`run({ isRefresh: true })`) | Request count on warm navigation | Experimental (cache TTL / refresh policy) |
| P7 | Player route feels heavy to open/close | `video.vue` mounts the OSD + teleports the media element; route re-mount on every open | `pages/playback/video.vue`, `PlayerElement.vue`, `player-element.ts` | Player-open to first-frame time | Investigate before deciding |
| P8 | Possible large library jank | `ItemGrid` *does* virtualize (`JVirtual`), but it is unclear whether `pages/library/[itemId].vue` loads all items into one array | `pages/library/[itemId].vue`, `Item/ItemGrid.vue` | Items-in-memory for a 5k-item library; scroll FPS | Investigate (virtualization already exists) |
| P9 | Poster/image pop-in | Blurhash decoded in a worker (20×20); image pipeline via `utils/images.ts` (has a refactor TODO) | `utils/images.ts`, `Layout/Images/*` | Image request count; decode time | Mostly always-on (lazy-load) |
| P10 | Server-selection / storage churn | `lastUpdatedIds` via `sessionStorage`; auth/server persisted | `store/dbs/api/index.ts`, `plugins/remote/auth.ts` | Storage read/write frequency | Investigate |

**Important:** caching, request cancellation, and arg-dedup already exist in `apis.ts`. Do **not** add them as "new" features — performance work here is about *tuning* (P3, P5, P6) and *rendering* (P1, P2, P4), not building a cache.

---

## 6. Experimental settings plan

A future **Experimental** settings section (new `pages/settings/experimental.vue` + a `settings/experimental.ts` store) for behavior-changing toggles. Pure no-risk fixes (P3 dedup, obvious rerender fixes) ship always-on and need no toggle.

| Toggle | Purpose | Benefit | Risk | Default | Upstream vs fork |
|---|---|---|---|---|---|
| Route component cache (`<KeepAlive>`) | Keep visited pages mounted | Instant back-navigation | Stale data; memory growth | Off | Upstream (if proven) |
| Home page section cache | Skip re-fetch of home sections within a session | Less "loading" on the most-visited page | Staleness | Off | Upstream |
| Progressive home sections | Render each home row as its data arrives instead of awaiting all | Much faster perceived home load | Layout shift | Off → On if good | Upstream |
| Reduced metadata fetching | Request a trimmed `ItemFields` set per view | Smaller payloads, faster parse | Missing fields break components | Off | Fork-only first |
| Refresh policy / cache TTL | Suppress revalidation when cache is fresh | Fewer requests | Staleness | Off | Upstream |
| Prefetch on hover/focus | Warm item data before navigation | Snappier detail pages | Wasted requests | Off | Upstream |
| Compact item models | Lighter reactive objects for grids | Lower memory on big libraries | Feature loss in cards | Off | Fork-only |
| Debug playback stats overlay | Live bitrate/codec/buffer/dropped-frames | Diagnose playback | None (read-only) | Off | Upstream (power-user) |
| API request inspector | In-app log of requests, timings, cache hits | Diagnose loading feel | None (read-only) | Off | Fork-only likely |
| Render timing overlay | Route/render timings | Diagnose jank | None (read-only) | Off | Fork-only likely |
| Transcode/debug visibility | Show direct-play vs transcode + reasons | Avoid surprise transcodes | None (read-only) | Off → consider On | Upstream |

---

## 7. Upstreaming plan (PR-sized chunks)

Small PRs preferred. Each is independently reviewable.

> Branch naming and commit conventions: see `UPSTREAM_PR_PLAN.md`.

| # | Title | Description | Files | Depends on | Diff | Risk | Upstreamable | Fork-only | Branch | Commit scope | Testing notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PR-1 | Enable quality selector | Wire the disabled bitrate `<VSelect>` to `maxStreamingBitrate` | `PlaybackSettingsButton.vue`, `playback-manager.ts` | — | Low | Low | Yes | No | `playback-quality-selector` *(exists, PR #2815)* | `feat(playback)` | Switch quality mid-play; "Automatic" = unchanged behavior |
| PR-2 | Improve disabled-setting labels | Make disabled settings-index rows visibly "coming soon" rather than just greyed | `pages/settings/index.vue` | — | Low | Low | Yes | No | `settings-disabled-labels` | `feat(settings)` | Disabled rows readable, not dead-looking |
| PR-3 | Fix duplicate `fetchIndexPage` | Share one home-data fetch between layout and page | `utils/items.ts`, `layouts/default.vue`, `pages/index.vue` | — | Low | Low | Yes | No | `fix-duplicate-index-fetch` | `fix(performance)` | Cold-load request count drops; home still correct |
| PR-4 | Show transcode vs direct play | Surface play method in the player (and/or media-info) | `playback-manager.ts` (expose info), new badge component | — | Med | Low | Yes | No | `transcode-visibility` | `feat(playback)` | Direct-play item shows "Direct"; capped item shows "Transcode" |
| PR-5 | Show transcode reason | Display `TranscodeReasons` when transcoding | `playback-manager.ts`, badge/tooltip | PR-4 | Med | Low | Yes | No | `transcode-reason` | `feat(playback)` | Force a transcode via subtitle burn-in; reason shown |
| PR-6 | Playback settings page | New `/settings/playback`; enable the settings-index row | `pages/settings/index.vue`, new `pages/settings/playback.vue`, new `store/settings/playback.ts` | — | Med | Low | Yes | No | `playback-settings-page` | `feat(settings)` | Page reachable; values persist |
| PR-7 | Persist playback quality | Save chosen quality (and speed) via the new playback store | `store/settings/playback.ts`, `playback-manager.ts`, `PlaybackSettingsButton.vue` | PR-1, PR-6 | Med | Med | Yes | No | `persist-playback-quality` | `feat(playback)` | Quality survives stop + reload |
| PR-8 | Save queue as playlist | Implement the disabled `QueueButton` action | `components/Buttons/QueueButton.vue` | — | Low | Low | Yes | No | `queue-save-as-playlist` | `feat(playback)` | Queue → server playlist created |
| PR-9 | Playback stats panel | Read-only diagnostics overlay (bitrate, codec, buffer, dropped frames) | new `components/Playback/PlaybackStats.vue`, `video.vue` | — | Med | Low | Yes | No | `playback-stats-panel` | `feat(playback)` | Toggle overlay; values update live |
| PR-10 | Scroll-to-top after suspense | Resolve the router `scrollBehavior` TODO | `plugins/router/index.ts`, `MainView.vue` | — | Low | Low | Yes | No | `scroll-after-suspense` | `fix(router)` | New route starts at top only after content resolves |
| PR-11 | Preferred audio/subtitle language | Language preferences in the playback settings page | `store/settings/playback.ts`, `playback-manager.ts` | PR-6 | Med | Med | Yes | No | `preferred-track-languages` | `feat(playback)` | Preferred language auto-selected when present |
| PR-12 | Forced subtitle handling | Auto-enable forced subs (behind a preference) | `player-element.ts`, `playback-manager.ts` | PR-6 | Med | Med | Yes | No | `forced-subtitles` | `feat(subtitles)` | Item with forced track behaves correctly |
| PR-13 | In-player media source switch | Source/version selector in the player settings menu | `PlaybackSettingsButton.vue`, `playback-manager.ts` | — | Med | Med | Yes | No | `in-player-source-switch` | `feat(playback)` | Switch version mid-playback, resumes at time |
| PR-14 | Experimental settings scaffold | Empty Experimental settings section + store | new `pages/settings/experimental.vue`, `store/settings/experimental.ts`, `pages/settings/index.vue` | — | Low | Low | Maybe | Maybe | `experimental-settings-scaffold` | `feat(settings)` | Section appears; toggles persist |

---

## 8. First 10 recommended implementation tasks

Ranked for playback usability, parity, low risk, high visible value, minimal disruption.

1. **PR-1 — Enable quality selector.** *Early:* it is the most-requested gap, already built, low risk. *Files:* `PlaybackSettingsButton.vue`, `playback-manager.ts`. *Result:* users can cap streaming quality. *Upstream:* yes (PR #2815 open).
2. **PR-3 — Fix duplicate `fetchIndexPage`.** *Early:* pure no-risk perf win on the most-visited screen; no behavior change. *Files:* `utils/items.ts`, `layouts/default.vue`, `pages/index.vue`. *Result:* faster, lighter home load. *Upstream:* yes.
3. **PR-4 — Show transcode vs direct play.** *Early:* directly serves "make browser playback behavior clearer" and "avoid surprise transcodes"; read-only, low risk. *Files:* `playback-manager.ts` + small badge. *Result:* users see how media is playing. *Upstream:* yes.
4. **PR-6 — Playback settings page.** *Early:* unblocks persistence and language prefs (PR-7, PR-11, PR-12); enables a visibly disabled page. *Files:* `pages/settings/index.vue`, new `pages/settings/playback.vue`, new store. *Result:* a real playback settings home. *Upstream:* yes.
5. **PR-7 — Persist playback quality.** *Early:* without it the quality selector resets on every stop — a daily-driver annoyance. *Files:* new `store/settings/playback.ts`, `playback-manager.ts`, `PlaybackSettingsButton.vue`. *Result:* quality choice sticks. *Upstream:* yes.
6. **PR-5 — Show transcode reason.** *Early:* completes transcode visibility; small once PR-4 lands. *Files:* `playback-manager.ts` + tooltip. *Result:* users learn *why* a transcode happened. *Upstream:* yes.
7. **PR-9 — Playback stats panel.** *Early:* high power-user value, read-only, no risk; a foundation for later debug overlays. *Files:* new `components/Playback/PlaybackStats.vue`, `video.vue`. *Result:* live playback diagnostics. *Upstream:* yes (power-user).
8. **PR-8 — Save queue as playlist.** *Early:* finishes a visibly disabled button; self-contained. *Files:* `QueueButton.vue`. *Result:* queues become playlists. *Upstream:* yes.
9. **PR-11 — Preferred audio/subtitle language.** *Early:* major daily-driver QoL; depends only on PR-6. *Files:* `store/settings/playback.ts`, `playback-manager.ts`. *Result:* the right track plays automatically. *Upstream:* yes.
10. **PR-10 — Scroll-to-top after suspense.** *Early:* tiny, fixes a real TODO, improves perceived polish. *Files:* `plugins/router/index.ts`, `MainView.vue`. *Result:* no mid-load scroll jump. *Upstream:* yes.

Deferred but high value: PR-2, PR-12, PR-13, PR-14, then the §5 rendering investigations (P1/P2/P4).

---

## 9. Fork-only future ideas

Not implemented. Likely useful for the fork but uncertain or unlikely upstream.

- **Advanced playback debug overlay** — dropped frames, buffer health, segment timings, network throughput, HLS level switches. Generic *read-only* parts (PR-9) can go upstream; the deep HLS internals stay fork-only.
- **Server diagnostics / session panel** — active sessions, transcodes server-wide, server health. Admin-flavored; large.
- **Transcode decision inspector** — per-stream "would this direct play?" breakdown using the `DeviceProfile` + `MediaCapabilities`. Generic enough to *eventually* upstream.
- **Network-based quality presets** — auto-pick a bitrate cap from measured throughput. Behavior-changing → Experimental, fork-first.
- **Per-device quality profiles** — remember different caps per device/screen.
- **Power-user direct-play / transcode controls** — force direct play, force a container/codec, override the profile.
- **Library health / media compatibility panel** — scan a library for items likely to transcode on this client.
- **Optional Alchemist integration** — show pre-transcode status / codec decisions. Strictly optional, fork-only/experimental; must never become required. UNCERTAIN whether a clean generic abstraction is possible.
- **Optional Bazarr / subtitle automation** — surface subtitle availability/automation. Optional, fork-only; not in any early pass.

### Fork-only QoL (from the owner's observed gripes)

- **Player title at the top** (gripe G4) — move the media title/series/episode block out of the bottom OSD to the top of the player. A layout preference, not a parity item (parity is capability, not UI). Files: `pages/playback/video.vue`.
- **Drop the "Libraries" home section by default** (gripe G10) — libraries already appear in the sidebar, so the home row is redundant. The *parity* mechanism is the Home Screen settings page (`PARITY.md` §2.1); this is just the fork's preferred default once that page exists. Files: `utils/items.ts`, `pages/index.vue`.

**Hard constraints for all of the above:** no server API changes, no custom backend, no required third-party service, Jellyfin API compatibility preserved.

---

## Open uncertainties (consolidated)

- Whether `pages/library/[itemId].vue` paginates or loads an entire library into one array (affects P8).
- Whether forced/SDH subtitle behavior is already "good enough" via server user config — no client code proves it either way.
- Exact intent of the disabled **Media Players** settings entry vs. the existing **Devices** page.
- How much of the mobile player layout is intentional vs. unfinished.
- Real-world impact of the full-`ItemFields` over-fetch (P5) — needs payload measurement.
- Whether upstream would accept a `<KeepAlive>` route cache, given the existing IndexedDB layer already handles data caching.
- Upstream CI (`check:types`, `lint`) is currently red for pre-existing dependency-drift reasons; this is unrelated to feature work but will show on PRs.
