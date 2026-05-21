# PARITY.md

The fork's working list for reaching **capability parity** with jellyfin-web. See `CONTEXT.md` for vocabulary and `docs/adr/0001-*` for the decision.

**Baseline:** jellyfin-web `10.11.8` — `apps/stable` + `apps/dashboard` + `apps/wizard` (`apps/experimental` excluded).

## How to read this

Each entry is **one capability** ≈ one PR, with a stable **ID** (used as the commit scope and dependency reference):

> **`ID` — Capability** · `Type` · `status` · seq N · depends: …
> **Design:** approach — files to touch/create, SDK endpoint.
> **Done when:** acceptance criterion.

- **Type** — `Surfaced` (UI exists but disabled/stub) · `Absent` (no UI) · `Partial` (works, incomplete).
- **status** — `not started` / `in progress` / `done`.
- **seq** — implementation order *within the tier*. Tiers run 1→4. Lower seq first.
- **depends** — IDs that must land first.
- Verified against jellyfin-vue source on this pass unless marked **`UNVERIFIED`**.

Parity = every entry `done`. UI parity is not a goal (admin-dashboard IA excepted — `CONTEXT.md`).

---

# Tier 1 — Playback

*Highest priority. Files: `pages/playback/video.vue`, `pages/playback/music.vue`, `store/playback-manager.ts`, `store/player-element.ts`, `components/Playback/*`, `components/Buttons/Playback/*`.*

### Video

**`VID-1` — Streaming quality / max-bitrate selector** · Surfaced · `done` · seq 1 · depends: —
Design: `PlaybackSettingsButton.vue` + `playback-manager.ts` `maxStreamingBitrate`. Landed on `develop`.

**`VID-2` — Click video body to toggle play/pause** · Absent · `done` · seq 2 · depends: —
Design: add `@click` to the video container in `video.vue` → `playbackManager.playPause()`; ignore clicks whose target is inside the OSD controls.
Done when: clicking the video toggles play/pause; OSD buttons unaffected.

**`VID-3` — Direct-play vs transcode indicator** · Absent · `done` · seq 3 · depends: —
Design: expose a `playMethod` computed from the (currently private) `_currentPlaybackInfo` in `playback-manager.ts`; render a small badge in the `video.vue` OSD.
Done when: a direct-play item shows "Direct play"; a transcoded one shows "Transcode".

**`VID-4` — Transcode reason display** · Absent · `done` · seq 4 · depends: `VID-3`
Design: expose `MediaSource.TranscodeReasons` alongside `playMethod`; tooltip on the `VID-3` badge.
Done when: forcing a transcode (e.g. subtitle burn-in) shows the reason(s).

**`VID-5` — Playback stats overlay** · Absent · `done` · seq 5 · depends: —
Design: new `components/Playback/PlaybackStats.vue` reading `mediaControls`, the `hls` instance, and playback info; toggled from the OSD / a key.
Done when: overlay shows live bitrate, codec, buffer, dropped frames.

**`VID-6` — Paused-state info overlay** · Absent · `done` · seq 6 · depends: `EXP-1`
Design: new overlay shown when `isPaused && isVideo` — title, overview, progress, "ends at"; gated behind an Experimental toggle (owner preference).
Done when: pausing shows the overlay; the toggle disables it.

**`VID-7` — In-player media source / version switch** · Absent · `done` · seq 7 · depends: —
Design: add a source `<VSelect>` to `PlaybackSettingsButton.vue` bound to the `playback-manager` source index (reuses the seamless-reload path).
Done when: switching version mid-playback reloads at the current time.

**`VID-8` — Chapter markers on the scrubber** · Absent · `done` · seq 8 · depends: —
Design: read `item.Chapters`; render ticks on the time slider (`<TimeSlider>`).
Done when: chapters appear as markers; hover shows the chapter name.

**`VID-9` — Trickplay thumbnail preview on scrub** · Absent · `done` · seq 9 · depends: —
Design: fetch server trickplay tiles; show a thumbnail on scrub-hover.
Done when: scrubbing shows a preview image.

**`VID-10` — Skip intro / credits (Media Segments API)** · Absent · `done` · seq 10 · depends: —
Design: query the Media Segments API for the item; show a "Skip" button during segment ranges in `video.vue`.
Done when: the skip button appears and seeks past the segment.

**`VID-11` — Aspect-ratio / zoom control** · Absent · `done` · seq 11 · depends: —
Design: replace the single "stretch" toggle in `PlaybackSettingsButton.vue` with named modes (auto / cover / fill) applied via CSS `object-fit`.
Done when: ratio modes are selectable and applied.

**`VID-12` — Audio / subtitle delay (offset) control** · Absent · `done` · seq 12 · depends: —
Design: offset controls in `PlaybackSettingsButton.vue`; apply the subtitle offset in `player-element.ts`.
Done when: offsets visibly shift sync.

**`VID-13` — Secondary subtitle track** · Absent · `done` · seq 13 · depends: —
Design: allow a second active track in `player-element.ts` rendering.
Done when: two subtitle tracks render simultaneously.

**`VID-14` — Mobile gesture controls** · Absent · `done` · seq 14 · depends: —
Design: touch handlers in `video.vue` for seek / volume / brightness.
Done when: gestures work on a touch device.

**`VID-15` — Previous / next track buttons in the OSD** · Absent · `done` · seq 15 · depends: —
Design: `<PreviousTrackButton>` / `<NextTrackButton>` were already mounted in `video.vue` (and `music.vue`); this pass added top-positioned `<JTooltip>` wrappers and i18n labels so they meet the same affordance bar as the fullscreen / PiP buttons next to them.
Done when: both buttons appear in the OSD with tooltips and behave like the keys.

**`VID-16` — Previous / next chapter buttons in the OSD** · Absent · `done` · seq 16 · depends: `VID-8`
Design: new `PreviousChapterButton.vue` / `NextChapterButton.vue` consume the same `item.Chapters` array `TimeSlider.vue` reads. Slotted next to prev/next-track in the OSD center group. The "previous" button uses a 2 s grace window — within the first 2 s of a chapter it jumps to the previous one, after that it restarts the current. Both disabled when the item has no chapters.
Done when: chapter-skip buttons jump cleanly forward / back.

**`VID-17` — Rewind / fast-forward buttons** · Absent · `done` · seq 17 · depends: —
Design: new `RewindButton.vue` / `FastForwardButton.vue` wrap `playbackManager.skipBackward` / `skipForward` (±15 s, same path the `J` / `L` keys take via `use-playback.ts`). Slotted around the play/pause button in the OSD center group with `i-mdi:rewind-15` / `i-mdi:fast-forward-15` icons.
Done when: both buttons appear in the OSD and skip ±15 s.

**`VID-18` — End-at clock + position counter in the scrubber row** · Absent · `done` · seq 18 · depends: —
Design: the "Ends at" line previously rendered inside the title block has been lifted under `<TimeSlider>` and paired with a running "M:SS / H:MM:SS" position counter on the left. Reuses `getEndsAtTime` + the existing `formatTime` (`utils/time.ts`). Hidden on `xs` to avoid cramping mobile.
Done when: the clock + counter render and update with playback.

**`VID-19` — Standalone mute button in the OSD** · Absent · `done` · seq 19 · depends: —
Design: new `MuteButton.vue` next to the volume slider, calling `playbackManager.toggleMute`. Icon tiers (`volume-off` / `volume-mute` / `volume-low` / `volume-medium` / `volume-high`) follow VLC's convention so the loudspeaker bars reflect the current level. Tooltip flips between "Mute" and "Unmute".
Done when: clicking the mute button toggles audio off and back on.

**`VID-20` — User-rating button in the OSD** · Absent · `done` · seq 20 · depends: —
Design: `<LikeButton>` (already used in `music.vue` and across detail pages) mounted in the right-hand OSD group, bound to `playbackManager.currentItem.value` with `:key="currentItemId"` so the async `useApi` instance refreshes on track changes.
Done when: the button appears, reflects current state, and toggles favourite on click.

### Music

**`MUS-1` — Synced lyrics view** · Absent · `done` · seq 21 · depends: —
Design: fetch lyrics via the SDK lyrics API; render a synced view in `music.vue`. (Verified: 0 lyric references in jellyfin-vue.)
Done when: lyrics display and follow playback position.

**`MUS-2` — Music quality / bitrate selector** · Absent · `done` · seq 22 · depends: `VID-1`
Design: reuse the `maxStreamingBitrate` mechanism for audio playback.
Done when: audio streaming quality is selectable.

> *Music visualizer is **done** (`MusicVisualizer.vue`) — not a parity gap.*

### Queue

**`QUE-1` — Save current queue as a playlist** · Surfaced · `done` · seq 23 · depends: —
Design: enable the disabled button in `QueueButton.vue`; call the SDK playlists API `createPlaylist` with the queue item ids.
Done when: the queue becomes a server playlist.

**`QUE-2` — Accurate "Playing from …" source text** · Surfaced · `done` · seq 24 · depends: —
Design: fix `sourceText` in `QueueButton.vue` (the existing TODO; search is now confirmed functional, so it no longer blocks this).
Done when: the queue header shows the correct source.

---

# Tier 2 — Core client

### Experimental scaffold

**`EXP-1` — Experimental settings section + store** · Absent · `done` · seq 1 · depends: —
Design: `pages/settings/experimental.vue` + `store/settings/experimental.ts` (device-local, `localStorage`); settings-index row enabled. Minimal scaffold landed with `VID-6`'s toggle; extend with further toggles as behaviour-changing work arrives (`FORK_ROADMAP.md` §6).

### Home

**`HOME-1` — Home Screen settings page** · Surfaced · `done` · seq 2 · depends: —
Design: new `pages/settings/home.vue` + `store/settings/home.ts` (device-local via `CommonStore` + `localStorage`) with four toggles — `showLibraries`, `showContinueWatching`, `showNextUp`, `showLatestMedia`. `pages/index.vue` reads each from the store before pushing the corresponding `HomeSection` into the list, so flipping a toggle reorders the home immediately without re-fetching. The `showLibraries` default is `false`, delivering `FORK_ROADMAP.md` §9's "drop Libraries section" default. Settings-index row in `use-user-settings-items.ts` now points to the new page.
Done when: the page works and the home screen reflects the configuration.

**`HOME-2` — Additional home section types** · Absent · `not started` · seq 3 · depends: `HOME-1` · **UNVERIFIED** (exact jellyfin-web section list)
Design: add missing section types (e.g. genres, recommendations) in `utils/items.ts` / `index.vue`.
Done when: home section types match jellyfin-web.

### Libraries & browsing

**`LIB-1` — List / alternate view mode** · Absent · `done` · seq 4 · depends: —
Design: new `components/Item/ItemList.vue` renders the same `BaseItemDto[]` as a `VList` of `VListItem` rows (64px thumbnail via `BlurhashImage`, title + per-type subtitle that picks the most useful disambiguator — album artist for music, series name for episodes, year otherwise — and the existing `ItemMenu` in the append slot). `library/[itemId].vue` gains a `VBtnToggle` between the filter button and the play actions that flips `viewMode` between `grid` and `list`; the choice is persisted globally in `localStorage` via `useStorage('library-view-mode', 'grid')`. `ItemGrid.vue` stays grid-only (the name is correct now that the list renderer is its own component).
Done when: the user can switch between grid and list.

**`LIB-2` — Suggestions tab per library** · Absent · `not started` · seq 5 · depends: —
Design: add a Suggestions tab to `library/[itemId].vue` using suggestions/latest/next-up endpoints.
Done when: suggestions show for a library.

**`LIB-3` — Studios / Tags / Years browse views** · Absent · `not started` · seq 6 · depends: —
Design: new pages mirroring the existing `genre`/`person` pages.
Done when: these facets are browsable.

**`LIB-4` — Trigger a library scan from the UI** · Absent · `done` · seq 7 · depends: —
Design: "Scan all libraries" action button in `pages/settings/dashboard.vue`'s `#actions` slot, calling `getLibraryApi.refreshLibrary` via the `remote` SDK. Reports queued/failure via `useSnackbar` — fire-and-forget on the server side.
Done when: a scan can be triggered from the UI.

### Item details

**`ITEM-1` — Metadata editor: finish client-side validation** · Surfaced · `done` · seq 8 · depends: —
Design: wrap the editor's fields in a `<VForm v-model="formValid">` and attach `:rules` to the fields the server validates: Name required, ProductionYear in [1800, 2200], CommunityRating in [0, 10], CriticRating in [0, 100]. Save button is `:disabled="formValid === false"` so it stays usable on initial mount when Vuetify hasn't yet emitted a validation result. The catch-block fallback for server-side `400` is kept as a safety net.
Done when: invalid input is blocked client-side.

**`ITEM-2` — Download / search subtitles for an item** · Absent · `not started` · seq 9 · depends: —
Design: a subtitle-search dialog using the SDK subtitle API.
Done when: subtitles can be searched and downloaded per item.

**`ITEM-3` — Add item to a collection** · Absent · `not started` · seq 10 · depends: `COLL-2`
Design: new action in `Item/ItemMenu.vue` (verified: no such action today) using the collection API.
Done when: an item can be added to a (new or existing) collection.

**`ITEM-4` — Add item to a playlist** · Absent · `not started` · seq 11 · depends: `COLL-5`
Design: new action in `Item/ItemMenu.vue` using the playlists API.
Done when: an item can be added to a playlist.

**`ITEM-5` — Special features / extras** · Absent · `done` · seq 12 · depends: —
Design: `pages/item/[itemId].vue` now fetches `getUserLibraryApi.getSpecialFeatures` alongside the rest of the detail-page queries and renders a "Special features" row above the trailers section (same `VSlideGroup` + `ItemCard` pattern used by `ITEM-6`). Each extra is a `BaseItemDto`, so playback is handled by the card's inline `PlayButton`.
Done when: extras are listed and playable.

**`ITEM-6` — Trailers** · Absent · `done` · seq 13 · depends: —
Design: `pages/item/[itemId].vue` now fetches local trailers in parallel with the rest of the detail page (`useBaseItem(getUserLibraryApi, 'getLocalTrailers')`) and reads `item.RemoteTrailers` (a `MediaUrl[]` of external links — typically YouTube). When either array is non-empty a "Trailers" section renders before the related-items / collection row: local trailers as a `VSlideGroup` of `ItemCard`s (clickable, play via the card's inline `PlayButton`), and remote trailers as outlined `VBtn`s wrapped in native `<a target="_blank" rel="noopener noreferrer">` (VBtn doesn't type `target`/`rel`).
Done when: a trailer is playable from the detail page.

**`ITEM-7` — Chapters list on the detail page** · Absent · `done` · seq 14 · depends: —
Design: horizontal `<VSlideGroup>` of chapter cards on `pages/item/[itemId].vue`, each showing the server-side chapter thumbnail (`ImageType.Chapter` via `getItemImageUrl(itemId, ImageType.Chapter, { tag, imageIndex })`), the chapter name (falling back to `Chapter N`), and the formatted start time. Click → seek if the item is currently playing, otherwise start playback with `startFromTime`.
Done when: chapters are listed and clickable.

### Search

> Verified: search **works** — `pages/search.vue` has Movies/Shows/Albums/Songs/Books/People/Artists tabs, each an `ItemGrid`. Remaining gaps only:

**`SRCH-1` — Result filters / scope** · Absent · `not started` · seq 15 · depends: —
Design: add filter controls (genre/year/etc.) to `search.vue`.
Done when: results can be filtered.

**`SRCH-2` — Recent searches / suggestions** · Absent · `done` · seq 16 · depends: —
Design: persist the last 8 queries via `useStorage` (`search-recent-queries` localStorage key). When `pages/search.vue` is opened with no `?q=`, render the recents as closable chips at the top of the page; clicking one pushes the query back into the route. The `searchDebounced` watcher records every distinct query (case-insensitive dedupe) once it lands.
Done when: recent searches appear.

### User preferences

**`PREF-1` — Playback settings page** · Surfaced · `not started` · seq 17 · depends: —
Design: new `pages/settings/playback.vue` + `store/settings/playback.ts`; enable the disabled "Playback" settings-index row. Gateway for `PREF-3/4/5` and persisted quality/speed.
Done when: the page works and persists.

**`PREF-2` — Display preferences page** · Absent · `not started` · seq 18 · depends: —
Design: new `pages/settings/display.vue` consolidating theme/locale (today scattered in the app bar) and display options.
Done when: a dedicated display-preferences page exists.

**`PREF-3` — Preferred audio language** · Absent · `not started` · seq 19 · depends: `PREF-1`
Design: preference in the playback store; applied during track selection in `playback-manager.ts`.
Done when: the preferred audio track is auto-selected when present.

**`PREF-4` — Preferred subtitle language** · Absent · `not started` · seq 20 · depends: `PREF-1`
Design: as `PREF-3`, for subtitles.
Done when: the preferred subtitle track is auto-selected when present.

**`PREF-5` — Forced-subtitle auto-enable** · Absent · `not started` · seq 21 · depends: `PREF-1`
Design: honour `MediaStream.IsForced` in `player-element.ts`, gated by a preference.
Done when: forced subtitles auto-enable per the preference.

**`PREF-6` — Controls / media-players preferences page** · Surfaced · `not started` · seq 22 · depends: —
Design: new page; enable the disabled "Media Players" settings-index row.
Done when: the page works.

> *Subtitle appearance preferences are **done** (`pages/settings/subtitles.vue`).*

### Authentication

**`AUTH-1` — Quick Connect sign-in (enter code)** · Absent · `not started` · seq 23 · depends: —
Design: add a Quick Connect option to `pages/server/login.vue` using the Quick Connect API. (Verified: Quick Connect appears only in *admin* `server.vue`, not user-facing.)
Done when: a user can sign in via a Quick Connect code.

**`AUTH-2` — Quick Connect authorize (approve a code)** · Absent · `not started` · seq 24 · depends: —
Design: settings UI to approve a pending Quick Connect code.
Done when: a logged-in user can authorize a code.

**`AUTH-3` — Forgot-password / PIN reset flow** · Absent · `not started` · seq 25 · depends: —
Design: new flow under `pages/server/` (jellyfin-web `forgotpasswordpin`).
Done when: the reset flow completes.

---

# Tier 3 — Extended client

> *Live TV (formerly `LTV-1…8`) is **deferred to `FORK_ROADMAP.md` §9** — jellyfin-vue already excludes upstream's `livetv` app, and the fork ships parity without it rather than block the queue behind a from-scratch live-TV implementation. The IDs are preserved verbatim there so they can return if priorities change.*

### Collections & Playlists

**`COLL-1` — View a collection (BoxSet)** · Partial · `not started` · seq 9 · depends: — · **UNVERIFIED depth**
Design: `pages/item/[itemId].vue` already renders BoxSet children via `CollectionTabs` — confirm full parity.
Done when: a collection's contents are fully browsable.

**`COLL-2` — Create a collection** · Absent · seq 10 · Design: collection-create action/dialog. Done when: a collection can be created.
**`COLL-3` — Add / remove items in a collection** · Absent · seq 11 · depends: `COLL-2` · (paired with `ITEM-3`). Done when: collection membership is editable.
**`COLL-4` — View a playlist** · Absent · `not started` · seq 12 · **UNVERIFIED** — confirm whether a `Playlist` item routes through the generic item/library page; if not, a dedicated view is needed. Done when: a playlist's contents are browsable.
**`COLL-5` — Create a playlist** · Absent · seq 13 · (shares the API with `QUE-1`). Done when: a playlist can be created.
**`COLL-6` — Edit / reorder a playlist** · Absent · seq 14 · depends: `COLL-4` · Design: reorder via the existing `DraggableQueue` pattern. Done when: playlists are editable.
**`COLL-7` — Delete a collection / playlist** · Absent · seq 15 · depends: `COLL-1`,`COLL-4` · Done when: both can be deleted.

### Other media types

**`MEDIA-1` — Photo viewer / slideshow** · Absent · seq 16 · Design: new viewer pages. Done when: photos view and slideshow.
**`MEDIA-2` — Book / e-reader** · Absent · seq 17 · Design: an epub reader (large). Done when: a book is readable.
**`MEDIA-3` — Audiobook playback parity** · Absent · `not started` · seq 18 · **UNVERIFIED** — confirm current audiobook handling in `playback-manager.ts`. Done when: audiobooks play with chapter support.

### Casting, remote & SyncPlay

**`CAST-1` — Cast to a remote Jellyfin session** · Surfaced · seq 19 · Design: `CastButton.vue` exists but is **commented out** in `AppBar.vue` — re-mount it and implement session control via `remote.socket`. Done when: playback can target a remote session.
**`CAST-2` — SyncPlay: create / join a group** · Surfaced · seq 20 · depends: `CAST-1` · Done when: a group can be created/joined.
**`CAST-3` — SyncPlay: synchronised playback** · Absent · seq 21 · depends: `CAST-2` · Design: sync via `remote.socket` + `playback-manager`. Done when: playback stays in sync across clients.
**`CAST-4` — Google Cast (Chromecast)** · Surfaced · seq 22 · Design: Cast SDK integration (placeholder entry exists). Done when: casting to Chromecast works.
**`CAST-5` — AirPlay target** · Surfaced · seq 23 · Done when: AirPlay target works.

---

# Tier 4 — Admin dashboard

*Reimagined per `CONTEXT.md`: jellyfin-vue components/theme, jellyfin-web's dashboard information architecture. Most pages are new; existing admin pages need only a depth check.*

### Verified already present (depth check only)

**`SRV-1` — General server settings** · `done` · Design: `pages/settings/server.vue` covers name, language, Quick Connect, paths, branding fields, performance limits. Done when: confirmed at parity depth with jellyfin-web.
**`LOG-1` — Server logs / activity log** · `done` · `pages/settings/logs-and-activity.vue`. Confirm depth.
**`USR-1` — Users admin (list / add / edit / access / parental / password)** · `done` · Verified: `settings/users/*` with Profile/Access/Parental/Password tabs. Confirm depth.
**`KEY-1` — API keys** · `done` · `pages/settings/apikeys.vue`. Confirm depth.
**`DEV-1` — Devices** · `done` · `pages/settings/devices.vue`. Confirm depth.
**`WIZ-1` — First-run setup wizard** · `done` · `pages/wizard.vue` + `components/Wizard/*`. Confirm step-for-step parity.

### Dashboard home

**`DASH-1` — Dashboard landing (server overview)** · Absent · `done` · seq 1 · new `pages/settings/dashboard.vue`. Done when: a server-overview landing exists.
**`DASH-2` — Active sessions / devices live view** · Absent · `done` · seq 2 · depends: `DASH-1` · Done when: live sessions are listed.
**`DASH-3` — Active transcodes monitor** · Absent · `done` · seq 3 · depends: `DASH-1` · Done when: running transcodes are shown.

### Server

**`SRV-2` — Branding (custom CSS)** · Partial · `done` · seq 4 · `server.vue` already has login disclaimer + splash; custom CSS is missing. Done when: custom CSS is configurable.
**`SRV-3` — Backups (create / restore / schedule)** · Absent · `done` · seq 5 · Done when: backups are manageable. *(Scheduling lands as part of `TASK-2`; the API is the same per-task config used by every scheduled task.)*
**`SRV-4` — Notifications settings** · Absent · `done` · seq 6 · disabled settings-index row. Done when: a notifications page exists.
**`SRV-5` — Networking settings** · Absent · `done` · seq 7 · disabled settings-index row. Done when: a networking page exists.
**`SRV-6` — DLNA settings** · Absent · `done` · seq 8 · disabled settings-index row. Done when: a DLNA page exists. *(Per-device DLNA profiles ship with a follow-up if needed; this page covers the server-level options.)*

### Libraries (admin)

**`LIBA-1` — Library list / add / edit / delete** · Surfaced · seq 9 · disabled "Libraries" row. Done when: libraries are manageable.
**`LIBA-2` — Library display settings** · Absent · seq 10 · depends: `LIBA-1` · Done when: display settings editable.
**`LIBA-3` — Metadata settings** · Absent · seq 11 · depends: `LIBA-1` · Done when: metadata settings editable.
**`LIBA-4` — NFO settings** · Absent · seq 12 · depends: `LIBA-1` · Done when: NFO settings editable.

### Playback (admin)

**`PBA-1` — Transcoding settings** · Surfaced · seq 13 · disabled "Transcoding & Streaming" row. Done when: transcoding settings editable.
**`PBA-2` — Streaming settings** · Absent · seq 14 · Done when: streaming settings editable.
**`PBA-3` — Resume settings** · Absent · seq 15 · Done when: resume settings editable.
**`PBA-4` — Trickplay settings** · Absent · seq 16 · Done when: trickplay settings editable.

### Live TV / DVR (admin)

**`LTVA-1` — Live TV / DVR setup** · Surfaced · seq 17 · disabled "Live TV" row. Done when: a DVR setup page exists.
**`LTVA-2` — Tuner & guide-provider configuration** · Absent · seq 18 · depends: `LTVA-1` · Done when: tuners/guides configurable.

### Plugins, tasks (admin)

**`PLG-1` — Installed plugins list** · Surfaced · seq 19 · disabled "Plugins" row. Done when: installed plugins listed.
**`PLG-2` — Plugin catalog (browse / install)** · Absent · seq 20 · depends: `PLG-1` · Done when: plugins installable.
**`PLG-3` — Plugin configuration pages** · Absent · seq 21 · depends: `PLG-1` · Done when: a plugin's config is editable.
**`PLG-4` — Plugin repositories** · Absent · seq 22 · depends: `PLG-1` · Done when: repositories manageable.
**`TASK-1` — Scheduled tasks list** · Surfaced · seq 23 · disabled "Scheduled Tasks" row (`store/task-manager.ts` tracks client tasks only). Done when: server tasks are listed.
**`TASK-2` — Run / configure a scheduled task** · Absent · seq 24 · depends: `TASK-1` · Done when: a task can be run/configured.

---

## Implementation notes

- **Start point:** Tier 1, `VID-1` (in progress) → `VID-2` → … by seq. One commit per ID, commit scope = the ID (e.g. `feat(playback): VID-2 click-to-pause`).
- **Cross-tier prerequisite:** `VID-6` needs `EXP-1` (Tier 2 seq 1) — do `EXP-1` early if the paused overlay is wanted sooner.
- **`UNVERIFIED` entries** — `HOME-2`, `COLL-1` depth, `COLL-4`, `MEDIA-3`: confirm against jellyfin-vue/jellyfin-web before starting that specific entry.
- **`done` Tier 4 entries** are depth-checks, not builds — verify field-for-field parity, file a follow-up entry only if a gap is found.

## Related

- Bugs (defects regardless of jellyfin-web) — `KNOWN_BUGS.md`.
- Fork-only QoL — `FORK_ROADMAP.md` §9.
- Performance (the priority *after* parity) — `PERFORMANCE_NOTES.md`.

## Out of scope

- jellyfin-web `apps/experimental`.
- UI parity (visual match) — except the admin-dashboard information architecture.
- Live TV (formerly `LTV-1…8`) — see `FORK_ROADMAP.md` §9.
- Standard video-player polish beyond jellyfin-web (keyboard help overlay, frame-step, autoplay countdown, resume dialog, A-B loop, PiP state, HDR matching) — also `FORK_ROADMAP.md` §9.
