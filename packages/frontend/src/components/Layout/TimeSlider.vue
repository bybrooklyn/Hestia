<template>
  <div class="time-slider-wrapper uno-relative">
    <VSlider
      v-model="sliderValue"
      hide-details
      :max="runtime"
      thumb-label
      validate-on="input"
      @start="clicked = true"
      @end="onRelease">
      <template #prepend>
        {{ formatTime(playbackManager.currentTime.value) }}
      </template>
      <template #thumb-label>
        <div class="thumb-label-content uno-flex uno-flex-col uno-items-center">
          <div
            v-if="trickplayImageStyle"
            class="trickplay-preview uno-mb-2 uno-overflow-hidden uno-rounded uno-shadow-lg"
            :style="trickplayImageStyle" />
          <span>{{ formatTime(sliderValue) }}</span>
        </div>
      </template>
      <template #append>
        {{ formatTime(runtime) }}
      </template>
    </VSlider>
    <div
      v-if="chapters.length > 0"
      class="chapter-markers">
      <JTooltip
        v-for="chapter in chapters"
        :key="chapter.position"
        :text="chapter.name"
        position="top">
        <div
          class="chapter-marker"
          :style="{ left: `${chapter.position}%` }"
          @click.stop="seekTo(chapter.time)" />
      </JTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { playbackManager } from '#/store/playback-manager.ts';
import { remote } from '#/plugins/remote/index.ts';
import { formatTime, ticksToMs } from '#/utils/time.ts';

const currentInput = ref(0);
const clicked = ref(false);
const runtime = computed(() => playbackManager.currentItemRuntime.value / 1000);
const sliderValue = computed({
  get() {
    return clicked.value ? currentInput.value : playbackManager.currentTime.value;
  },
  set(newValue) {
    currentInput.value = newValue;
  }
});

const chapters = computed(() => {
  const items = playbackManager.currentItem.value?.Chapters;
  const totalMs = playbackManager.currentItemRuntime.value;

  if (!items || items.length <= 1 || totalMs <= 0) {
    return [];
  }

  return items
    .filter(ch => ch.StartPositionTicks !== undefined && ch.StartPositionTicks > 0)
    .map(ch => ({
      name: ch.Name ?? '',
      position: (ticksToMs(ch.StartPositionTicks) / totalMs) * 100,
      time: ticksToMs(ch.StartPositionTicks) / 1000
    }));
});

const trickplayData = computed(() => {
  const trickplayObj = playbackManager.currentItem.value?.Trickplay;

  if (!trickplayObj) {
    return;
  }

  const widthKeys = Object.keys(trickplayObj);

  if (!widthKeys.length) {
    return;
  }

  const widthKey = widthKeys[0]!;
  const sourcesObj = trickplayObj[widthKey];

  if (!sourcesObj) {
    return;
  }

  const mediaSourceId = playbackManager.currentMediaSource.value?.Id;
  const info = mediaSourceId && sourcesObj[mediaSourceId]
    ? sourcesObj[mediaSourceId]
    : Object.values(sourcesObj)[0];

  if (!info?.Interval || !info.Width || !info.Height || !info.TileWidth || !info.TileHeight) {
    return;
  }

  const itemId = playbackManager.currentItem.value?.Id;

  if (!itemId) {
    return;
  }

  return { widthKey, info, itemId, mediaSourceId };
});

const trickplayImageStyle = computed(() => {
  const data = trickplayData.value;

  if (!data) {
    return;
  }

  const timeInMs = sliderValue.value * 1000;
  const thumbnailIndex = Math.floor(timeInMs / data.info.Interval!);
  const thumbnailsPerTile = data.info.TileWidth! * data.info.TileHeight!;
  const tileIndex = Math.floor(thumbnailIndex / thumbnailsPerTile);
  const indexInTile = thumbnailIndex % thumbnailsPerTile;

  const col = indexInTile % data.info.TileWidth!;
  const row = Math.floor(indexInTile / data.info.TileWidth!);

  const basePath = remote.sdk.api?.basePath ?? '';
  const token = remote.auth.currentUserToken.value ?? '';

  let url = `${basePath}/Videos/${data.itemId}/Trickplay/${data.widthKey}/${tileIndex}.jpg`;

  if (data.mediaSourceId) {
    url += `?MediaSourceId=${data.mediaSourceId}`;
  }

  if (token) {
    url += (url.includes('?') ? '&' : '?') + `api_key=${token}`;
  }

  return {
    width: `${data.info.Width!}px`,
    height: `${data.info.Height!}px`,
    backgroundImage: `url('${url}')`,
    backgroundPosition: `-${col * data.info.Width!}px -${row * data.info.Height!}px`,
    backgroundSize: `${data.info.TileWidth! * data.info.Width!}px ${data.info.TileHeight! * data.info.Height!}px`
  };
});

/**
 * Once the user releases the slider, change the time of the playbackManager with whatever
 * input value was provided by the user
 */
function onRelease(): void {
  playbackManager.currentTime.value = currentInput.value;
  clicked.value = false;
}

/**
 * Seeks to a specific timestamp in the media.
 *
 * @param time - The target playback time in seconds.
 */
function seekTo(time: number): void {
  playbackManager.currentTime.value = time;
}
</script>

<style scoped>
.time-slider-wrapper {
  position: relative;
}

.chapter-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.chapter-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 14px;
  border-radius: 1.5px;
  background: rgb(255 255 255 / 0.65);
  pointer-events: auto;
  cursor: pointer;
  transition: background 0.15s ease, height 0.15s ease;
}

.chapter-marker:hover {
  background: rgb(var(--j-theme-color-primary));
  height: 18px;
}
</style>
