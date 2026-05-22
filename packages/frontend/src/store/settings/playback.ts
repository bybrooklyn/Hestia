import type { KeysOfUnion } from 'type-fest';
import { sealed } from '@jellyfin-vue/shared/validation';
import { CommonStore } from '#/store/super/common-store.ts';

/**
 * == INTERFACES AND TYPES ==
 * Persisted playback settings for this client device.
 */
export interface PlaybackSettingsState {
  /**
   * Preferred audio track language (ISO-639-2 3-letter code, e.g. 'eng', 'spa', or 'any').
   * @default 'any'
   */
  preferredAudioLanguage: string;
  /**
   * Preferred subtitle track language (ISO-639-2 3-letter code, e.g. 'eng', 'spa', 'none', or 'any').
   * @default 'any'
   */
  preferredSubtitleLanguage: string;
  /**
   * Automatically play forced subtitles if they are available.
   * @default true
   */
  autoEnableForcedSubtitles: boolean;
  /**
   * Default max streaming bitrate in bps. Undefined means automatic (no limit).
   * @default undefined
   */
  defaultQuality?: number;
  /**
   * Default playback speed/rate.
   * @default 1.0
   */
  defaultSpeed: number;
}

@sealed
class PlaybackSettingsStore extends CommonStore<PlaybackSettingsState, KeysOfUnion<PlaybackSettingsState>> {
  public constructor() {
    super({
      storeKey: 'playbackSettings',
      defaultState: () => ({
        preferredAudioLanguage: 'any',
        preferredSubtitleLanguage: 'any',
        autoEnableForcedSubtitles: true,
        defaultQuality: undefined,
        defaultSpeed: 1
      }),
      persistenceType: 'localStorage'
    });
  }
}

export const playbackSettings = new PlaybackSettingsStore();
