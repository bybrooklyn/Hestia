/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import type ASSSUBType from 'assjs';
import type { PgsRenderer as PgsRendererType } from 'libpgs';
import { computed, nextTick, shallowRef, watch } from 'vue';
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client/models/subtitle-delivery-method';
import { computedAsync, useFullscreen } from '@vueuse/core';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import { playbackManager } from './playback-manager.ts';
import { mediaElementRef } from '#/store/index.ts';
import { CommonStore } from '#/store/super/common-store.ts';
import { router } from '#/plugins/router/index.ts';
import { remote } from '#/plugins/remote/index.ts';
import type { ParsedSubtitleTrack } from '#/plugins/workers/generic/subtitles.ts';
import { runGenericWorkerFunc } from '#/plugins/workers/index.ts';
import { subtitleSettings } from '#/store/settings/subtitle.ts';

/**
 * == INTERFACES AND TYPES ==
 */
/**
 * TODO: Provide option for the user to select if subtitles should be rendered by the browser or transcoded in server
 * That option must take into account if transcoding is enabled in server (and user has permission to use it as well)
 */
interface SubtitleExternalTrack extends PlaybackExternalTrack {
  parsed?: ParsedSubtitleTrack;
}
interface PlayerElementState {
  fitMode: 'contain' | 'cover' | 'fill';
  currentExternalSubtitleTrack?: SubtitleExternalTrack;
}
interface PlaybackTrack {
  label: string;
  src?: string;
  srcLang?: string;
  srcIndex: number;
  type: SubtitleDeliveryMethod;
  codec?: string;
  Index?: number;
}

export interface PlaybackExternalTrack extends PlaybackTrack {
  src: string;
  codec: string;
}

export const videoContainerRef = shallowRef<HTMLDivElement>();

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class PlayerElementStore extends CommonStore<PlayerElementState, 'fitMode' | 'currentExternalSubtitleTrack'> {
  /**
   * == NON REACTIVE STATE ==
   * Reactive state is defined in the super() constructor
   */
  private readonly _fullscreenVideoRoute = '/playback/video';
  private readonly _cleanups = new Set<() => void>();
  private _asssub: ASSSUBType | undefined;
  private _pgssub: PgsRendererType | undefined;
  /**
   * Lazy-loaded subtitle renderer constructors / worker URL. These chunks
   * (assjs ~34 KiB, libpgs ~63 KiB + worker) only enter the graph when a
   * track of the matching codec is actually applied.
   */
  private _ASSSUBClass: typeof ASSSUBType | undefined;
  private _PgsRendererClass: typeof PgsRendererType | undefined;
  private _pgsWorkerUrl: string | undefined;
  private _assInitPromise: Promise<void> | undefined;
  private _pgsInitPromise: Promise<void> | undefined;

  private readonly _ensureAss = async (): Promise<void> => {
    this._assInitPromise ??= (async () => {
      const mod = await import('assjs');

      this._ASSSUBClass = mod.default;
    })();

    return this._assInitPromise;
  };

  private readonly _ensurePgs = async (): Promise<void> => {
    this._pgsInitPromise ??= (async () => {
      const [mod, workerMod] = await Promise.all([
        import('libpgs'),
        import('libpgs/dist/libpgs.worker.js?url')
      ]);

      this._PgsRendererClass = mod.PgsRenderer;
      this._pgsWorkerUrl = workerMod.default;
    })();

    return this._pgsInitPromise;
  };

  /**
   * Logic for applying custom subtitle track.
   *
   * Returns false if subtitle delivery method isn't external
   * or if device is iOS/Android.
   */
  private readonly _useCustomSubtitleTrack = computed(() =>
    !isNil(playbackManager.currentSubtitleTrack)
    && subtitleSettings.state.value.enabled
    && playbackManager.currentSubtitleTrack.value?.DeliveryMethod === SubtitleDeliveryMethod.External
    /**
     * If useFullscreen isn't supported we can assume the media player is Safari iOS
     * in this case we wouldn't apply a custom subtitle track, since it cannot
     * be rendered in Safari iOS's fullscreen element
     */
    && useFullscreen().isSupported.value
  );

  public readonly currentItemParsedSubtitleTracks = computed(() =>
  /**
   * TODO: There is currently a bug in Jellyfin server when adding external subtitles
   * may play the incorrect subtitle
   * https://github.com/jellyfin/jellyfin/issues/13198
   */
    playbackManager.currentMediaSource.value?.MediaStreams?.filter(
      sub =>
        sub.Type === MediaStreamType.Subtitle
        && (sub.DeliveryMethod === SubtitleDeliveryMethod.Encode
          || sub.DeliveryMethod === SubtitleDeliveryMethod.External)
    )
      .map(
        (stream, index) => ({
          srcIndex: index,
          ...stream
        })
      )
      .map(sub => ({
        label: sub.DisplayTitle ?? 'Undefined',
        src:
          sub.DeliveryMethod === SubtitleDeliveryMethod.External
          && remote.sdk.api?.basePath && sub.DeliveryUrl
            ? `${remote.sdk.api.basePath}${sub.DeliveryUrl}`
            : undefined,
        srcLang: sub.Language ?? undefined,
        type: sub.DeliveryMethod ?? SubtitleDeliveryMethod.Drop,
        srcIndex: sub.srcIndex,
        codec: sub.Codec?.toLowerCase(),
        Index: sub.Index
      }))
  );

  /**
   * Filters the external subtitle tracks
   */
  public readonly currentItemExternalParsedSubtitleTracks = computed(() =>
    this.currentItemParsedSubtitleTracks.value?.filter(
      sub => !isNil(sub.codec) && !isNil(sub.src)
    )
  );

  public readonly currentExternalSubtitleTrack = computedAsync(async () => {
    const el = this.currentItemExternalParsedSubtitleTracks.value?.find(
      sub => sub.Index === playbackManager.currentSubtitleTrack.value?.Index
    ) as SubtitleExternalTrack | undefined;

    if (this._useCustomSubtitleTrack.value && el && !el.parsed) {
      const data = await runGenericWorkerFunc('parseVttFile')(el.src);

      el.parsed = data;
    }

    return el;
  });

  public readonly currentSecondaryExternalSubtitleTrack = computedAsync(async () => {
    const el = this.currentItemExternalParsedSubtitleTracks.value?.find(
      sub => sub.Index === playbackManager.currentSecondarySubtitleTrack.value?.Index
    ) as SubtitleExternalTrack | undefined;

    if (this._useCustomSubtitleTrack.value && el && !el.parsed) {
      const data = await runGenericWorkerFunc('parseVttFile')(el.src);

      el.parsed = data;
    }

    return el;
  });

  public readonly currentItemVttParsedSubtitleTracks = computed(() =>
    this.currentItemExternalParsedSubtitleTracks.value?.filter(
      sub =>
        sub.codec === 'vtt'
        || sub.codec === 'srt'
        || sub.codec === 'subrip'
    )
  );

  public readonly currentItemAssParsedSubtitleTracks = computed(() =>
    this.currentItemExternalParsedSubtitleTracks.value?.filter(
      sub =>
        sub.codec === 'ass'
        || sub.codec === 'ssa'
    )
  );

  public readonly currentItemPgsParsedSubtitleTracks = computed(() =>
    this.currentItemExternalParsedSubtitleTracks.value?.filter(
      sub => sub.codec === 'pgssub'
    )
  );

  private readonly _usingVtt = computed(() =>
    this.currentItemVttParsedSubtitleTracks.value?.some(s => s.Index === playbackManager.currentSubtitleTrack.value?.Index)
  );

  private readonly _usingAss = computed(() =>
    this.currentItemAssParsedSubtitleTracks.value?.some(s => s.Index === playbackManager.currentSubtitleTrack.value?.Index)
  );

  private readonly _usingPgs = computed(() =>
    this.currentItemPgsParsedSubtitleTracks.value?.some(s => s.Index === playbackManager.currentSubtitleTrack.value?.Index)
  );

  /**
   * == ACTIONS ==
   */
  public readonly toggleFullscreenVideoPlayer = async (): Promise<void> => {
    if (router.currentRoute.value.fullPath === this._fullscreenVideoRoute) {
      router.back();
    } else {
      await router.push(this._fullscreenVideoRoute);
    }
  };

  private readonly _fetchSubtitleTrack = async (trackSrc: string) => {
    const axios = remote.sdk.api?.axiosInstance;

    return {
      [trackSrc]: (await axios!.get(trackSrc)).data as string
    };
  };

  /**
   * Applies SSA (SubStation Alpha) subtitles to the media element.
   */
  private readonly _applySsaSubtitles = async (): Promise<void> => {
    if (
      mediaElementRef.value
      && this.currentExternalSubtitleTrack.value
      && (mediaElementRef.value instanceof HTMLVideoElement)
    ) {
      this._clear();

      const trackSrc = this.currentExternalSubtitleTrack.value.src;
      const subtitleTrackPayload = await this._fetchSubtitleTrack(trackSrc);

      if (subtitleTrackPayload[trackSrc]) {
        await this._ensureAss();

        const ASSSUBClass = this._ASSSUBClass;

        if (!ASSSUBClass) {
          return;
        }

        /**
         * video_width works better with ultrawide monitors
         */
        this._asssub = new ASSSUBClass(
          subtitleTrackPayload[trackSrc],
          mediaElementRef.value,
          {
            resampling: 'video_width',
            timeOffset: (playbackManager.subtitleOffset.value ?? 0) / 1000
          } as any
        );

        this._cleanups.add(() => {
          this._asssub?.destroy();
          this._asssub = undefined;
        });
      }
    }
  };

  private readonly _applyPgsSubtitles = async (): Promise<void> => {
    const trackSrc = this.currentExternalSubtitleTrack.value?.src;

    if (trackSrc) {
      if (
        !this._pgssub
        && mediaElementRef.value instanceof HTMLVideoElement
        && this.currentExternalSubtitleTrack.value
      ) {
        await this._ensurePgs();

        if (!this._PgsRendererClass || !this._pgsWorkerUrl) {
          return;
        }

        this._pgssub = new this._PgsRendererClass({
          video: mediaElementRef.value,
          subUrl: trackSrc,
          workerUrl: this._pgsWorkerUrl
        });

        this._cleanups.add(() => {
          this._pgssub?.dispose();
          this._pgssub = undefined;
        });
      } else if (this._pgssub) {
        this._pgssub.loadFromUrl(trackSrc);
      }
    }
  };

  /**
   * Applies VTT (WebVTT) subtitles to the media element.
   */
  private readonly _applyVttSubtitles = () => {
    if (
      mediaElementRef.value
      && this.currentExternalSubtitleTrack.value
    ) {
      const subtitleTrack = this.currentExternalSubtitleTrack.value;

      /**
       * Check if client is able to display custom subtitle track
       * otherwise show default subtitle track
       */
      const vttIndex = this.currentItemVttParsedSubtitleTracks.value?.findIndex(
        sub => sub.Index === subtitleTrack.Index
      );

      if (vttIndex !== undefined && vttIndex !== -1) {
        const track = mediaElementRef.value.textTracks[vttIndex];

        if (!this._useCustomSubtitleTrack.value && !isNil(track)) {
          track.mode = 'showing';
        }
      }
    }
  };

  /**
   * Applies the current subtitle from the playbackManager store
   *
   * It first disables all the VTT and SSA subtitles
   * then filters the streams by codec and passes
   * to the function to apply that codec
   */
  public readonly applyCurrentSubtitle = async (): Promise<void> => {
    if (!mediaElementRef.value) {
      return;
    }

    /**
     * Clear VTT and SSA subs first
     */
    for (const textTrack of mediaElementRef.value.textTracks) {
      if (textTrack.mode !== 'disabled') {
        textTrack.mode = 'disabled';
      }
    }

    this._clear();

    await nextTick();

    /**
     * If selected external track exists,
     * check which subtitle codec is being used and apply
     */
    if (this.currentExternalSubtitleTrack.value) {
      if (this._usingPgs.value) {
        await this._applyPgsSubtitles();
      } else if (this._usingVtt.value) {
        this._applyVttSubtitles();
      } else if (this._usingAss.value) {
        await this._applySsaSubtitles();
      }
    }
  };

  /**
   * Disposes all the subtitle resources
   */
  private readonly _clear = () => {
    for (const func of this._cleanups) {
      func();
    }

    this._cleanups.clear();
  };

  public constructor() {
    super({
      storeKey: 'playerElement',
      defaultState: () => ({
        fitMode: 'contain'
      }),
      resetOnLogout: true
    });

    /**
     * * Move user to the fullscreen page when starting video playback by default
     * * Move user out of the fullscreen pages when playback is over
     */
    watch(playbackManager.isVideo,
      async () => {
        await this.toggleFullscreenVideoPlayer();
      }
    );

    /**
     * We need to destroy JASSUB so the canvas can be recreated in the other view
     */
    watch(videoContainerRef, () => {
      if (!videoContainerRef.value) {
        this._clear();
      }
    }, { flush: 'sync' });

    watch([playbackManager.currentSubtitleTrack, videoContainerRef], async (newVal) => {
      if (newVal[1]) {
        await this.applyCurrentSubtitle();
      }
    }, { flush: 'post' });

    watch(() => playbackManager.subtitleOffset.value, (newOffset) => {
      if (this._asssub) {
        (this._asssub as unknown as { timeOffset: number }).timeOffset = (newOffset ?? 0) / 1000;
      }
    });
  }
}

export const playerElement = new PlayerElementStore();
