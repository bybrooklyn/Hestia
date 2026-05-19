# PERFORMANCE_NOTES.md

Performance investigation notes for the jellyfin-vue fork. **Investigation only — nothing optimized.** Companion to `FORK_ROADMAP.md` (§5 perf audit, §6 Experimental plan).

Goal context: reduce the "loading-heavy" feel relative to Jellyfin Web while keeping the existing architecture.

> **First, what already exists** — do not rebuild these:
> - IndexedDB (Dexie) response cache in a Web Worker, 1-week stale time (`store/dbs/`).
> - Stale-while-revalidate fetching, request cancellation (`cancellableWrapper`), and argument-level dedup (`deepEqual`) in `composables/apis.ts`.
> - Effect teardown on route change (`JView_isRouting`).
> - Virtualized item grids (`ItemGrid.vue` → `JVirtual`).
> - Blurhash placeholders decoded off-thread.
>
> The work is **tuning and rendering**, not cache-building.

---

## 1. Suspected bottlenecks

Cross-referenced with `FORK_ROADMAP.md` §5 (P1–P10).

| Ref | Bottleneck | Likely cause | Severity (suspected) |
|---|---|---|---|
| P1 | Route blocks until *all* data is ready | Top-level `await` in every page `<script setup>` + per-route `<Suspense>` in `MainView.vue` | High — primary "loading feel" |
| P2 | Every navigation re-mounts the page | No `<KeepAlive>`; component + Suspense re-created each visit | High |
| P3 | Home data fetched twice | `fetchIndexPage()` called in both `layouts/default.vue` and `pages/index.vue` | Medium — easy win |
| P4 | Slow first home load | `fetchIndexPage` awaits `1 + N(libraries) + 3` requests together before mount | Medium–High |
| P5 | Oversized API responses | `apis.ts` always requests every `ItemFields` value and every image type | Medium — needs measurement |
| P6 | Constant revalidation traffic | SWR refreshes on every composable use even with a warm 1-week cache | Low–Medium |
| P7 | Player open/close feels heavy | Player route re-mounts; OSD + media-element teleport | Medium — measure |
| P8 | Large-library memory/jank | Grid virtualizes, but library route may hold all items in one array | Medium — UNCERTAIN |
| P9 | Poster/image pop-in | Image pipeline in `utils/images.ts` (has a refactor TODO) | Low–Medium |
| P10 | Storage churn | `lastUpdatedIds` in `sessionStorage`; auth/server persistence | Low |

---

## 2. Measurement ideas

Before changing anything, measure. Suggested per-area methods:

- **Route load** — mark `performance.now()` at navigation start (router `beforeEach`) and at Suspense `@resolve` in `MainView.vue`; log the delta per route.
- **API volume** — wrap `remote.axios` / count calls in `apis.ts` `fetchAndAdd`; record method name, args hash, duration, and cache-hit (`isCached`).
- **Duplicate requests** — group counted requests by `funcName + stringifiedArgs` within a short window; any count > 1 is a duplicate (validates P3).
- **Payload size** — log `JSON.stringify(response.data).length` (or `Content-Length`) per endpoint; compare full vs. trimmed `ItemFields`.
- **Home composition** — time `fetchIndexPage` start→resolve and each inner `useBaseItem`; see how much the slowest library latency dominates.
- **Player init** — time from `play()` / route enter to the media element `loadeddata` and to first `timeupdate`.
- **Render** — Vue DevTools component render flamegraph for `library/[itemId]`, `index`, `video`; Performance panel for long tasks during scroll.
- **Memory** — heap snapshot after scrolling a large library; count retained `BaseItemDto` objects.

Keep raw numbers in this file as a "Findings" appendix as they are gathered.

---

## 3. Recommended instrumentation

Build a **developer overlay** (fork-only initially; the read-only generic parts may upstream later). Gate it behind an Experimental toggle and/or `import.meta.env.DEV`.

Suggested overlay metrics:

- Route load time (last + rolling average).
- API request count (session + current route).
- Duplicate request count.
- Image request count.
- Cache hit / miss count and ratio.
- Slowest endpoint (name + duration).
- Playback info request timing (`getPostedPlaybackInfo`).
- Player initialization time (enter → first frame).
- Render timing for large views (home, library, player).

Implementation sketch (no code written yet): a lightweight metrics store (a `BaseState` subclass, no auth dependency), instrumentation hooks in `apis.ts` and `MainView.vue`, and a fixed-position overlay component mounted only when enabled. Read-only — must never alter request behavior when off.

---

## 4. Likely quick wins (safe, always-on, no toggle)

These change no user-visible behavior and need no Experimental gate:

- **P3 — De-duplicate `fetchIndexPage`.** Share one home-data fetch between layout and route (lift it to a shared composable / single call site). Pure reduction in requests.
- **P10 — Scroll-to-top after Suspense resolve.** Already a router TODO; also avoids a layout/scroll thrash. (`FORK_ROADMAP.md` PR-10.)
- **Targeted rerender fixes** — once profiled: convert heavy `computed`/`watch` to narrower dependencies, `shallowRef` where deep reactivity is unnecessary, stable `:key`s in large `v-for`s. Each only after a profiler confirms it.
- **Image lazy-loading** — ensure off-screen posters use native `loading="lazy"` / intersection-gated decode (verify current state in `utils/images.ts` and `Layout/Images/*` before claiming a win).

A "quick win" is only safe to ship always-on if it is provably behavior-neutral. If it changes *what* or *when* something loads, it belongs in §6.

---

## 5. Risky / behavior-changing optimizations (Experimental only)

These change behavior or correctness trade-offs — they must sit behind Experimental toggles (`FORK_ROADMAP.md` §6) and default **off**:

- **Route component cache (`<KeepAlive>`)** — instant back-nav, but stale views and growing memory.
- **Home / route data cache within a session** — fewer fetches, but staleness.
- **Reduced metadata fetching** (trimmed `ItemFields`) — smaller payloads, but a component reading an omitted field breaks. Fork-only first.
- **Refresh-policy / TTL changes** — suppressing SWR revalidation reduces traffic but serves older data.
- **Prefetch on hover/focus** — snappier navigation, but speculative wasted requests.
- **Network-based / per-device quality presets** — auto-changes playback quality; clearly behavior-changing.
- **Compact item models** — lower memory, but risk of dropped fields in cards.

---

## 6. Safe vs. risky — summary

| Optimization | Behavior change? | Ship as |
|---|---|---|
| De-duplicate `fetchIndexPage` (P3) | No | Always-on |
| Scroll-after-suspense (P10) | No (fixes a bug) | Always-on |
| Profiled rerender / dependency fixes | No | Always-on (post-profiling) |
| Image lazy-load hardening | No (if verified neutral) | Always-on |
| Progressive home sections (P1/P4) | Yes (render order) | Experimental → default on if proven |
| `<KeepAlive>` route cache (P2) | Yes (staleness) | Experimental |
| Session data cache | Yes (staleness) | Experimental |
| Reduced metadata (P5) | Yes (risk of missing fields) | Experimental, fork-only first |
| Refresh-policy / TTL (P6) | Yes (staleness) | Experimental |
| Prefetch on hover | Yes (extra requests) | Experimental |

---

## 7. Experimental setting candidates (perf-related)

From `FORK_ROADMAP.md` §6, the performance-relevant toggles:

- Route component cache (`<KeepAlive>`).
- Home page section cache.
- Progressive home section rendering.
- Reduced metadata fetching.
- Refresh policy / cache TTL.
- Prefetch on hover/focus.
- Compact item models.
- Debug playback stats overlay / API request inspector / render timing overlay (read-only; safe but power-user).

Rule: a pure no-risk fix (P3, profiled rerender fixes) **must not** get a toggle — toggles are for behavior-changing work only.

---

## 8. Areas to profile, by domain

**Routing / rendering**
- `MainView.vue` Suspense pending→resolve timing per route.
- Re-mount cost of `pages/index.vue`, `pages/library/[itemId].vue`, `pages/playback/video.vue`.
- Transition (`JTransition`) overlap with data loading.

**API**
- `apis.ts` — request count, cache hit ratio, revalidation frequency (P6).
- `fetchIndexPage` fan-out and the duplicate call (P3, P4).
- Payload size with full `ItemFields` (P5).
- `apidb.worker.ts` round-trip latency for cache reads.

**Images**
- `utils/images.ts` (refactor TODO) — request count, sizes, blurhash decode time, lazy-load coverage.

**Playback**
- `getPostedPlaybackInfo` timing and how often it re-fires (audio/subtitle/quality changes).
- Player route enter → first frame; source-swap (seamless reload) timing.
- HLS.js level switching and buffer health.

**Library**
- Item count held in memory for a large library (P8); `JVirtual` windowing efficiency; scroll FPS.

---

## 9. Findings appendix

*(Empty — to be filled with real measurements once instrumentation exists. Record: date, build/commit, scenario, numbers, conclusion.)*
