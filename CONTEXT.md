# Jellyfin Vue Fork

Personal fork of Jellyfin Vue — a browser-based Vue 3 client for a Jellyfin media server. This glossary fixes the language used when planning the fork's feature work, especially work aimed at matching the jellyfin-web client.

## Language

### Parity

**Parity feature**:
A user-accomplishable capability that exists in the jellyfin-web client.
_Avoid_: bare "feature" (ambiguous with fork-only features)

**Capability parity**:
The state in which a parity feature is fully usable through jellyfin-vue's own UI; concerns capability only, never visual resemblance to jellyfin-web.
_Avoid_: "exact parity", "feature complete" used loosely, "UI parity"

**Parity gap**:
A parity feature that jellyfin-vue lacks entirely or delivers only partially.

**Surfaced gap**:
A parity gap whose UI element exists in jellyfin-vue but is disabled, stubbed, or nonfunctional.

**Absent gap**:
A parity gap with no jellyfin-vue UI at all.

**Parity baseline**:
The frozen jellyfin-web reference the fork measures parity against — version **10.11.8**, its `stable` + `dashboard` + `wizard` apps (the `experimental` app excluded). Re-baselining to a newer jellyfin-web is a deliberate, separate step.
_Avoid_: "latest jellyfin-web", unqualified "jellyfin-web"

## Relationships

- A **parity gap** is defined relative to the **parity baseline**.
- A **parity gap** is either a **surfaced gap** or an **absent gap**.
- Closing a **parity gap** achieves **capability parity** for that **parity feature**.
- **Capability parity** never implies UI parity — jellyfin-vue keeps its own design language — **except the admin dashboard**, whose information architecture deliberately mirrors jellyfin-web's, rendered in jellyfin-vue's own components and theme.

## Example dialogue

> **Planner:** "Is the metadata editor a parity gap?"
> **Maintainer:** "The editor screen exists but has unfinished validation — so it's a surfaced gap, not an absent gap. Closing it means the edit *capability* works, through our editor, not jellyfin-web's."

## Flagged ambiguities

- "exact parity" / "feature complete" were used loosely to mean full capability parity with jellyfin-web. Resolved: the goal is **capability parity** across all **parity features**; UI parity is explicitly out of scope.
- The jellyfin-vue README states the client is "not feature-complete" and "not planned to replace jellyfin-web." Resolved for this fork only: that position is superseded — the fork's goal *is* full capability parity. Upstream's stated position is unchanged.
- "reimagined" admin dashboard: resolved — jellyfin-vue's own component system and theme, following jellyfin-web's dashboard information architecture (same pages, groupings, navigation). Not a visual port of jellyfin-web, not a free redesign.

---

## Progress log

PARITY.md is the canonical tracker. This section is a plain-language session log so future planners can see what landed and when without diffing the markdown.

### 2026-05-19 — session

**Tier 1 — playback** finished. Music page now has lyrics (`MUS-1`: third toggle next to album cover / visualizer, fetches via `LyricsApi`, highlights & auto-scrolls the active synced line, click-to-seek). Quality selector reused for audio (`MUS-2`: `PlaybackSettingsButton` gates video-only rows behind `playbackManager.isVideo` and mounts on `music.vue`). Queue button saves the current queue as a playlist via a name-prompt dialog (`QUE-1`) and its "Playing from …" header uses the initiator's name across libraries / playlists / search results, not just the song-from-album case (`QUE-2`).

**Tier 4 Phase 1 — admin landing.** Introduced `components/Layout/AdminSettingsLayout.vue` — a persistent left sidebar on desktop, temporary right drawer on mobile, wrapping the existing `SettingsPage`. Every admin page was migrated to it in the same commit (server / apikeys / devices / logs-and-activity / the three `users/*` pages) so the sidebar doesn't pop in and out across navigations. Sidebar entries come from a new `composables/use-admin-sections.ts` registry — single source of truth shared with `pages/settings/index.vue`. Added the dashboard landing itself: `/settings/dashboard` (`DASH-1`: SystemInfo overview + pending-restart / update alerts), an Active sessions block driven by the `Sessions` WebSocket frame with a 10 s polling fallback (`DASH-2`), and an Active transcodes block filtered from the same list (`DASH-3`).

**Tier 4 Phase 2 — server group.** Custom CSS textarea on the existing branding section + a `useServerCustomCss` composable in `App.vue` that maintains a `<style id="server-custom-css">` element synced to `BrandingOptions.CustomCss` (`SRV-2`). New `/settings/backups` listing existing manifests with create-from-options and restore-with-warning dialogs (`SRV-3`; schedule deferred to `TASK-2`). New `/settings/notifications` listing services and types (`SRV-4`; both lists are typically empty without plugins). New `/settings/networking` over the `network` named configuration (`SRV-5`: public access, HTTPS, ports, local network, remote IP filter — list fields edited as newline blobs via computed proxies). New `/settings/dlna` over the `dlna` named configuration (`SRV-6`: server-level toggles, intervals, default user picker).

**Doc & polish.** Recorded the new layout / registry contract in `CLAUDE.md` (`Settings pages` subsection: when to use `SettingsPage` vs `AdminSettingsLayout`, the `meta.admin: true` route-block contract, where to register sidebar entries). Refreshed the `FORK_ROADMAP.md` §1 Settings files row to include the new pages. Filed `B7` in `KNOWN_BUGS.md`: `server.vue` is missing its `meta.admin: true` route block, so `adminGuard` doesn't gate it today. Lint sweep across the touched files (JSDoc descriptions, `Array#toSorted` over `sort`, `undefined` over `null`, an interval-fn `void`-wrap) — pre-existing Vuetify VBtn `onClick` / VCheckbox `boolean | null` type quirks left alone. `LyricsView` got a `data-active` string-coercion fix. Type-check error budget is identical to the session's starting baseline.

**Dev-env fix.** `~/.nvm/alias/default` was pinned to `24.15.0` (was the alias `24`, which had cached to v24.10.0 from before the new install). `~/.zshrc` now calls `nvm use default --silent` after sourcing `nvm.sh` so the nvm bin prepends ahead of `/opt/homebrew/bin` (where Homebrew's still-installed node v26 lives, kept around in case other projects need it).

## Remaining work

Plain-language list of what `PARITY.md` still has as `not started`, grouped for skim-reading. Sequence within each tier is `PARITY.md`'s `seq`.

### Tier 2 — core client (22)

- **Home Screen.** Settings page (`HOME-1`); more home section types like genres / recommendations (`HOME-2`).
- **Libraries.** List view (vs current grid only) (`LIB-1`). Suggestions tab per library (`LIB-2`). Studios / Tags / Years browse views (`LIB-3`). Trigger a library scan from the UI (`LIB-4`).
- **Item detail.** Finish metadata-editor client-side validation (`ITEM-1`). Subtitle search / download (`ITEM-2`). Add item to a collection (`ITEM-3`, needs `COLL-2`). Add item to a playlist (`ITEM-4`, needs `COLL-5`). Extras (`ITEM-5`), trailers (`ITEM-6`), clickable chapters list (`ITEM-7`).
- **Search.** Filters / scope (`SRCH-1`); recent searches & suggestions (`SRCH-2`).
- **User preferences.** New playback-settings page (`PREF-1`). Display-preferences page (`PREF-2`). Preferred audio / subtitle language (`PREF-3`, `PREF-4`). Forced-subtitle auto-enable (`PREF-5`). Controls / media-players page (`PREF-6`).
- **Auth.** Quick Connect sign-in (`AUTH-1`) and authorize (`AUTH-2`). Forgot-password / PIN reset (`AUTH-3`).

### Tier 3 — extended client (22)

- **Live TV (whole tier).** Channel list, EPG, watch a channel, recordings, schedule a recording, series timers, landing page, favorites (`LTV-1` … `LTV-8`).
- **Collections & playlists.** Confirm a BoxSet renders fully (`COLL-1` depth check). Create a collection (`COLL-2`). Edit collection membership (`COLL-3`). View / create / edit / delete a playlist (`COLL-4` … `COLL-7`).
- **Other media.** Photo viewer / slideshow (`MEDIA-1`). EPUB reader (`MEDIA-2` — large). Audiobook parity (`MEDIA-3`, unverified).
- **Casting & SyncPlay.** Cast to a remote Jellyfin session (`CAST-1`, the `CastButton` is currently commented out). SyncPlay: create / join group (`CAST-2`), synchronised playback (`CAST-3`). Chromecast (`CAST-4`), AirPlay (`CAST-5`).

### Tier 4 — admin dashboard (16)

- **Libraries admin.** List / add / edit / delete (`LIBA-1`); display, metadata, NFO settings (`LIBA-2` / `-3` / `-4`).
- **Playback admin.** Transcoding, streaming, resume, trickplay settings (`PBA-1` … `PBA-4`).
- **Live TV admin.** DVR setup (`LTVA-1`); tuners & guides (`LTVA-2`).
- **Plugins.** Installed list (`PLG-1`); catalog (`PLG-2`); per-plugin config pages (`PLG-3`); repositories (`PLG-4`).
- **Scheduled tasks.** List (`TASK-1`); run / configure a task (`TASK-2` — also delivers backup scheduling deferred from `SRV-3`).

### Already-done depth checks (Tier 4)

Six pages PARITY marks `done` but still want a field-for-field verification against jellyfin-web: `SRV-1`, `LOG-1`, `USR-1`, `KEY-1`, `DEV-1`, `WIZ-1`. Each produces follow-up entries only if a gap turns up. Queued as one batch, not blocking on anything.

### Defects (out of PARITY scope)

`KNOWN_BUGS.md` tracks seven bugs unrelated to parity work: `B1` OSD never auto-hides while playing, `B2` bottom gradient not visible, `B3` tab-switch restarts playback (**high** severity), `B4` video contrast/brightness off, `B5` theme-toggle icon overlap, `B6` connection-status flicker on launch, `B7` `server.vue` is missing the admin route guard.
