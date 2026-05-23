<template>
  <template v-if="mediaElementType">
    <Teleport
      :to="videoContainerRef"
      :disabled="!videoContainerRef"
      defer>
      <div class="uno-relative">
        <!-- @vue-expect-error: dynamic `<Component :is>` is intentional here -->
        <Component
          :is="mediaElementType"
          v-show="playbackManager.isVideo.value && videoContainerRef"
          ref="mediaElementRef"
          :poster="String(posterUrl)"
          autoplay
          crossorigin
          playsinline
          :loop="playbackManager.isRepeatingOnce.value"
          :class="{
            'uno-object-contain': playerElement.state.value.fitMode === 'contain' || !playerElement.state.value.fitMode,
            'uno-object-cover': playerElement.state.value.fitMode === 'cover',
            'uno-object-fill': playerElement.state.value.fitMode === 'fill',
            'uno-w-screen': playerElement.state.value.fitMode === 'fill' || playerElement.state.value.fitMode === 'cover',
            'uno-h-full uno-max-h-100vh': playbackManager.isVideo.value
          }"
          @loadeddata="onLoadedData">
          <track
            v-for="sub in playerElement.currentItemVttParsedSubtitleTracks.value"
            :key="`${playbackManager.currentSourceUrl.value}-${sub.Index}`"
            kind="subtitles"
            :label="sub.label"
            :srclang="sub.srcLang"
            :src="sub.src">
        </Component>
        <SubtitleTrack
          v-if="subtitleSettings.state.value.enabled && playerElement.currentExternalSubtitleTrack.value?.parsed" />
        <SubtitleTrack
          v-if="subtitleSettings.state.value.enabled && playerElement.currentSecondaryExternalSubtitleTrack.value?.parsed"
          is-secondary />
      </div>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import type {
  default as HlsType,
  ErrorData,
  ErrorTypes as HlsErrorTypesEnum,
  Events as HlsEventsEnum
} from 'hls.js';
import { computed, nextTick, onScopeDispose, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { PromiseQueue } from '@jellyfin-vue/shared/promises';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import {
  mediaElementRef,
  mediaWebAudio
} from '#/store/index.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement, videoContainerRef } from '#/store/player-element.ts';
import { getImageInfo } from '#/utils/images.ts';
import { subtitleSettings } from '#/store/settings/subtitle.ts';

const { t } = useTranslation();
const webAudioQueue = new PromiseQueue();

let HlsEvents: typeof HlsEventsEnum | undefined;
let HlsErrorTypes: typeof HlsErrorTypesEnum | undefined;
let hls: HlsType | undefined;
let hlsInitPromise: Promise<void> | undefined;

/**
 * Lazy-load hls.js + its worker URL on first need so direct-play sources and
 * the unauthenticated startup graph never pay for ~500 KiB of HLS code.
 * Idempotent — the first call kicks off the load; subsequent calls await it.
 */
async function ensureHls(): Promise<void> {
  hlsInitPromise ??= (async () => {
    const [mod, workerMod] = await Promise.all([
      import('hls.js'),
      import('hls.js/dist/hls.worker.js?url')
    ]);

    HlsEvents = mod.Events;
    HlsErrorTypes = mod.ErrorTypes;

    if (mod.default.isSupported()) {
      hls = new mod.default({
        testBandwidth: false,
        workerPath: workerMod.default
      });
    }
  })();

  return hlsInitPromise;
}

/**
 * Attaches the (lazy-constructed) HLS instance to the current media element
 * if one is mounted and we're in a video playback state. Safe to call at any
 * point — it no-ops until both the HLS module and an element are present.
 */
function attachHlsIfReady(): void {
  if (
    hls
    && HlsEvents
    && mediaElementRef.value instanceof HTMLVideoElement
    && playbackManager.isVideo.value
  ) {
    hls.attachMedia(mediaElementRef.value);
    hls.on(HlsEvents.ERROR, onHlsError);
  }
}

const mediaElementType = computed<'audio' | 'video' | undefined>(() => {
  if (playbackManager.isAudio.value) {
    return 'audio';
  } else if (playbackManager.isVideo.value) {
    return 'video';
  }
});

const posterUrl = computed(() =>
  !isNil(playbackManager.currentItem.value)
  && playbackManager.isVideo.value
    ? getImageInfo(playbackManager.currentItem.value, {
      preferBackdrop: true
    }).url
    : undefined
);

/**
 * Detaches HLS instance after playback is done
 */
function detachHls(): void {
  if (hls) {
    hls.detachMedia();

    if (HlsEvents) {
      hls.off(HlsEvents.ERROR, onHlsError);
    }
  }
}

/**
 * Suspends WebAudio when no playback is in place
 */
async function detachWebAudio(): Promise<void> {
  const { context, sourceNode } = mediaWebAudio;

  if (context.value) {
    if (sourceNode.value) {
      sourceNode.value.disconnect();
      sourceNode.value = undefined;
    }

    if (mediaWebAudio.delayNode.value) {
      mediaWebAudio.delayNode.value.disconnect();
      mediaWebAudio.delayNode.value = undefined;
    }

    await context.value.close();
    context.value = undefined;
  }
}

/**
 * Resumes WebAudio when playback is in place
 */
async function attachWebAudio(el: HTMLMediaElement): Promise<void> {
  const { context, sourceNode, delayNode } = mediaWebAudio;

  context.value = new AudioContext();
  sourceNode.value = context.value.createMediaElementSource(el);
  delayNode.value = context.value.createDelay(10);
  delayNode.value.delayTime.value = Math.max(0, (playbackManager.audioOffset.value ?? 0) / 1000);
  await context.value.resume();
  sourceNode.value.connect(delayNode.value);
  delayNode.value.connect(context.value.destination);
}

watch(() => playbackManager.audioOffset.value, (newOffset) => {
  if (mediaWebAudio.delayNode.value) {
    mediaWebAudio.delayNode.value.delayTime.value = Math.max(0, (newOffset ?? 0) / 1000);
  }
});

/**
 * Called by the media element when the playback is ready
 */
async function onLoadedData(): Promise<void> {
  if (playbackManager.isVideo.value) {
    if (mediaElementRef.value) {
      /**
       * Makes the resume start from the correct time
       */
      mediaElementRef.value.currentTime = playbackManager.currentTime.value;
    }

    await playerElement.applyCurrentSubtitle();
  }
}

/**
 * Callback for when HLS.js gets an error
 */
function onHlsError(_event: string, data: ErrorData): void {
  if (!data.fatal || !hls || !HlsErrorTypes) {
    return;
  }

  switch (data.type) {
    case HlsErrorTypes.NETWORK_ERROR: {
      // Try to recover network error
      useSnackbar(t('networkError'), 'error');
      console.error('fatal network error encountered, try to recover');
      hls.startLoad();
      break;
    }
    case HlsErrorTypes.MEDIA_ERROR: {
      useSnackbar(t('mediaError'), 'error');
      console.error('fatal media error encountered, try to recover');
      hls.recoverMediaError();
      break;
    }
    default: {
      /**
       * Can't recover from unknown errors
       */
      useSnackbar(t('cantPlayItem'), 'error');
      playbackManager.stop();
      break;
    }
  }
}

watch(mediaElementRef, () => {
  detachHls();
  void webAudioQueue.add(() => detachWebAudio());

  if (mediaElementRef.value) {
    const mediaEl = mediaElementRef.value;

    attachHlsIfReady();

    if (playbackManager.isAudio.value) {
      void webAudioQueue.add(() => attachWebAudio(mediaEl));
    }
  }
});

watch(playbackManager.currentSourceUrl,
  async (newUrl) => {
    if (hls) {
      hls.stopLoad();
    }

    /**
     * Ensure element is mounted before setting the source.
     */
    await nextTick();

    /**
     * Only pay for hls.js on sources the server can't direct-play. Native
     * HLS (Safari iOS) and direct-play sources keep going through plain
     * `<video src>` and never load the HLS module.
     */
    const needsHls = !!newUrl
      && playbackManager.isVideo.value
      && !playbackManager.currentMediaSource.value?.SupportsDirectPlay;

    if (needsHls) {
      const beforeInit = !!hls;

      await ensureHls();

      if (hls && !beforeInit) {
        attachHlsIfReady();
      }
    }

    if (
      mediaElementRef.value
      && (!newUrl
        || playbackManager.currentMediaSource.value?.SupportsDirectPlay
        || !hls)
    ) {
      /**
       * For the video case, Safari iOS doesn't support hls.js but supports native HLS.
       *
       * We stringify undefined instead of skipping this block when there's no new source url,
       * so the player doesn't restart playback of the previous item
       */
      mediaElementRef.value.src = String(newUrl);
    } else if (
      hls
      && playbackManager.isVideo.value
      && newUrl
    ) {
      /**
       * We need to check if HLS.js can handle transcoded audio to remove the video check
       */
      hls.loadSource(newUrl);
    }
  }
);

onScopeDispose(() => {
  detachHls();
  hls?.destroy();
  void detachWebAudio();
});
</script>
