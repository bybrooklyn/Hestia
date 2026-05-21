import type { KeysOfUnion } from 'type-fest';
import { sealed } from '@jellyfin-vue/shared/validation';
import { CommonStore } from '#/store/super/common-store.ts';

/**
 * == INTERFACES AND TYPES ==
 *
 * Per-device toggles for which sections appear on the home page
 * (`pages/index.vue`). All sections still get fetched — the toggles only
 * gate rendering, so flipping a toggle costs nothing extra in network
 * traffic. Device-local (localStorage) rather than server-synced because
 * the home layout is a per-client preference.
 */
export interface HomeSettingsState {
  /**
   * Render the "Libraries" tile row at the top of the home page. The
   * libraries are already in the navigation drawer, so the row is largely
   * redundant — defaults to off per `FORK_ROADMAP.md` §9.
   * @default false
   */
  showLibraries: boolean;
  /**
   * Render the "Continue watching" (resume-video) row.
   * @default true
   */
  showContinueWatching: boolean;
  /**
   * Render the "Next up" row for TV shows.
   * @default true
   */
  showNextUp: boolean;
  /**
   * Render the per-library "Latest in {library}" rows.
   * @default true
   */
  showLatestMedia: boolean;
  /**
   * Render the "Continue listening" (resume-audio) row.
   * @default true
   */
  showContinueListening: boolean;
  /**
   * Render the favorite-music rows (Favorite albums / artists / songs).
   * @default true
   */
  showFavorites: boolean;
}

@sealed
class HomeSettingsStore extends CommonStore<HomeSettingsState, KeysOfUnion<HomeSettingsState>> {
  public constructor() {
    super({
      storeKey: 'homeSettings',
      defaultState: () => ({
        showLibraries: false,
        showContinueWatching: true,
        showNextUp: true,
        showLatestMedia: true,
        showContinueListening: true,
        showFavorites: true
      }),
      persistenceType: 'localStorage'
    });
  }
}

export const homeSettings = new HomeSettingsStore();
