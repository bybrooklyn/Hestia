import type { KeysOfUnion } from 'type-fest';
import { sealed } from '@jellyfin-vue/shared/validation';
import { CommonStore } from '#/store/super/common-store.ts';

/**
 * == INTERFACES AND TYPES ==
 *
 * Experimental, behaviour-changing toggles. These are device-local (not synced
 * to the server) since they affect how this client behaves, not user data.
 */
export interface ExperimentalSettingsState {
  /**
   * Show an information overlay (title, overview, progress) while video
   * playback is paused.
   * @default false
   */
  pausedOverlay: boolean;
}

@sealed
class ExperimentalSettingsStore extends CommonStore<ExperimentalSettingsState, KeysOfUnion<ExperimentalSettingsState>> {
  public constructor() {
    super({
      storeKey: 'experimentalSettings',
      defaultState: () => ({
        pausedOverlay: false
      }),
      persistenceType: 'localStorage'
    });
  }
}

export const experimentalSettings = new ExperimentalSettingsStore();
