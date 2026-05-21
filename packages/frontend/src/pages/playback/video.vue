<template>
  <div
    ref="videoContainerRef"
    class="fill-height uno-flex uno-justify-center uno-bg-black !uno-h-screen"
    :class="{ 'uno-cursor-none': !overlay }"
    @mousemove.passive="handleMouseMove"
    @touchend.passive="handleMouseMove"
    @click="handleClick"
    @dblclick="handleDblClick">
    <JOverlay
      class="uno-h-full uno-flex uno-flex-col uno-items-center uno-justify-between"
      :style="{ opacity: overlay ? 1 : 0 }">
      <div class="osd-top pt-s pl-s pr-s">
        <div class="uno-flex uno-items-center uno-px-4 uno-py-2">
          <div class="uno-flex">
            <VBtn
              icon
              @click="playbackManager.stop">
              <JIcon class="i-mdi:close" />
            </VBtn>
            <VBtn
              icon
              @click="playerElement.toggleFullscreenVideoPlayer">
              <JIcon class="i-mdi:chevron-down" />
            </VBtn>
          </div>
          <div class="uno-ml-auto uno-flex uno-items-center">
            <PlaybackMethodBadge class="uno-mr-2" />
            <VBtn
              icon
              @click="playbackStats = !playbackStats">
              <JIcon class="i-mdi:chart-box-outline" />
            </VBtn>
            <CastButton />
          </div>
        </div>
      </div>
      <div
        v-if="currentSegment"
        class="skip-segment-container uno-absolute uno-bottom-40 uno-right-8 uno-z-50">
        <VBtn
          color="primary"
          variant="elevated"
          size="large"
          @click.stop="skipSegment">
          Skip {{ currentSegment.Type }}
        </VBtn>
      </div>
      <div class="pl-s pr-s osd-bottom pb-s">
        <div class="uno-p-4">
          <TimeSlider />
          <div
            class="uno-relative uno-flex uno-items-stretch uno-justify-between">
            <div
              v-if="$vuetify.display.mdAndUp"
              class="video-title uno-mr-auto uno-flex uno-flex-col uno-items-start uno-justify-center">
              <template
                v-if="
                  playbackManager.currentlyPlayingType.value ===
                    BaseItemKind.Episode
                ">
                <span class="text-subtitle-1 uno-mt-1 uno-truncate">
                  {{ playbackManager.currentItem.value?.Name }}
                </span>
                <span class="text--secondary text-subtitle-2 uno-truncate">
                  {{ playbackManager.currentItem.value?.SeriesName }}
                </span>
                <span class="text-subtitle-2 text--secondary uno-truncate">
                  {{
                    $t('seasonEpisode', {
                      seasonNumber:
                        playbackManager.currentItem.value?.ParentIndexNumber,
                      episodeNumber: playbackManager.currentItem.value?.IndexNumber
                    })
                  }}
                </span>
              </template>
              <template v-else>
                <span>{{ playbackManager.currentItem.value?.Name }}</span>
              </template>
              <br>
              <span
                v-if="playbackManager.currentItem.value?.RunTimeTicks"
                class="text-subtitle-2 text--secondary uno-truncate">
                {{ getEndsAtTime((playbackManager.currentItem.value?.RunTimeTicks ?? 0) - msToTicks(playbackManager.currentTime.value * 1000)) }}
              </span>
            </div>
            <div
              class="player-controls justify-md-center uno-flex uno-items-center uno-justify-start">
              <PreviousChapterButton class="uno-mx-1" />
              <PreviousTrackButton class="uno-mx-1" />
              <RewindButton class="uno-mx-1" />
              <PlayPauseButton class="uno-mx-1" />
              <FastForwardButton class="uno-mx-1" />
              <NextTrackButton class="uno-mx-1" />
              <NextChapterButton class="uno-mx-1" />
            </div>
            <div class="ml-md-0 uno-ml-auto uno-flex uno-items-center">
              <VolumeSlider
                v-if="$vuetify.display.smAndUp"
                class="uno-mr-2" />
              <QueueButton close-on-click />
              <SubtitleSelectionButton
                v-if="$vuetify.display.smAndUp"
                v-model="subtitleSelectionButtonOpened" />
              <PlaybackSettingsButton
                v-model="playbackSettingsButtonOpened" />
              <VBtn
                v-if="mediaControls.supportsPictureInPicture"
                class="uno-self-center"
                icon
                @click="mediaControls.togglePictureInPicture">
                <JIcon class="i-mdi:picture-in-picture-bottom-right" />
              </VBtn>
              <JTooltip
                position="top"
                :text="$t('fullScreen')">
                <VBtn
                  v-if="fullscreen.isSupported"
                  class="uno-self-center"
                  icon
                  @click="fullscreen.toggle">
                  <JIcon
                    :class="{
                      'i-mdi:fullscreen': !fullscreen.isFullscreen,
                      'i-mdi:fullscreen-exit': fullscreen.isFullscreen
                    }" />
                </VBtn>
              </JTooltip>
            </div>
          </div>
        </div>
      </div>
    </JOverlay>
    <PlaybackStats v-if="playbackStats" />
    <PausedInfoOverlay />
  </div>
</template>

<route lang="yaml">
meta:
  layout:
    name: fullpage
    transition:
      enter: 'slide-y-reverse'
      leave: 'slide-y'
</route>

<script setup lang="ts">
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { useTimeoutFn, useSwipe } from '@vueuse/core';
import { computed, shallowRef, watch } from 'vue';
import { playbackGuard } from '#/plugins/router/middlewares/playback.ts';
import {
  hasFinePointer,
  mediaControls
} from '#/store/index.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement, videoContainerRef } from '#/store/player-element.ts';
import { getEndsAtTime, msToTicks } from '#/utils/time.ts';
import { usePlayback } from '#/composables/use-playback.ts';

defineOptions({
  beforeRouteEnter: playbackGuard
});

const currentSegment = computed(() => {
  const timeInTicks = msToTicks(playbackManager.currentTime.value * 1000);

  return playbackManager.currentSegments.value.find(
    seg => timeInTicks >= Number(seg.StartTicks) && timeInTicks < Number(seg.EndTicks)
  );
});

/**
 * Skips the current media segment
 */
function skipSegment() {
  if (currentSegment.value) {
    // ticks to seconds
    playbackManager.currentTime.value = Number(currentSegment.value.EndTicks) / 10_000_000;
  }
}

const { fullscreen } = usePlayback();

const osd = shallowRef(true);
const subtitleSelectionButtonOpened = shallowRef(false);
const playbackSettingsButtonOpened = shallowRef(false);
const playbackStats = shallowRef(false);
const staticOverlay = computed(() => [
  playbackManager.isPaused.value,
  subtitleSelectionButtonOpened.value,
  playbackSettingsButtonOpened.value
].some(Boolean));

const overlay = computed({
  get: () => [staticOverlay.value, osd.value].some(Boolean),
  set: newValue => (osd.value = newValue)
});

/**
 * `useTimeoutFn` defaults to `immediate: true` — it would normally auto-
 * start during setup. Disable that and let the `staticOverlay` watcher
 * below own when the timer runs: this way the initial state ("playing,
 * fade after 5 s" vs. "paused, stay visible") is always set explicitly
 * on mount, not as a race between setup-time auto-start and a later
 * watcher firing.
 */
const timeout = useTimeoutFn(() => {
  overlay.value = false;
}, 5000, { immediate: false });

/**
 * Shows the overlay on mouse move and starts the timeout to hide it, unless the overlay must stay static
 */
function handleMouseMove(): void {
  overlay.value = true;
  timeout.start();
}

/**
 * A double-click on the video surface toggles browser fullscreen. To
 * disambiguate from a single click that toggles play/pause, the single-
 * click action is deferred briefly; if a second click lands inside the
 * window, the pending play/pause is cancelled and fullscreen runs
 * instead. 250 ms is the standard double-click threshold most video
 * players (YouTube, jellyfin-web) use.
 */
let pendingClick: ReturnType<typeof setTimeout> | undefined;

/**
 * Toggles play/pause when the video surface is clicked. Clicks on the OSD
 * controls (top/bottom bars) are ignored so buttons don't double-trigger.
 * Mouse only — touch interaction is handled separately.
 */
function handleClick(e: MouseEvent): void {
  if (
    !hasFinePointer.value
    || !(e.target instanceof Element)
    || e.target.closest('.osd-top, .osd-bottom')
  ) {
    return;
  }

  if (pendingClick !== undefined) {
    clearTimeout(pendingClick);
  }

  pendingClick = setTimeout(() => {
    playbackManager.playPause();
    pendingClick = undefined;
  }, 250);
}

/**
 * Toggles browser fullscreen on a double-click. Cancels any pending
 * single-click so play/pause doesn't fire alongside fullscreen.
 */
function handleDblClick(e: MouseEvent): void {
  if (
    !hasFinePointer.value
    || !(e.target instanceof Element)
    || e.target.closest('.osd-top, .osd-bottom')
  ) {
    return;
  }

  if (pendingClick !== undefined) {
    clearTimeout(pendingClick);
    pendingClick = undefined;
  }

  void fullscreen.toggle();
}

let swipeTargetValid = true;

useSwipe(videoContainerRef, {
  threshold: 40,
  onSwipeStart(e) {
    swipeTargetValid = !(e.target instanceof Element && e.target.closest('.osd-top, .osd-bottom, .skip-segment-container'));
  },
  onSwipeEnd(_e, direction) {
    if (!swipeTargetValid) {
      return;
    }

    switch (direction) {
      case 'LEFT': {
        playbackManager.skipBackward();
        break;
      }
      case 'RIGHT': {
        playbackManager.skipForward();
        break;
      }
      case 'UP': {
        playbackManager.volumeUp();
        break;
      }
      case 'DOWN': {
        playbackManager.volumeDown();
        break;
      }
    }
  }
});

/**
 * The OSD's auto-hide timer mirrors `staticOverlay`: stays running when the
 * overlay is dynamic (playing, no menu open) so it can fade after 5 s of
 * inactivity, and is paused while the overlay must remain visible. Running
 * `immediate: true` ensures the timer is in the right state on mount —
 * without it, a player opened in the "playing, no static condition" state
 * had no scheduled fade until the user moved the mouse.
 */
watch(staticOverlay, (val) => {
  if (val) {
    timeout.stop();
  } else {
    timeout.start();
  }
}, { immediate: true });
</script>

<style scoped>
.osd-top,
.osd-bottom {
  width: 100%;
  padding: 8px;
}

.osd-bottom > div,
.osd-top > div {
  max-width: 175vh;
  margin: auto;
}

.osd-top {
  padding-bottom: 5em;
  background: linear-gradient(
    to bottom,
    rgb(var(--j-theme-color-background), 0.75) 0%,
    rgb(var(--j-theme-color-background), 0.74) 8.1%,
    rgb(var(--j-theme-color-background), 0.714) 15.5%,
    rgb(var(--j-theme-color-background), 0.672) 22.5%,
    rgb(var(--j-theme-color-background), 0.618) 29%,
    rgb(var(--j-theme-color-background), 0.556) 35.3%,
    rgb(var(--j-theme-color-background), 0.486) 41.2%,
    rgb(var(--j-theme-color-background), 0.412) 47.1%,
    rgb(var(--j-theme-color-background), 0.338) 52.9%,
    rgb(var(--j-theme-color-background), 0.264) 58.8%,
    rgb(var(--j-theme-color-background), 0.194) 64.7%,
    rgb(var(--j-theme-color-background), 0.132) 71%,
    rgb(var(--j-theme-color-background), 0.078) 77.5%,
    rgb(var(--j-theme-color-background), 0.036) 84.5%,
    rgb(var(--j-theme-color-background), 0.01) 91.9%,
    rgb(var(--j-theme-color-background), 0) 100%
  );
}

.osd-bottom {
  padding-top: 6em;
  background: linear-gradient(
    to top,
    rgb(var(--j-theme-color-background), 0.75) 0%,
    rgb(var(--j-theme-color-background), 0.74) 8.1%,
    rgb(var(--j-theme-color-background), 0.714) 15.5%,
    rgb(var(--j-theme-color-background), 0.672) 22.5%,
    rgb(var(--j-theme-color-background), 0.618) 29%,
    rgb(var(--j-theme-color-background), 0.556) 35.3%,
    rgb(var(--j-theme-color-background), 0.486) 41.2%,
    rgb(var(--j-theme-color-background), 0.412) 47.1%,
    rgb(var(--j-theme-color-background), 0.338) 52.9%,
    rgb(var(--j-theme-color-background), 0.264) 58.8%,
    rgb(var(--j-theme-color-background), 0.194) 64.7%,
    rgb(var(--j-theme-color-background), 0.132) 71%,
    rgb(var(--j-theme-color-background), 0.078) 77.5%,
    rgb(var(--j-theme-color-background), 0.036) 84.5%,
    rgb(var(--j-theme-color-background), 0.01) 91.9%,
    rgb(var(--j-theme-color-background), 0) 100%
  );
}

.player-controls {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.video-title {
  max-width: 40vw;
  height: 6em;
}
</style>
