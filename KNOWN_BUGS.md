# KNOWN_BUGS.md

Defects in jellyfin-vue that are broken **regardless of jellyfin-web** — i.e. not parity work. Parity gaps live in `PARITY.md`; this file is only for things that should work and don't.

Sourced from the fork owner's observed gripes during planning. Severity: `high` (data loss / unusable) / `medium` (degraded) / `low` (cosmetic).

| # | Bug | Symptom | Suspected cause | Likely files | Severity | Status |
|---|---|---|---|---|---|---|
| B1 | Player OSD never auto-hides | The pause/skip/settings controls overlay stays visible and never fades while video is **playing** | Auto-hide logic exists (`useTimeoutFn`, 5 s) but isn't taking effect — timeout never fires, or `staticOverlay` is stuck true, or `@mousemove` keeps restarting it | `pages/playback/video.vue` | medium | open — confirm it happens *while playing* (while paused it stays by design) |
| B2 | Player bottom gradient not visible | The translucent bottom→top gradient behind the OSD doesn't render | **Not a missing feature** — `video.vue` already defines `.osd-bottom` with a full `linear-gradient`. It has regressed or is overridden | `pages/playback/video.vue` (`.osd-bottom` / `.osd-top` styles) | low | open — investigate why the existing gradient doesn't show |
| B3 | Leaving the tab restarts playback | Switching away from the tab and returning restarts the current media from the beginning, losing position | Tab visibility change likely re-triggers `_currentPlaybackInfo` / a source-URL recompute / media-element reload | `store/playback-manager.ts`, `store/player-element.ts`, `components/Playback/PlayerElement.vue`, `store/index.ts` (`isDocumentVisible`) | **high** | open |
| B4 | Video contrast/brightness looks wrong | The video image's contrast/brightness differs from jellyfin-web — looks off | Possibly an overlay tint over the media element, a CSS `filter`, or a colour-handling issue | `pages/playback/video.vue`, `components/Playback/PlayerElement.vue`, theme/overlay styles | medium | open — needs investigation |
| B5 | Top-right app-bar buttons buggy on launch | The buttons in the top-right of the main menu behave incorrectly right after opening jellyfin-vue | Unknown — repro detail needed | `components/Layout/AppBar/*` | medium | open — **needs repro**: what exactly looks wrong (flicker / wrong position / unclickable / wrong icon)? |

## Notes

- **B1 vs the paused-overlay feature:** while *paused*, the OSD staying visible is current intended behaviour. The paused-state info overlay (`PARITY.md` §1.1, gripe G6) is the proper treatment of the paused case. B1 is specifically about the *playing* case.
- **B5** is filed provisionally — it cannot be triaged precisely until the fork owner describes the exact misbehaviour.
- Fixes are out of scope for the current planning pass; this file is the tracking record.
