<template>
  <Transition name="fade">
    <div
      v-if="playbackManager.isPaused.value && playbackManager.isVideo.value && experimentalSettings.state.value.pausedOverlay"
      class="paused-info-overlay uno-absolute uno-rounded-lg uno-px-6 uno-py-5">
      <div class="uno-flex uno-flex-col uno-gap-2">
        <!-- Title row -->
        <template
          v-if="
            playbackManager.currentlyPlayingType.value ===
              BaseItemKind.Episode
          ">
          <span class="text-h6 uno-font-semibold uno-line-clamp-1">
            {{ playbackManager.currentItem.value?.SeriesName }}
          </span>
          <span class="text-subtitle-1 text--secondary uno-line-clamp-1">
            {{ playbackManager.currentItem.value?.Name }}
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
          <span class="text-h6 uno-font-semibold uno-line-clamp-1">
            {{ playbackManager.currentItem.value?.Name }}
          </span>
        </template>

        <!-- Overview -->
        <p
          v-if="playbackManager.currentItem.value?.Overview"
          class="text-body-2 text--secondary uno-mt-1 uno-line-clamp-4 uno-leading-relaxed">
          {{ playbackManager.currentItem.value.Overview }}
        </p>

        <!-- Progress bar -->
        <div
          v-if="playbackManager.currentItem.value?.RunTimeTicks"
          class="uno-mt-2 uno-flex uno-flex-col uno-gap-1">
          <div class="progress-track uno-rounded-full">
            <div
              class="progress-fill uno-rounded-full"
              :style="{ width: `${progressPercent}%` }" />
          </div>
          <div class="uno-flex uno-items-center uno-justify-between">
            <span class="text-caption text--secondary">
              {{ formatTime(playbackManager.currentTime.value) }}
              /
              {{ formatTicks(playbackManager.currentItem.value.RunTimeTicks) }}
            </span>
            <span class="text-caption text--secondary">
              {{ endsAtText }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { playbackManager } from '#/store/playback-manager.ts';
import { experimentalSettings } from '#/store/settings/experimental.ts';
import { formatTime, formatTicks, getEndsAtTime, msToTicks } from '#/utils/time.ts';

const progressPercent = computed(() => {
  const ticks = playbackManager.currentItem.value?.RunTimeTicks;

  if (!ticks) {
    return 0;
  }

  const currentMs = playbackManager.currentTime.value * 1000;
  const totalMs = ticks / 10_000;

  return Math.min(100, (currentMs / totalMs) * 100);
});

const endsAtText = computed(() => {
  const ticks = playbackManager.currentItem.value?.RunTimeTicks;

  if (!ticks) {
    return '';
  }

  const remainingTicks = ticks - msToTicks(playbackManager.currentTime.value * 1000);

  return getEndsAtTime(remainingTicks);
});
</script>

<style scoped>
.paused-info-overlay {
  bottom: 8em;
  left: 2em;
  right: 2em;
  max-width: 36em;
  z-index: 10;
  background: rgb(var(--j-theme-color-background), 0.75);
  backdrop-filter: blur(16px);
  pointer-events: none;
  border: 1px solid rgb(255 255 255 / 0.08);
}

.progress-track {
  height: 4px;
  width: 100%;
  background: rgb(255 255 255 / 0.15);
}

.progress-fill {
  height: 100%;
  background: rgb(var(--j-theme-color-primary));
  transition: width 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
