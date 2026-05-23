<template>
  <div
    ref="videoContainerRef"
    class="fill-height uno-relative uno-flex uno-justify-center uno-bg-black !uno-h-screen"
    :class="{ 'uno-cursor-none': !overlay }"
    @mousemove.passive="handleMouseMove"
    @touchend.passive="handleMouseMove"
    @click="handleClick"
    @dblclick="handleDblClick">
    <JOverlay
      class="video-osd"
      :style="{ opacity: overlay ? 1 : 0, pointerEvents: overlay ? 'auto' : 'none' }">
      <div class="osd-top">
        <div class="osd-shell osd-header">
          <div class="osd-header-left">
            <JTooltip
              position="bottom"
              :text="$t('stop')">
              <VBtn
                icon
                size="small"
                @click="playbackManager.stop">
                <JIcon class="i-mdi:close" />
              </VBtn>
            </JTooltip>
            <JTooltip
              position="bottom"
              :text="$t('close')">
              <VBtn
                icon
                size="small"
                @click="playerElement.toggleFullscreenVideoPlayer">
                <JIcon class="i-mdi:chevron-down" />
              </VBtn>
            </JTooltip>
            <div
              v-if="$vuetify.display.smAndUp"
              class="video-title">
              <template
                v-if="
                  playbackManager.currentlyPlayingType.value ===
                    BaseItemKind.Episode
                ">
                <span class="video-title-line text-subtitle-2">
                  {{ playbackManager.currentItem.value?.Name }}
                </span>
                <span class="video-title-line video-title-secondary text-caption">
                  {{ playbackManager.currentItem.value?.SeriesName }}
                  ·
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
                <span class="video-title-line text-subtitle-2">
                  {{ playbackManager.currentItem.value?.Name }}
                </span>
              </template>
            </div>
          </div>
          <div class="osd-header-right">
            <PlaybackMethodBadge
              v-if="$vuetify.display.mdAndUp"
              class="uno-mr-2" />
            <CastButton />
          </div>
        </div>
      </div>
      <div
        v-if="currentSegment"
        class="skip-segment-container">
        <VBtn
          color="primary"
          variant="elevated"
          size="large"
          @click.stop="skipSegment">
          {{ skipSegmentLabel }}
        </VBtn>
      </div>
      <div class="osd-bottom">
        <div class="osd-shell osd-controls">
          <TimeSlider class="osd-time-slider" />
          <div
            v-if="$vuetify.display.smAndUp && endsAtLabel"
            class="osd-clockrow text-caption text--secondary">
            <span>{{ endsAtLabel }}</span>
          </div>
          <div class="osd-control-row">
            <div class="osd-control-side osd-control-left">
              <VolumeSlider
                v-if="$vuetify.display.mdAndUp"
                class="osd-volume" />
              <MuteButton v-else />
            </div>
            <div class="osd-transport">
              <PreviousTrackButton
                v-if="$vuetify.display.lgAndUp && playbackManager.previousItem.value"
                size="small" />
              <PreviousChapterButton
                v-if="$vuetify.display.lgAndUp && hasChapters"
                size="small" />
              <RewindButton size="small" />
              <PlayPauseButton size="x-large" />
              <FastForwardButton size="small" />
              <NextChapterButton
                v-if="$vuetify.display.lgAndUp && hasChapters"
                size="small" />
              <NextTrackButton
                v-if="$vuetify.display.lgAndUp && playbackManager.nextItem.value"
                size="small" />
            </div>
            <div class="osd-control-side osd-control-right">
              <QueueButton
                close-on-click
                :size="$vuetify.display.smAndUp ? 32 : 82" />
              <SubtitleSelectionButton
                v-if="$vuetify.display.smAndUp"
                v-model="subtitleSelectionButtonOpened" />
              <PlaybackSettingsButton
                v-model="playbackSettingsButtonOpened" />
              <JTooltip
                position="top"
                :text="$t('menu')">
                <VBtn
                  icon
                  class="uno-self-center">
                  <JIcon class="i-mdi:dots-horizontal" />
                  <VMenu
                    v-model="moreActionsOpened"
                    :close-on-content-click="false"
                    transition="slide-y-transition"
                    location="top">
                    <VCard min-width="260">
                      <VList density="compact">
                        <VListItem
                          :title="$t('playbackStats')"
                          :subtitle="playbackStats ? $t('enabled') : $t('disabled')"
                          @click="togglePlaybackStats">
                          <template #prepend>
                            <JIcon class="i-mdi:chart-box-outline uno-w-10" />
                          </template>
                        </VListItem>
                        <VListItem
                          v-if="playbackManager.currentItem.value"
                          :title="$t('favorite')">
                          <template #prepend>
                            <JIcon class="i-mdi:heart-outline uno-w-10" />
                          </template>
                          <template #append>
                            <LikeButton
                              :key="playbackManager.currentItemId.value"
                              :item="playbackManager.currentItem.value"
                              size="small" />
                          </template>
                        </VListItem>
                        <VListItem
                          v-if="mediaControls.supportsPictureInPicture"
                          :title="$t('pictureInPicture')"
                          @click="mediaControls.togglePictureInPicture">
                          <template #prepend>
                            <JIcon class="i-mdi:picture-in-picture-bottom-right uno-w-10" />
                          </template>
                        </VListItem>
                        <VListItem
                          v-if="playbackManager.playMethod.value && !$vuetify.display.mdAndUp"
                          :title="$t('playback')">
                          <template #prepend>
                            <JIcon class="i-mdi:information-outline uno-w-10" />
                          </template>
                          <template #append>
                            <PlaybackMethodBadge />
                          </template>
                        </VListItem>
                      </VList>
                    </VCard>
                  </VMenu>
                </VBtn>
              </JTooltip>
              <JTooltip
                position="top"
                :text="$t('fullScreen')">
                <VBtn
                  v-if="fullscreen.isSupported && $vuetify.display.smAndUp"
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
import { BaseItemKind, MediaSegmentType } from '@jellyfin/sdk/lib/generated-client';
import { useTimeoutFn, useSwipe } from '@vueuse/core';
import { computed, shallowRef, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
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

const { t } = useTranslation();

const currentSegment = computed(() => {
  const timeInTicks = msToTicks(playbackManager.currentTime.value * 1000);

  return playbackManager.currentSegments.value.find(
    seg => timeInTicks >= Number(seg.StartTicks) && timeInTicks < Number(seg.EndTicks)
  );
});

const skipSegmentLabel = computed(() => {
  switch (currentSegment.value?.Type) {
    case MediaSegmentType.Intro: { return t('skipIntro'); }
    case MediaSegmentType.Outro: { return t('skipOutro'); }
    case MediaSegmentType.Recap: { return t('skipRecap'); }
    case MediaSegmentType.Preview: { return t('skipPreview'); }
    case MediaSegmentType.Commercial: { return t('skipCommercial'); }
    default: { return t('skipIntro'); }
  }
});

const hasChapters = computed(() =>
  (playbackManager.currentItem.value?.Chapters?.length ?? 0) > 1
);

/**
 * "Ends at 9:42 PM" — wall-clock time when playback will finish.
 * Updates in real time via `now.value` inside `getEndsAtTime`.
 */
const endsAtLabel = computed(() => {
  const total = playbackManager.currentItem.value?.RunTimeTicks;

  if (!total) {
    return '';
  }

  const remaining = total - msToTicks(playbackManager.currentTime.value * 1000);

  return getEndsAtTime(remaining);
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
const subtitleSelectionButtonOpened = shallowRef<boolean | undefined>(false);
const playbackSettingsButtonOpened = shallowRef<boolean | undefined>(false);
const moreActionsOpened = shallowRef<boolean | undefined>(false);
const playbackStats = shallowRef(false);
const staticOverlay = computed(() => [
  playbackManager.isPaused.value,
  subtitleSelectionButtonOpened.value,
  playbackSettingsButtonOpened.value,
  moreActionsOpened.value
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
 * Toggles the diagnostics panel from the compact overflow menu.
 */
function togglePlaybackStats(): void {
  playbackStats.value = !playbackStats.value;
  moreActionsOpened.value = false;
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
      case 'left': {
        playbackManager.skipBackward();
        break;
      }
      case 'right': {
        playbackManager.skipForward();
        break;
      }
      case 'up': {
        playbackManager.volumeUp();
        break;
      }
      case 'down': {
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
.video-osd {
  color: #fff;
  user-select: none;
  -webkit-touch-callout: none;
}

.osd-top,
.osd-bottom {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
}

.osd-shell {
  width: min(100%, 1600px);
  margin: 0 auto;
  padding-right: max(16px, env(safe-area-inset-right));
  padding-left: max(16px, env(safe-area-inset-left));
}

.osd-top {
  top: 0;
  padding-top: max(10px, env(safe-area-inset-top));
  padding-bottom: 4.5rem;
  background: linear-gradient(180deg, rgb(0 0 0 / 0.78) 0%, rgb(0 0 0 / 0) 100%);
}

.osd-bottom {
  bottom: 0;
  padding-top: 5rem;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
  background: linear-gradient(0deg, rgb(0 0 0 / 0.82) 0%, rgb(0 0 0 / 0) 100%);
}

.osd-header,
.osd-header-left,
.osd-header-right,
.osd-control-row,
.osd-control-side,
.osd-transport {
  display: flex;
  align-items: center;
}

.osd-header {
  justify-content: space-between;
  gap: 1rem;
  min-height: 40px;
}

.osd-header-left {
  min-width: 0;
  gap: 0.25rem;
}

.osd-header-right {
  flex-shrink: 0;
  gap: 0.25rem;
}

.osd-controls {
  padding-top: 0;
}

.osd-time-slider {
  margin-bottom: -0.4rem;
}

.osd-clockrow {
  display: flex;
  justify-content: flex-end;
  min-height: 1.25rem;
  margin-top: -0.35rem;
}

.osd-control-row {
  position: relative;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 44px;
}

.osd-control-side {
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
}

.osd-control-left {
  justify-content: flex-start;
}

.osd-control-right {
  justify-content: flex-end;
  gap: 0.25rem;
}

.osd-transport {
  position: absolute;
  left: 50%;
  gap: 0.25rem;
  transform: translateX(-50%);
}

.osd-volume {
  width: min(13rem, 24vw);
}

.skip-segment-container {
  position: absolute;
  right: max(2rem, env(safe-area-inset-right));
  bottom: 9rem;
  z-index: 1;
}

.video-title {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: min(42vw, 42rem);
  margin-left: 0.5rem;
  text-shadow: 0 1px 10px rgb(0 0 0 / 0.75);
}

.video-title-line {
  overflow: hidden;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-title-secondary {
  color: rgb(255 255 255 / 0.74);
}

@media (max-width: 959px) {
  .osd-control-row {
    gap: 0.25rem;
  }

  .osd-control-side {
    flex-basis: auto;
  }

  .osd-transport {
    position: static;
    flex: 0 0 auto;
    transform: none;
  }
}

@media (max-width: 599px) {
  .osd-shell {
    padding-right: max(8px, env(safe-area-inset-right));
    padding-left: max(8px, env(safe-area-inset-left));
  }

  .osd-bottom {
    padding-top: 3.5rem;
  }

  .osd-control-right {
    gap: 0;
  }

  .skip-segment-container {
    right: 1rem;
    bottom: 7.5rem;
  }
}
</style>
