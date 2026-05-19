# PARITY.md

The fork's working list for reaching **capability parity** with jellyfin-web. See `CONTEXT.md` for the vocabulary and `docs/adr/0001-*` for the decision behind this effort.

**Baseline:** jellyfin-web `10.11.8` — `apps/stable` + `apps/dashboard` + `apps/wizard` (`apps/experimental` excluded). Re-baselining is a deliberate, separate step.

## How to read this

- Each row is **one capability** ≈ one PR-sized chunk.
- **Type** — `Surfaced` (UI exists in jellyfin-vue but disabled/stub/nonfunctional) or `Absent` (no UI at all).
- **Status** — `not started` / `in progress` / `done`. A row is `done` when the capability is fully usable through jellyfin-vue's own UI, verified against a real Jellyfin server; done rows are struck through, not deleted.
- **Tiers** — work order. T1 playback → T2 core client → T3 extended client → T4 admin dashboard. Within a tier, **Surfaced gaps before Absent gaps**.
- Parity = this list empty. UI parity is *not* a goal (except the admin dashboard's information architecture — see `CONTEXT.md`).

> **Verification note:** jellyfin-web was enumerated exhaustively from source; jellyfin-vue was only spot-checked during discovery. Rows marked **`?`** in Type are unverified against current jellyfin-vue source and must be confirmed before work starts. Do not assume — confirm.

---

# Tier 1 — Playback

*Highest priority (per project brief). Player files: `pages/playback/video.vue`, `pages/playback/music.vue`, `store/playback-manager.ts`, `store/player-element.ts`, `components/Playback/*`, `components/Buttons/Playback/*`.*

## 1.1 Video playback

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Streaming quality / max-bitrate selector | Surfaced | in progress | `PlaybackSettingsButton.vue`, `playback-manager.ts` | PR #2815 / branch `playback-quality-selector`. |
| Click video body to toggle play/pause | Absent | not started | `pages/playback/video.vue` | Gripe G3. Container binds only `@mousemove`/`@touchend`. |
| Paused-state info overlay (title/desc/progress) | Absent | not started | `video.vue`, new overlay component | Gripe G6. Deliver behind an **Experimental** toggle (user preference). |
| In-player media source / version switch | Absent | not started | `PlaybackSettingsButton.vue`, `playback-manager.ts` | Pre-playback selector exists on item page only. |
| Direct-play vs direct-stream vs transcode indicator | Absent | not started | `playback-manager.ts`, new badge | Surfaces existing `_currentPlaybackInfo` data. |
| Transcode reason display | Absent | not started | `playback-manager.ts`, badge/tooltip | `TranscodeReasons` from playback info. |
| Playback stats / info overlay | Absent | not started | new `components/Playback/PlaybackStats.vue` | jellyfin-web's stats overlay. |
| Chapter markers on the scrubber | Absent `?` | not started | `components/Playback/TimeSlider.vue` | Confirm whether chapters are shown. |
| Trickplay thumbnail preview on scrub | Absent | not started | `TimeSlider.vue`, player | Depends on server trickplay data. |
| Skip intro / skip credits (Media Segments) | Absent | not started | `playback-manager.ts`, `video.vue` | Jellyfin Media Segments API. |
| Up-next card near end of episode | Absent `?` | not started | `components/Playback/UpNext.vue` | `UpNext.vue` exists — verify it triggers. |
| Aspect-ratio / zoom control | Surfaced `?` | not started | `PlaybackSettingsButton.vue` | Only a "stretch" toggle today; jellyfin-web has named ratios. |
| Audio / subtitle delay (offset) control | Absent | not started | `playback-manager.ts`, player | |
| Secondary subtitle track | Absent | not started | `player-element.ts` | jellyfin-web supports a second subtitle. |
| Mobile gesture controls (seek/volume/brightness) | Absent | not started | `video.vue` | |
| Cast video to a remote target | Absent | not started | `CastButton.vue` | See §3.4. |

## 1.2 Music playback

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Synced lyrics view during playback | Absent `?` | not started | `pages/playback/music.vue` | jellyfin-web has a lyrics view; confirm jellyfin-vue. |
| Music player full-screen visualizer parity | Surfaced `?` | not started | `components/Playback/MusicVisualizer.vue` | Exists — confirm feature-completeness. |
| Music quality / bitrate selector | Absent `?` | not started | `playback-manager.ts` | |

## 1.3 Queue

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Save current queue as a playlist | Surfaced | not started | `components/Buttons/QueueButton.vue` | Button exists but `disabled`. |
| Accurate "Playing from …" source text | Surfaced | not started | `QueueButton.vue` | Existing TODO referencing upstream PR #609. |

---

# Tier 2 — Core client

## 2.1 Home

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Home Screen settings (configure sections) | Surfaced | not started | `pages/settings/index.vue`, new `pages/settings/home.vue` + store | Disabled settings row. Covers gripe G10 (the "drop Libraries section" preference is a fork-only *default*, see `FORK_ROADMAP.md`). |
| Additional home section types (genres, etc.) | Absent `?` | not started | `utils/items.ts`, `pages/index.vue` | Confirm which jellyfin-web section types are missing. |

## 2.2 Libraries & browsing

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| List/alternate view modes for a library | Absent `?` | not started | `pages/library/[itemId].vue`, `Item/ItemGrid.vue` | Grid exists; confirm list view. |
| Suggestions tab per library | Absent `?` | not started | `pages/library/[itemId].vue` | |
| Studios / Tags / Years browse views | Absent `?` | not started | new pages | jellyfin-vue has genre/artist/person pages. |
| Trigger a library scan from the UI | Absent | not started | item/library pages | |

## 2.3 Item details

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Metadata editor — finish validation | Surfaced | not started | `Item/Metadata/MetadataEditor.vue` | Existing TODOs about client-side validation. |
| Download / search subtitles for an item | Absent `?` | not started | `Item/*` | jellyfin-web's subtitle download dialog. |
| Add item to a collection | Absent `?` | not started | `Item/ItemMenu.vue` | |
| Add item to a playlist | Absent `?` | not started | `Item/ItemMenu.vue` | |
| Special features / extras listing | Absent `?` | not started | `pages/item/[itemId].vue` | |
| Trailers playback | Absent `?` | not started | `pages/item/[itemId].vue` | |
| Chapters list on the detail page | Absent `?` | not started | `pages/item/[itemId].vue` | |
| Item version/edition management | Absent `?` | not started | `Item/*` | |

## 2.4 Search

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Full search scope/filters parity | Surfaced `?` | not started | `pages/search.vue` | QueueButton TODO implies search is partial. |
| Recent searches / suggestions | Absent `?` | not started | `pages/search.vue` | |

## 2.5 User preferences

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Display preferences page | Surfaced `?` | not started | `pages/settings/*`, `store/settings/theme.ts` | jellyfin-web `mypreferencesdisplay`; confirm jellyfin-vue coverage. |
| Playback preferences page | Surfaced | not started | `pages/settings/index.vue`, new `pages/settings/playback.vue` + store | Disabled settings row. Gateway for persisting quality/speed. |
| Preferred audio language | Absent | not started | new playback settings store | |
| Preferred subtitle language | Absent | not started | new playback/subtitle settings | |
| Forced subtitle auto-enable preference | Absent | not started | `player-element.ts`, settings | Gripe-adjacent; jellyfin-web honours forced subs. |
| Controls / media-players preferences page | Surfaced | not started | `pages/settings/index.vue` | Disabled "Media Players" row. |
| Subtitle appearance preferences | done `?` | — | `pages/settings/subtitles.vue` | Present; confirm parity with jellyfin-web options. |

## 2.6 Authentication & connection

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Quick Connect — authorize a code (as user) | Absent `?` | not started | `pages/settings/*` | jellyfin-web `quickconnect`. |
| Quick Connect — sign in via code | Absent `?` | not started | `pages/server/login.vue` | |
| Forgot-password / PIN reset flow | Absent `?` | not started | `pages/server/*` | jellyfin-web `forgotpasswordpin`. |

---

# Tier 3 — Extended client

## 3.1 Live TV *(entirely Absent — jellyfin-vue excludes `livetv`)*

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Live TV channel list | Absent | not started | new pages | |
| Live TV program guide grid | Absent | not started | new pages | |
| Watch a live channel | Absent | not started | new pages, `playback-manager.ts` | |
| Recordings list & playback | Absent | not started | new pages | |
| Schedule a recording | Absent | not started | new pages | |
| Series timers (record a series) | Absent | not started | new pages | |
| Live TV suggested / landing | Absent | not started | new pages | |
| Channel favorites | Absent | not started | new pages | |

## 3.2 Collections & Playlists

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| View a collection (BoxSet) | done `?` | — | `pages/item/[itemId].vue`, `CollectionTabs` | Item page handles BoxSet — confirm. |
| Create a collection | Absent | not started | `Item/*` | |
| Add/remove items to a collection | Absent | not started | `Item/*` | |
| View a playlist | Absent `?` | not started | new page | |
| Create a playlist | Absent | not started | `QueueButton.vue`, `Item/*` | Linked to §1.3 save-as-playlist. |
| Edit / reorder a playlist | Absent | not started | new page | |
| Delete a collection / playlist | Absent | not started | — | |

## 3.3 Other media types

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Photo viewer / slideshow | Absent `?` | not started | new pages | jellyfin-web has a photos experience. |
| Book / e-reader | Absent `?` | not started | new pages | jellyfin-web has an epub reader. |
| Audiobook playback parity | Absent `?` | not started | `playback-manager.ts` | |

## 3.4 Casting, remote & SyncPlay

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Cast to a remote Jellyfin session | Surfaced | not started | `components/Layout/AppBar/Buttons/CastButton.vue` | Whole button is `disabled`; placeholder devices. |
| Control / remote another session | Absent | not started | `CastButton.vue`, new store | |
| SyncPlay — create / join a group | Surfaced | not started | `CastButton.vue` | Placeholder list item exists. |
| SyncPlay — synchronised playback | Absent | not started | `playback-manager.ts`, `remote.socket` | Most upstream-friendly casting slice. |
| Google Cast (Chromecast) | Surfaced | not started | `CastButton.vue` | Placeholder device entry. |
| AirPlay target | Surfaced | not started | `CastButton.vue` | Placeholder device entry. |

---

# Tier 4 — Admin dashboard

*Reimagined per `CONTEXT.md`: jellyfin-vue components/theme, jellyfin-web's dashboard information architecture. Most rows are Absent or Surfaced (disabled settings-index entries).*

## 4.1 Dashboard home & server

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Dashboard landing (server overview) | Absent | not started | new `pages/settings/dashboard.vue` | |
| Active sessions / devices live view | Absent | not started | new page | |
| Active transcodes monitor | Absent | not started | new page | |
| General server settings | Surfaced `?` | not started | `pages/settings/server.vue` | Page exists — confirm coverage vs jellyfin-web. |
| Branding (login disclaimer, custom CSS) | Absent | not started | new page | |
| Backups (create / restore / schedule) | Absent | not started | new page | |
| Server logs | done `?` | — | `pages/settings/logs-and-activity.vue` | Present — confirm parity. |
| Activity log | done `?` | — | `pages/settings/logs-and-activity.vue` | Confirm. |
| Notifications settings | Absent | not started | new page | Disabled settings row. |
| Networking settings | Absent | not started | new page | Disabled settings row. |
| DLNA settings | Absent | not started | new page | Disabled settings row. |

## 4.2 Users (admin)

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| User list | done `?` | — | `pages/settings/users/index.vue` | Present — confirm. |
| Add a user | done `?` | — | `pages/settings/users/new.vue` | Present — confirm. |
| Edit a user | done `?` | — | `pages/settings/users/[id].vue` | Present — confirm. |
| User library/device access control | Surfaced `?` | not started | `pages/settings/users/[id].vue` | jellyfin-web `users/access`. |
| Parental controls | Absent | not started | `pages/settings/users/[id].vue` | jellyfin-web `users/parentalcontrol`. |
| Reset / set a user password (admin) | Surfaced `?` | not started | `pages/settings/users/[id].vue` | jellyfin-web `users/password`. |

## 4.3 Libraries (admin)

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Library list (admin) | Surfaced | not started | `pages/settings/index.vue` | Disabled row. |
| Add / edit / delete a library | Absent | not started | new page | |
| Library display settings | Absent | not started | new page | jellyfin-web `libraries/display`. |
| Metadata settings | Absent | not started | new page | jellyfin-web `libraries/metadata`. |
| NFO settings | Absent | not started | new page | jellyfin-web `libraries/nfo`. |

## 4.4 Playback (admin)

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Transcoding settings | Surfaced | not started | `pages/settings/index.vue` | Disabled "Transcoding & Streaming" row. |
| Streaming settings | Absent | not started | new page | |
| Resume settings | Absent | not started | new page | |
| Trickplay settings | Absent | not started | new page | |

## 4.5 Live TV / DVR (admin)

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Live TV / DVR setup | Surfaced | not started | `pages/settings/index.vue` | Disabled "Live TV" row. |
| Tuner & guide-provider configuration | Absent | not started | new page | |
| Recording defaults | Absent | not started | new page | |

## 4.6 Plugins, tasks, infrastructure (admin)

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| Installed plugins list | Surfaced | not started | `pages/settings/index.vue` | Disabled "Plugins" row. |
| Plugin catalog (browse/install) | Absent | not started | new page | |
| Plugin configuration pages | Absent | not started | new page | jellyfin-web `plugins/:pluginId`. |
| Plugin repositories | Absent | not started | new page | |
| Scheduled tasks list | Surfaced | not started | `pages/settings/index.vue` | Disabled "Scheduled Tasks" row. `store/task-manager.ts` tracks client tasks only. |
| Run / configure a scheduled task | Absent | not started | new page | |
| API keys management | done `?` | — | `pages/settings/apikeys.vue` | Present — confirm. |
| Devices management | done `?` | — | `pages/settings/devices.vue` | Present — confirm. |

## 4.7 Setup wizard

| Capability | Type | Status | Likely jellyfin-vue files | Notes |
|---|---|---|---|---|
| First-run setup wizard parity | Surfaced `?` | not started | `pages/wizard.vue`, `components/Wizard/*` | Wizard exists — confirm step-for-step parity with jellyfin-web. |

---

## Out of scope

- jellyfin-web `apps/experimental` — jellyfin-web's own unfinished next-gen UI.
- UI parity (visual match) — except the admin-dashboard information architecture.

## Related

- **Bugs** (defects regardless of jellyfin-web) — `KNOWN_BUGS.md`.
- **Fork-only QoL** (jellyfin-web doesn't do it either) — `FORK_ROADMAP.md`.
- **Performance** — `PERFORMANCE_NOTES.md`. Performance is the priority *after* parity.

## Status summary

All rows `not started` except the quality selector (`in progress`). Rows marked `done ?` are believed already present in jellyfin-vue and need confirmation only. **`?` Type rows are unverified against current jellyfin-vue source — confirm before starting.**
