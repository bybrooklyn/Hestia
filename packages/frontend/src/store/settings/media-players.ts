import type { KeysOfUnion } from 'type-fest';
import { sealed } from '@jellyfin-vue/shared/validation';
import { CommonStore } from '#/store/super/common-store.ts';

/**
 * == INTERFACES AND TYPES ==
 * Persisted media player settings for this client device.
 */
export interface MediaPlayersSettingsState {
  /**
   * Duration in seconds to seek forward.
   * @default 30
   */
  skipForwardDuration: number;
  /**
   * Duration in seconds to seek backward.
   * @default 10
   */
  skipBackwardDuration: number;
  /**
   * Automatically play the next queue item when current media ends.
   * @default true
   */
  autoPlayNextEpisode: boolean;
}

@sealed
class MediaPlayersSettingsStore extends CommonStore<MediaPlayersSettingsState, KeysOfUnion<MediaPlayersSettingsState>> {
  public constructor() {
    super({
      storeKey: 'mediaPlayersSettings',
      defaultState: () => ({
        skipForwardDuration: 30,
        skipBackwardDuration: 10,
        autoPlayNextEpisode: true
      }),
      persistenceType: 'localStorage'
    });
  }
}

export const mediaPlayersSettings = new MediaPlayersSettingsStore();
